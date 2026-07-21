'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="eyebrow" style={{ color: '#1c5d6e' }}>
        Court Time — Admin
      </div>
      <h1 style={{ fontSize: 32, margin: '0 0 18px' }}>Manager Login</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit} className="panel">
        <div className="field">
          <label htmlFor="password">Admin password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Checking…' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
