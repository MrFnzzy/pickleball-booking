import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import AdminLogin from '@/components/AdminLogin';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const token = cookies().get('admin_session')?.value;
  const authed = verifySessionToken(token);

  return <div className="page">{authed ? <AdminDashboard /> : <AdminLogin />}</div>;
}
