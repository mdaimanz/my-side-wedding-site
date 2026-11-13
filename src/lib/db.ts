import "server-only";

import { createConnection, type Connection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { MAX_WEDDING_WISHES, normalizeWeddingWishes } from "@/lib/wishes";
import type { AdminGift, GuestRecord, PublicGift, WeddingWish } from "@/types/wedding";

type HyperdriveBinding = {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
};

async function getConnection(): Promise<Connection> {
  const { env } = await import("cloudflare:workers");
  const binding = (env as unknown as { HYPERDRIVE: HyperdriveBinding }).HYPERDRIVE;

  return createConnection({
    host: binding.host,
    user: binding.user,
    password: binding.password,
    database: binding.database,
    port: binding.port,
    disableEval: true,
  });
}

export async function upsertRsvp(input: {
  name: string;
  phoneNumber: string;
  attendance: "attending" | "not_attending";
  guestCount: number;
  message: string | null;
}) {
  const connection = await getConnection();
  try {
    await connection.query(
      `INSERT INTO guests_aiman (name, phone_number, attendance, guest_count, message)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_wish = IF(
           CAST(name AS BINARY) <=> CAST(VALUES(name) AS BINARY)
           AND CAST(message AS BINARY) <=> CAST(VALUES(message) AS BINARY),
           display_wish, FALSE
         ),
         name = VALUES(name),
         attendance = VALUES(attendance),
         guest_count = VALUES(guest_count),
         message = VALUES(message)`,
      [input.name, input.phoneNumber, input.attendance, input.guestCount, input.message],
    );
  } finally {
    await connection.end();
  }
}

export async function listGuests(): Promise<GuestRecord[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<(GuestRecord & RowDataPacket)[]>(
      // A real NOW() expression makes this read uncacheable in Hyperdrive, so
      // publication controls show current state immediately after a mutation.
      `SELECT id, name, phone_number, attendance, guest_count, message, display_wish, updated_at, NOW() AS read_at
       FROM guests_aiman
       ORDER BY updated_at DESC`,
    );
    return rows;
  } finally {
    await connection.end();
  }
}

export async function listWeddingWishes(): Promise<WeddingWish[]> {
  const connection = await getConnection();
  try {
    const wishes: WeddingWish[] = [];
    let offset = 0;

    // Validate before the final limit: legacy Unicode whitespace must not crowd
    // valid wishes out of the latest five. Only public columns leave MySQL.
    while (wishes.length < MAX_WEDDING_WISHES) {
      const [rows] = await connection.query<RowDataPacket[]>(
        // The read timestamp bypasses Hyperdrive query caching. Normalization
        // removes it; public responses still contain only the name and wish.
        `SELECT name AS full_name, message AS wish, NOW() AS read_at
         FROM guests_aiman
         WHERE display_wish = TRUE AND TRIM(name) <> '' AND TRIM(message) <> ''
         ORDER BY updated_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        [MAX_WEDDING_WISHES, offset],
      );
      wishes.push(...normalizeWeddingWishes(rows));
      if (rows.length < MAX_WEDDING_WISHES) break;
      offset += rows.length;
    }
    return wishes.slice(0, MAX_WEDDING_WISHES);
  } finally {
    await connection.end();
  }
}

export async function setWishVisibility(input: {
  guestId: number;
  visible: boolean;
  name: string;
  message: string;
}): Promise<boolean> {
  const connection = await getConnection();
  try {
    // Match the reviewed content too: a concurrent RSVP edit needs fresh approval.
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE guests_aiman SET display_wish = ?
       WHERE id = ?
         AND CAST(name AS BINARY) = CAST(? AS BINARY)
         AND CAST(COALESCE(message, '') AS BINARY) = CAST(? AS BINARY)
         AND (? = FALSE OR (TRIM(name) <> '' AND TRIM(message) <> ''))`,
      [input.visible, input.guestId, input.name, input.message, input.visible],
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

type PublicGiftRow = RowDataPacket & {
  id: number;
  name: string;
  purchase_url: string;
  reserved: 0 | 1;
};

type AdminGiftRow = PublicGiftRow & {
  display_order: number;
  active: 0 | 1;
  gifter_name: string | null;
  gifter_phone: string | null;
  reserved_at: Date | null;
  updated_at: Date;
};

function toPublicGift(row: PublicGiftRow): PublicGift {
  return {
    id: Number(row.id),
    name: row.name,
    purchaseUrl: row.purchase_url,
    reserved: Boolean(row.reserved),
  };
}

export async function listPublicGifts(): Promise<PublicGift[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<PublicGiftRow[]>(
      `SELECT g.id, g.name, g.purchase_url,
              EXISTS(SELECT 1 FROM gift_reservations_aiman r WHERE r.gift_id = g.id) AS reserved,
              NOW() AS read_at
       FROM gifts_aiman g
       WHERE g.active = TRUE
       ORDER BY g.display_order ASC, g.id ASC`,
    );
    return rows.map(toPublicGift);
  } finally {
    await connection.end();
  }
}

export async function listAdminGifts(): Promise<AdminGift[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<AdminGiftRow[]>(
      `SELECT g.id, g.name, g.purchase_url, g.display_order, g.active,
              (r.gift_id IS NOT NULL) AS reserved,
              r.gifter_name, r.gifter_phone, r.reserved_at, g.updated_at,
              NOW() AS read_at
       FROM gifts_aiman g
       LEFT JOIN gift_reservations_aiman r ON r.gift_id = g.id
       ORDER BY g.active DESC, g.display_order ASC, g.id ASC`,
    );
    return rows.map((row) => ({
      ...toPublicGift(row),
      displayOrder: Number(row.display_order),
      active: Boolean(row.active),
      gifterName: row.gifter_name,
      gifterPhone: row.gifter_phone,
      reservedAt: row.reserved_at,
      updatedAt: row.updated_at,
    }));
  } finally {
    await connection.end();
  }
}

export async function createGiftReservation(input: {
  giftId: number;
  name: string;
  phoneNumber: string;
}): Promise<boolean> {
  const connection = await getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO gift_reservations_aiman (gift_id, gifter_name, gifter_phone)
       SELECT g.id, ?, ?
       FROM gifts_aiman g
       WHERE g.id = ? AND g.active = TRUE`,
      [input.name, input.phoneNumber, input.giftId],
    );
    return result.affectedRows === 1;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ER_DUP_ENTRY") {
      return false;
    }
    throw error;
  } finally {
    await connection.end();
  }
}

export async function createGift(input: { name: string; purchaseUrl: string; displayOrder: number }) {
  const connection = await getConnection();
  try {
    await connection.query(
      `INSERT INTO gifts_aiman (name, purchase_url, display_order) VALUES (?, ?, ?)`,
      [input.name, input.purchaseUrl, input.displayOrder],
    );
  } finally {
    await connection.end();
  }
}

export async function updateGift(input: { giftId: number; name: string; purchaseUrl: string; displayOrder: number }): Promise<boolean> {
  const connection = await getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE gifts_aiman SET name = ?, purchase_url = ?, display_order = ? WHERE id = ?`,
      [input.name, input.purchaseUrl, input.displayOrder, input.giftId],
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

export async function setGiftActive(input: { giftId: number; active: boolean }): Promise<boolean> {
  const connection = await getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE gifts_aiman SET active = ? WHERE id = ?`,
      [input.active, input.giftId],
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

export async function releaseGiftReservation(giftId: number): Promise<boolean> {
  const connection = await getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `DELETE FROM gift_reservations_aiman WHERE gift_id = ?`,
      [giftId],
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

