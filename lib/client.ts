'use client';

import { createActions, type Actions, type ActionName } from './actions';
import { DEMO_USERS, seedDemo } from './demo';
import { localIsEmpty, localReset, localStore } from './store';

export const MODE: 'demo' | 'live' = process.env.NEXT_PUBLIC_MODE === 'live' ? 'live' : 'demo';

const DEMO_USER_KEY = 'keepmentor-demo-user';

export interface Me { email: string; name: string; is_admin: boolean }

function demoUser() {
  try {
    const email = window.localStorage.getItem(DEMO_USER_KEY);
    return DEMO_USERS.find((u) => u.email === email) ?? null;
  } catch {
    return null;
  }
}

async function ensureSeed() {
  if (localIsEmpty()) await seedDemo(localStore());
}

export async function currentUser(): Promise<Me | null> {
  if (MODE === 'demo') {
    await ensureSeed();
    const u = demoUser();
    return u ? { email: u.email, name: u.name, is_admin: !!u.is_admin } : null;
  }
  try {
    return (await call('me')) as Me;
  } catch {
    return null;
  }
}

export async function login(email: string, code: string): Promise<Me> {
  if (MODE === 'demo') {
    await ensureSeed();
    const u = DEMO_USERS.find((x) => x.email === email);
    if (!u) throw new Error('데모 사용자를 고르세요.');
    window.localStorage.setItem(DEMO_USER_KEY, u.email);
    return { email: u.email, name: u.name, is_admin: !!u.is_admin };
  }
  const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.user;
}

export async function logout() {
  if (MODE === 'demo') {
    window.localStorage.removeItem(DEMO_USER_KEY);
    return;
  }
  await fetch('/api/logout', { method: 'POST' });
}

export async function resetDemo() {
  localReset();
  await seedDemo(localStore());
}

type Fn<K extends ActionName> = Actions[K] extends (...a: infer A) => Promise<infer R> ? (...a: A) => Promise<R> : never;

export async function call<K extends ActionName>(action: K, ...args: Parameters<Fn<K>>): Promise<Awaited<ReturnType<Fn<K>>>> {
  if (MODE === 'demo') {
    await ensureSeed();
    const u = demoUser();
    if (!u) throw new Error('로그인이 필요합니다.');
    const actions = createActions(localStore(), u);
    const fn = actions[action] as unknown as (...a: unknown[]) => Promise<Awaited<ReturnType<Fn<K>>>>;
    return fn(...args);
  }
  const res = await fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, args }) });
  const data = await res.json();
  if (!data.ok) {
    if (data.auth === false && typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.href = '/login';
    throw new Error(data.error);
  }
  return data.result;
}
