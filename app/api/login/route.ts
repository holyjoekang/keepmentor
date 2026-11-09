import { after, NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/server-store';
import { COOKIE, cookieOptions, sign } from '@/lib/session';
import { context, record, activityCookies } from '@/lib/activity-server';
import type { User } from '@/lib/schema';

export async function POST(req: NextRequest) {
  const c=context(req);
  try {
    const { email, code } = await req.json();
    const users = await serverStore().list<User>('Users');
    const u = users.find((x) => x.email?.toLowerCase() === String(email ?? '').trim().toLowerCase());
    if (!u || !u.access_code || String(u.access_code) !== String(code ?? '').trim()) {
      after(()=>record({...c,user:''},'login_failure',{path:'/login',status:401}));
      return activityCookies(NextResponse.json({ ok: false, error: '이메일 또는 접근 코드가 맞지 않습니다.' }, { status: 401 }),c);
    }
    const res = NextResponse.json({ ok: true, user: { email: u.email, name: u.name, is_admin: String(u.is_admin) === 'true' } });
    res.cookies.set(COOKIE, sign(u.email), cookieOptions);
    after(()=>record({...c,user:u.email},'login_success',{path:'/login',status:200}));
    return activityCookies(res,c);
  } catch (e) {
    after(()=>record({...c,user:''},'login_failure',{path:'/login',status:500}));
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
