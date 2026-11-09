import { after, NextRequest, NextResponse } from 'next/server';
import { context, record, activityCookies } from '@/lib/activity-server';
import { COOKIE } from '@/lib/session';

export async function POST(req:NextRequest) {
  const c=context(req);
  after(()=>record(c,'logout',{path:'/login',status:200}));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { path: '/', maxAge: 0 });
  return activityCookies(res,c);
}
