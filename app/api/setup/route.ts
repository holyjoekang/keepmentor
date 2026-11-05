import { NextResponse } from 'next/server';
import { gasSetup, gasStore } from '@/lib/store';
import { liveConfig } from '@/lib/session';
import { newId, nowIso, type User } from '@/lib/schema';

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
