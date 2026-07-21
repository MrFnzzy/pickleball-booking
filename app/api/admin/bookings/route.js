import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql, ensureTable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';
import { getTimeSlots, COURT_COUNT } from '@/lib/slots';

function isAuthed() {
  const token = cookies().get('admin_session')?.value;
  return verifySessionToken(token);
}

// GET /api/admin/bookings?from=YYYY-MM-DD  -> all bookings from that date onward (defaults to today)
export async function GET(request) {
  if (!isAuthed()) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureTable();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') || new Date().toISOString().slice(0, 10);

  const rows = await sql`
    SELECT id, name, contact, booking_date, time_slot, court, status,
           receipt_type, amount_paid, payment_reference, created_at
    FROM bookings
    WHERE booking_date >= ${from}
    ORDER BY booking_date ASC, time_slot ASC
  `;

  return NextResponse.json({ bookings: rows });
}

// POST /api/admin/bookings  { name, contact, date, timeSlot, court }
// Same rules as the public endpoint, but lets the admin add a booking on
// someone's behalf (walk-ins, phone bookings, etc). Still blocks double-booking.
export async function POST(request) {
  if (!isAuthed()) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureTable();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const name = String(body.name || '').trim();
  const contact = String(body.contact || '').trim();
  const date = String(body.date || '').trim();
  const timeSlot = String(body.timeSlot || '').trim();
  const court = Number(body.court || 1);

  if (!name || !contact || !date || !timeSlot) {
    return NextResponse.json({ error: 'name, contact, date, and timeSlot are all required' }, { status: 400 });
  }
  if (!getTimeSlots().includes(timeSlot)) {
    return NextResponse.json({ error: 'timeSlot is not a valid slot' }, { status: 400 });
  }
  if (court < 1 || court > COURT_COUNT) {
    return NextResponse.json({ error: 'Invalid court number' }, { status: 400 });
  }

  try {
    const inserted = await sql`
      INSERT INTO bookings (name, contact, booking_date, time_slot, court)
      VALUES (${name}, ${contact}, ${date}, ${timeSlot}, ${court})
      ON CONFLICT (booking_date, time_slot, court) DO NOTHING
      RETURNING id
    `;
    if (inserted.length === 0) {
      return NextResponse.json({ error: 'That slot is already booked' }, { status: 409 });
    }
    return NextResponse.json({ ok: true, id: inserted[0].id }, { status: 201 });
  } catch (err) {
    console.error('Admin booking insert failed', err);
    return NextResponse.json({ error: 'Something went wrong saving that booking' }, { status: 500 });
  }
}
