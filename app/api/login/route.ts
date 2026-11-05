import { NextResponse } from 'next/server';
import { gasStore } from '@/lib/store';
import { COOKIE, cookieOptions, liveConfig, sign } from '@/lib/session';
import type { User } from '@/lib/schema';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const { url, gasSecret } = liveConfig();
    const users = await gasStore(url, gasSecret).list<User>('Users');
    const u = users.find((x) => x.email?.toLowerCase() === String(email ?? '').trim().toLowerCase());
    if (!u || !u.access_code || String(u.access_code) !== String(code ?? '').trim()) {
      return NextResponse.json({ ok: false, error: '이메일 또는 접근 코드가 맞지 않습니다.' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true, user: { email: u.email, name: u.name, is_admin: String(u.is_admin) === 'true' } });
    res.cookies.set(COOKIE, sign(u.email), cookieOptions);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
