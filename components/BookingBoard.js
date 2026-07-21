'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { PAYMENT_INFO, RECEIPT_ACCEPT, RECEIPT_MAX_BYTES } from '@/lib/payment';

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });
}

export default function BookingBoard() {
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [bookedSet, setBookedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState('details'); // 'details' | 'payment'
  const [form, setForm] = useState({ name: '', contact: '', amountPaid: '', paymentReference: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

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
    setStep('details');
    setForm({ name: '', contact: '', amountPaid: '', paymentReference: '' });
    setReceiptFile(null);
    setSelectedSlot(slot);
  }

  function closeModal() {
    if (submitting) return;
    setSelectedSlot(null);
    setReceiptFile(null);
  }

  function goToPayment(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setError('Please enter your name and contact number.');
      return;
    }
    setError('');
    setStep('payment');
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    setError('');
    if (!file) {
      setReceiptFile(null);
      return;
    }
    if (file.size > RECEIPT_MAX_BYTES) {
      setError('That file is over 5MB. Please upload a smaller screenshot or photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setReceiptFile(null);
      return;
    }
    setReceiptFile(file);
  }

  async function submitBooking(e) {
    e.preventDefault();
    if (!receiptFile) {
      setError('Please upload a screenshot or photo of your payment first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const receiptData = await fileToBase64(receiptFile);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          contact: form.contact,
          date,
          timeSlot: selectedSlot,
          court: 1,
          amountPaid: form.amountPaid,
          paymentReference: form.paymentReference,
          receiptData,
          receiptType: receiptFile.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setSelectedSlot(null);
      setReceiptFile(null);
      setSuccess(
        `Payment proof submitted for ${selectedSlot} on ${date}. Your booking is Pending Approval — reference ${data.reference}. We'll confirm as soon as your payment is verified.`
      );
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
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {step === 'details' ? (
              <>
                <h2>Confirm Slot</h2>
                <div className="subtitle">
                  {date} · {selectedSlot}
                </div>
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={goToPayment}>
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
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Continue to Payment
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>Pay &amp; Upload Proof</h2>
                <div className="subtitle">
                  {date} · {selectedSlot}
                </div>
                {error && <div className="error-banner">{error}</div>}
                <p className="payment-instructions">{PAYMENT_INFO.instructions}</p>
                <div className="qr-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/payment-qr.png" alt="Scan to pay via GoTyme / InstaPay" className="qr-image" />
                  <div className="qr-meta">
                    <div>{PAYMENT_INFO.bank}</div>
                    <div>{PAYMENT_INFO.accountName}</div>
                    <div>Account ending {PAYMENT_INFO.accountNumberLast4}</div>
                  </div>
                </div>
                <form onSubmit={submitBooking}>
                  <div className="field">
                    <label htmlFor="amountPaid">Amount paid (optional)</label>
                    <input
                      id="amountPaid"
                      placeholder="e.g. 200"
                      value={form.amountPaid}
                      onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="paymentReference">Payment reference no. (optional)</label>
                    <input
                      id="paymentReference"
                      placeholder="From your GCash/bank app"
                      value={form.paymentReference}
                      onChange={(e) => setForm((f) => ({ ...f, paymentReference: e.target.value }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="receipt">Upload screenshot or photo of payment</label>
                    <input
                      id="receipt"
                      type="file"
                      ref={fileInputRef}
                      accept={RECEIPT_ACCEPT}
                      onChange={onFileChange}
                    />
                    <div className="field-hint">Image or PDF, max 5MB.</div>
                  </div>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setStep('details')}
                      disabled={submitting}
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit Payment Proof'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
