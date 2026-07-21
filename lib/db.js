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
      status TEXT NOT NULL DEFAULT 'confirmed',
      receipt_data TEXT,
      receipt_type TEXT,
      amount_paid TEXT,
      payment_reference TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (booking_date, time_slot, court)
    )
  `;
  // These run every cold start but are no-ops once the columns exist —
  // this is what upgrades a database that was created before payment
  // verification was added, without you having to touch the database directly.
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'confirmed'`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS receipt_data TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS receipt_type TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount_paid TEXT`;
  await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_reference TEXT`;
  tableReady = true;
}

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024; // 5MB, matches the spec
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
