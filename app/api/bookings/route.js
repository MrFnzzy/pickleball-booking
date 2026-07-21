import { NextResponse } from 'next/server';
import { sql, ensureTable } from '@/lib/db';
import { getTimeSlots, COURT_COUNT } from '@/lib/slots';

// GET /api/bookings?date=YYYY-MM-DD
// Returns which slots are booked for that date (no names/contacts exposed publicly).
export async function GET(request) {
  await ensureTable();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'A valid ?date=YYYY-MM-DD is required' }, { status: 400 });
  }

  const rows = await sql`
    SELECT time_slot, court FROM bookings WHERE booking_date = ${date}
  `;

  return NextResponse.json({
    date,
    slots: getTimeSlots(),
    courtCount: COURT_COUNT,
    booked: rows.map((r) => ({ timeSlot: r.time_slot, court: r.court })),
  });
}

// POST /api/bookings  { name, contact, date, timeSlot, court }
// Creates a booking. Relies on the database UNIQUE constraint as the final
// source of truth, so two simultaneous requests for the same slot can never
// both succeed, even if they both pass the initial availability check.
export async function POST(request) {
  await ensureTable();
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  const contact = String(body.contact || '').trim();
  const date = String(body.date || '').trim();
  const timeSlot = String(body.timeSlot || '').trim();
  const court = Number(body.court || 1);

  if (!name || !contact || !date || !timeSlot) {
    return NextResponse.json({ error: 'name, contact, date, and timeSlot are all required' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
  }
  if (!getTimeSlots().includes(timeSlot)) {
    return NextResponse.json({ error: 'timeSlot is not a valid slot' }, { status: 400 });
  }
  if (court < 1 || court > COURT_COUNT) {
    return NextResponse.json({ error: 'Invalid court number' }, { status: 400 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  if (date < todayStr) {
    return NextResponse.json({ error: "You can't book a date in the past" }, { status: 400 });
  }

  try {
    const inserted = await sql`
      INSERT INTO bookings (name, contact, booking_date, time_slot, court)
      VALUES (${name}, ${contact}, ${date}, ${timeSlot}, ${court})
      ON CONFLICT (booking_date, time_slot, court) DO NOTHING
      RETURNING id
    `;

    if (inserted.length === 0) {
      return NextResponse.json(
        { error: 'That slot was just booked by someone else. Please pick another.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, id: inserted[0].id }, { status: 201 });
  } catch (err) {
    console.error('Booking insert failed', err);
    return NextResponse.json({ error: 'Something went wrong saving your booking' }, { status: 500 });
  }
}
