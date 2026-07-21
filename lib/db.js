import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Set it in your Vercel project settings or .env.local');
}

export const sql = neon(process.env.DATABASE_URL);

let tableReady = false;

// Creates the bookings table the first time it's needed.
// The UNIQUE constraint is what makes double-booking impossible,
// even if two people submit the exact same slot at the exact same millisecond.
export async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT NOT NULL,
      booking_date DATE NOT NULL,
      time_slot TEXT NOT NULL,
      court INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (booking_date, time_slot, court)
    )
  `;
  tableReady = true;
}
