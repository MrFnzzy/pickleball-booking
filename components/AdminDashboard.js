'use client';

import { useEffect, useState, useCallback } from 'react';

const TIME_SLOTS = [];
for (let h = 6; h < 21; h++) {
  const fmt = (x) => {
    const period = x >= 12 ? 'PM' : 'AM';
    let h12 = x % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:00 ${period}`;
  };
  TIME_SLOTS.push(`${fmt(h)} - ${fmt(h + 1)}`);
}

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', date: todayISO(), timeSlot: TIME_SLOTS[0] });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load bookings');
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  }

  async function removeBooking(id) {
    if (!confirm('Remove this booking?')) return;
    await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
    load();
  }

  async function addBooking(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, court: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add booking');
      setShowAdd(false);
      setForm({ name: '', contact: '', date: todayISO(), timeSlot: TIME_SLOTS[0] });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner admin-header">
          <div>
            <div className="eyebrow">Court Time — Admin</div>
            <h1 style={{ fontSize: 34 }}>Manager Dashboard</h1>
          </div>
          <button className="btn btn-ghost" style={{ color: 'white', borderColor: 'white' }} onClick={logout}>
            Log Out
          </button>
        </div>
      </div>

      <div className="container">
        {error && <div className="error-banner">{error}</div>}

        <div className="panel">
          <div className="admin-header" style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 22, margin: 0 }}>All Upcoming Bookings</h2>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowAdd(true)}>
              + Add Booking
            </button>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : bookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <table className="bookings">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.booking_date.slice(0, 10)}</td>
                    <td>{b.time_slot}</td>
                    <td>{b.name}</td>
                    <td>{b.contact}</td>
                    <td>
                      <button className="btn btn-danger small-btn" onClick={() => removeBooking(b.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="modal-backdrop" onClick={() => !saving && setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Booking</h2>
            <div className="subtitle">Manually add a walk-in or phone booking.</div>
            <form onSubmit={addBooking}>
              <div className="field">
                <label>Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Contact number</label>
                <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} />
              </div>
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Time slot</label>
                <select
                  value={form.timeSlot}
                  onChange={(e) => setForm((f) => ({ ...f, timeSlot: e.target.value }))}
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
