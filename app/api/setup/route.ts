import { NextResponse } from 'next/server';
import { gasSetup, gasStore } from '@/lib/store';
import { liveConfig } from '@/lib/session';
import { newId, nowIso, type User } from '@/lib/schema';

// 설정 상태 점검 (비밀값은 노출하지 않고, 설정 여부와 Apps Script 응답만 알려 준다)
export async function GET() {
  const env = {
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE === 'live' ? 'live' : 'demo',
    GAS_URL: !!process.env.GAS_URL,
    GAS_SECRET: !!process.env.GAS_SECRET,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    NEXT_PUBLIC_CONTACT_EMAIL: !!process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  };
  let gas: { reachable: boolean; detail: string } = { reachable: false, detail: 'GAS_URL이 없습니다.' };
  if (process.env.GAS_URL) {
    try {
      const r = await fetch(process.env.GAS_URL, { redirect: 'follow', cache: 'no-store' });
      const t = await r.text();
      gas = t.includes('keepmentor')
        ? { reachable: true, detail: 'Apps Script 웹앱이 응답합니다.' }
        : { reachable: false, detail: `응답은 왔지만 Keep Mentor 스크립트가 아닙니다 (HTTP ${r.status}). 배포 URL(/exec)과 액세스 권한 "모든 사용자"를 확인하세요.` };
    } catch (e) {
      gas = { reachable: false, detail: `연결 실패: ${(e as Error).message}` };
    }
  }
  return NextResponse.json({ ok: true, env, gas });
}

// 최초 1회: 시트 생성 + 첫 관리자 등록. GAS_SECRET을 아는 사람만 실행할 수 있다.
export async function POST(req: Request) {
  try {
    const { secret, admin_email, admin_name, admin_code } = await req.json();
    const { url, gasSecret } = liveConfig();
    if (secret !== gasSecret) return NextResponse.json({ ok: false, error: '비밀값이 맞지 않습니다.' }, { status: 403 });
    const setup = await gasSetup(url, gasSecret);
    if (!setup.ok) return NextResponse.json(setup, { status: 500 });
    if (admin_email && admin_code) {
      const store = gasStore(url, gasSecret);
      const users = await store.list<User>('Users');
      if (!users.some((u) => u.email?.toLowerCase() === String(admin_email).toLowerCase())) {
        await store.insert<User>('Users', {
          id: newId('USR'), email: String(admin_email).toLowerCase(), name: String(admin_name || '관리자'),
          access_code: String(admin_code), is_admin: true, created_at: nowIso(),
        });
      }
    }
    return NextResponse.json({ ok: true, sheets: setup.result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
