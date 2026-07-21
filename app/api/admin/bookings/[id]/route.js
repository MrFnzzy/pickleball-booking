import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql, ensureTable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

export async function DELETE(_request, { params }) {
  const token = cookies().get('admin_session')?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureTable();

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  await sql`DELETE FROM bookings WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/bookings/[id]  { action: 'approve' | 'reject' }
// Approve: marks the payment as verified, booking becomes Confirmed.
// Reject: deletes the booking entirely, which immediately frees the slot
// back up for other customers to book.
export async function PATCH(request, { params }) {
  const token = cookies().get('admin_session')?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureTable();

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === 'approve') {
    const updated = await sql`
      UPDATE bookings SET status = 'confirmed' WHERE id = ${id} RETURNING id
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status: 'confirmed' });
  }

  if (action === 'reject') {
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
}
