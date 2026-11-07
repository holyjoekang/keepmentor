import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import cases from '@/data/cases.json';
import { COOKIE, verify } from '@/lib/session';

export const dynamic = 'force-dynamic';
const CASES_COOKIE = 'km_cases';

// 사례집은 인증한 사람만 본다: live 로그인 세션 또는 사례 열람 코드(CASES_CODE)
export async function GET() {
  const jar = await cookies();
  let ok = false;
  try {
    ok = !!verify(jar.get(COOKIE)?.value) || verify(jar.get(CASES_COOKIE)?.value) === 'cases-viewer';
  } catch {
    ok = false;
  }
  if (!ok) return NextResponse.json({ ok: false, locked: true, codeEnabled: !!process.env.CASES_CODE }, { status: 401 });
  return NextResponse.json({ ok: true, data: cases });
}
