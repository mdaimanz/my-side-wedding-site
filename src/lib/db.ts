import "server-only";

import { createConnection, type Connection, type RowDataPacket } from "mysql2/promise";
import type { GuestRecord } from "@/types/wedding";

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
      `SELECT id, name, phone_number, attendance, guest_count, message, updated_at
       FROM guests_aiman
       ORDER BY updated_at DESC`,
    );
    return rows;
  } finally {
    await connection.end();
  }
}

