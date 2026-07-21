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
