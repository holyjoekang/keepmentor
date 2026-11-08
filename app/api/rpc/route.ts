import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ActionError, createActions, type ActionName } from '@/lib/actions';
import { serverStore } from '@/lib/server-store';
import { COOKIE, verify } from '@/lib/session';
import { blocksWrite } from '@/lib/maintenance';
import type { User } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const email = verify((await cookies()).get(COOKIE)?.value);
    if (!email) return NextResponse.json({ ok: false, error: '로그인이 필요합니다.', auth: false }, { status: 401 });
    const store = serverStore();
    const me = (await store.list<User>('Users')).find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!me) return NextResponse.json({ ok: false, error: '등록되지 않은 사용자입니다.', auth: false }, { status: 401 });
    const { action, args } = (await req.json()) as { action: ActionName; args: unknown[] };
    if (blocksWrite(action, process.env.READ_ONLY_MODE)) return NextResponse.json({ ok: false, error: 'DB 전환 중에는 저장이 잠시 중단됩니다. 잠시 후 다시 시도해 주세요.' }, { status: 503 });
    const actions = createActions(store, me);
    const fn = actions[action] as unknown as ((...a: unknown[]) => Promise<unknown>) | undefined;
    if (!Object.prototype.hasOwnProperty.call(actions, action) || typeof fn !== 'function') return NextResponse.json({ ok: false, error: '알 수 없는 작업' }, { status: 400 });
    const result = await fn(...(Array.isArray(args) ? args : []));
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const status = e instanceof ActionError ? 400 : 500;
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status });
  }
}
