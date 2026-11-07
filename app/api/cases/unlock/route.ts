import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cookieOptions, sign } from '@/lib/session';

export async function POST(req: Request) {
  const expected = process.env.CASES_CODE;
  if (!expected) return NextResponse.json({ ok: false, error: '사례 열람 코드가 설정되지 않았습니다. 로그인해 주세요.' }, { status: 400 });
  const { code } = await req.json().catch(() => ({ code: '' }));
  const a = Buffer.from(String(code ?? '').trim()), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false, error: '코드가 맞지 않습니다.' }, { status: 401 });
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('km_cases', sign('cases-viewer'), cookieOptions);
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
