import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql, ensureTable } from '@/lib/db';
import { verifySessionToken } from '@/lib/auth';

// GET /api/admin/bookings/[id]/receipt
// Streams the uploaded payment proof back so the admin can inspect it
// before approving or rejecting the booking. Admin-only — the browser
// sends the admin_session cookie automatically since this is same-origin.
export async function GET(_request, { params }) {
  const token = cookies().get('admin_session')?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureTable();

  const id = Number(params.id);
  if (!id) {
    return NextResponse.json({ error: 'Invalid booking id' }, { status: 400 });
  }

  const rows = await sql`
    SELECT receipt_data, receipt_type FROM bookings WHERE id = ${id}
  `;

  if (rows.length === 0 || !rows[0].receipt_data) {
    return NextResponse.json({ error: 'No receipt on file for this booking' }, { status: 404 });
  }

  const bytes = Buffer.from(rows[0].receipt_data, 'base64');
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': rows[0].receipt_type || 'application/octet-stream',
      'Content-Disposition': 'inline; filename="receipt"',
      'Cache-Control': 'private, no-store',
    },
  });
}
