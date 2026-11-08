import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ActionError, createActions, type ActionName } from '@/lib/actions';
import { serverStore } from '@/lib/server-store';
import { COOKIE, verify } from '@/lib/session';
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
    const actions = createActions(store, me);
    const fn = actions[action] as unknown as ((...a: unknown[]) => Promise<unknown>) | undefined;
    if (typeof fn !== 'function') return NextResponse.json({ ok: false, error: '알 수 없는 작업' }, { status: 400 });
    const result = await fn(...(Array.isArray(args) ? args : []));
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const status = e instanceof ActionError ? 400 : 500;
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status });
  }
}
