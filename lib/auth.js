import crypto from 'crypto';

const SECRET = process.env.ADMIN_SECRET || 'dev-only-insecure-secret';
const SESSION_HOURS = 12;

export function createSessionToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 });
  const body = Buffer.from(payload).toString('base64url');
  const sig = sign(body);
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [body, sig] = token.split('.');
  if (sign(body) !== sig) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function sign(body) {
  return crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
}
