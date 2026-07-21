import BookingBoard from '@/components/BookingBoard';

export default function HomePage() {
  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-inner">
          <div className="eyebrow">Court Time</div>
          <h1>Book The Court</h1>
          <p>Pick a date, grab an open hour, and you're on. No account needed.</p>
        </div>
      </div>
      <div className="container">
        <BookingBoard />
      </div>
    </div>
  );
}
