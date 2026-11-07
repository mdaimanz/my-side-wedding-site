import "server-only";

import { createConnection, type Connection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { MAX_WEDDING_WISHES, normalizeWeddingWishes } from "@/lib/wishes";
import type { GuestRecord, WeddingWish } from "@/types/wedding";

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

