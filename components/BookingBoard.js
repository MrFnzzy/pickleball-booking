'use client';

import { useEffect, useState, useCallback } from 'react';

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export default function BookingBoard() {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [bookedSet, setBookedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/bookings?date=${date}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load schedule');
      setSlots(data.slots);
      setBookedSet(new Set(data.booked.map((b) => `${b.timeSlot}|${b.court}`)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  function openModal(slot) {
    setSuccess('');
    setError('');
    setForm({ name: '', contact: '' });
    setSelectedSlot(slot);
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setError('Please enter your name and contact number.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          date,
          timeSlot: selectedSlot,
          court: 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSelectedSlot(null);
      setSuccess(`You're booked for ${selectedSlot} on ${date}.`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {success && <div className="success-banner">{success}</div>}

      <div className="panel">
        <div className="date-row">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="legend">
            <span>
              <span className="swatch open" /> Open
            </span>
            <span>
              <span className="swatch taken" /> Booked
            </span>
          </div>
        </div>

        {error && !selectedSlot && <div className="error-banner">{error}</div>}

        {loading ? (
          <p>Loading schedule…</p>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => {
              const taken = bookedSet.has(`${slot}|1`);
              return (
                <button
                  key={slot}
                  type="button"
                  className={`slot ${taken ? 'taken' : 'open'}`}
                  disabled={taken}
                  onClick={() => !taken && openModal(slot)}
                >
                  <div className="time">{slot}</div>
                  <div className="status">{taken ? 'Booked' : 'Available'}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="modal-backdrop" onClick={() => !submitting && setSelectedSlot(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Slot</h2>
            <div className="subtitle">
              {date} · {selectedSlot}
            </div>
            {error && <div className="error-banner">{error}</div>}
            <form onSubmit={submitBooking}>
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="contact">Contact number</label>
                <input
                  id="contact"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setSelectedSlot(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Booking…' : 'Book This Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
