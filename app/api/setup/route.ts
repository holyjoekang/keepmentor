import { NextResponse } from 'next/server';
import { gasSetup } from '@/lib/store';
import { liveConfig } from '@/lib/session';
import { newId, nowIso, SHEETS, type User } from '@/lib/schema';
import { serverStore, storageProvider, configuredSupabaseStore } from '@/lib/server-store';
import { timingSafeEqual } from 'node:crypto';

// 설정 상태 점검 (비밀값은 노출하지 않고, 설정 여부와 Apps Script 응답만 알려 준다)
export async function GET() {
  const env = {
    NEXT_PUBLIC_MODE: process.env.NEXT_PUBLIC_MODE === 'live' ? 'live' : 'demo',
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'sheets',
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    SETUP_SECRET: !!process.env.SETUP_SECRET,
    GAS_URL: !!process.env.GAS_URL,
    GAS_SECRET: !!process.env.GAS_SECRET,
    SESSION_SECRET: !!process.env.SESSION_SECRET,
    NEXT_PUBLIC_CONTACT_EMAIL: !!process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  };
  if (process.env.STORAGE_PROVIDER === 'supabase') {
    try {
      await configuredSupabaseStore().check();
      return NextResponse.json({ ok: true, env, gas: { reachable: true, detail: 'Supabase의 모든 테이블에 연결했습니다.' } });
    } catch {
      return NextResponse.json({ ok: true, env, gas: { reachable: false, detail: 'Supabase 연결을 확인할 수 없습니다. 서버 환경변수와 SQL 마이그레이션을 확인하세요.' } });
    }
  }
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

// 최초 관리자 등록: Sheets는 GAS_SECRET, Supabase는 별도 SETUP_SECRET으로 보호한다.
export async function POST(req: Request) {
  if (process.env.READ_ONLY_MODE === '1') return NextResponse.json({ ok: false, error: 'DB 전환 중에는 초기 설정을 실행할 수 없습니다.' }, { status: 503 });
  try {
    const { secret, admin_email, admin_name, admin_code } = await req.json();
    const provider = storageProvider();
    const expected = provider === 'supabase' ? process.env.SETUP_SECRET : process.env.GAS_SECRET;
    if (!expected) return NextResponse.json({ ok: false, error: '초기 관리자 등록이 비활성화되어 있습니다.' }, { status: 403 });
    const a = Buffer.from(typeof secret === 'string' ? secret : '');
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ ok: false, error: '비밀값이 맞지 않습니다.' }, { status: 403 });
    const store = serverStore();
    let setup: { ok: boolean; result?: unknown; error?: string };
    if (provider === 'supabase') {
      // SQL must be applied separately; this endpoint never receives the DB key.
      await configuredSupabaseStore().check();
      setup = { ok: true, result: Object.keys(SHEETS) };
      if ((await store.list<User>('Users')).length) return NextResponse.json({ ok: false, error: '사용자가 이미 있습니다. 로그인 후 관리 화면에서 등록하세요.' }, { status: 409 });
    } else {
      const { url, gasSecret } = liveConfig();
      setup = await gasSetup(url, gasSecret);
      if (!setup.ok) return NextResponse.json(setup, { status: 500 });
    }
    if (admin_email && admin_code) {
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
