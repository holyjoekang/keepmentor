import { createHmac, timingSafeEqual } from 'node:crypto';

// 서버 전용: 서명된 세션 쿠키 (live 모드)
export const COOKIE = 'km_session';
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET 환경변수가 없습니다.');
  return s;
}

export function sign(email: string): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ email, exp })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verify(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expect = createHmac('sha256', secret()).update(payload).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { email, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return exp > Date.now() / 1000 ? String(email) : null;
  } catch {
    return null;
  }
}

export const cookieOptions = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: MAX_AGE_SEC };

export function liveConfig() {
  const url = process.env.GAS_URL, gasSecret = process.env.GAS_SECRET;
  if (!url || !gasSecret) throw new Error('live 모드에는 GAS_URL과 GAS_SECRET 환경변수가 필요합니다.');
  return { url, gasSecret };
}
