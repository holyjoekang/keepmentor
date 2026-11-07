'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MODE, currentUser, logout, type Me } from '@/lib/client';
import { CONTENT_ORIGINS } from '@/lib/methodology';
import { Icon } from './icons';
import { Logo } from './Logo';

export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const router = useRouter();
  useEffect(() => {
    currentUser().then((u) => {
      setMe(u);
      if (!u) router.replace('/login');
    });
  }, [router]);
  return me;
}

export function TopBar({ me, variant = 'app' }: { me?: Me | null; variant?: 'app' | 'public' }) {
  const router = useRouter();
  const dark = variant === 'public';
  return (
    <div className={`topbar${dark ? ' dark' : ''}`}>
      <div className="row" style={{ gap: 18 }}>
        <Link href={me ? '/home' : '/'} className="brand"><Logo size={28} light={dark} /></Link>
        <Link href="/" className="navlink hide-sm">방법론</Link>
        <Link href="/cases" className="navlink hide-sm">사례</Link>
        {me && <Link href="/home" className="navlink">내 멘토링</Link>}
        {me && <Link href="/meetings" className="navlink">멘토 회의</Link>}
        {MODE === 'demo' && <span className="badge warn">데모</span>}
      </div>
      {me ? (
        <div className="row small">
          <Link href="/guide" className="navlink hide-sm">Claude 프로젝트 지침</Link>
          {me.is_admin && <Link href="/admin" className="navlink">관리</Link>}
          <span className="badge"><Icon name="user" size={12} /> {me.name}</span>
          <button onClick={async () => { await logout(); router.replace('/login'); }}>로그아웃</button>
        </div>
      ) : (
        <div className="row">
          <Link href="/login" className={`btn ${dark ? 'ghost-light' : ''}`}>로그인</Link>
        </div>
      )}
    </div>
  );
}

export function ErrorBox({ error }: { error?: string | null }) {
  return error ? <div className="alert error">{error}</div> : null;
}

export function Origin({ origin, prefix }: { origin?: string; prefix?: string }) {
  if (!origin) return null;
  const label = CONTENT_ORIGINS[origin as keyof typeof CONTENT_ORIGINS] ?? origin;
  return <span className={`badge ${origin === 'human' ? 'accent' : 'ai'}`}>{prefix ? `${prefix}: ` : ''}{label}</span>;
}

export function useAsync() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function run<T>(fn: () => Promise<T>, okMsg?: string): Promise<T | undefined> {
    setBusy(true); setError(null); setOk(null);
    try {
      const r = await fn();
      if (okMsg) setOk(okMsg);
      return r;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, ok, run, setError };
}

export function Status({ error, ok }: { error: string | null; ok: string | null }) {
  return (
    <>
      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}
    </>
  );
}

export function copyText(text: string) {
  return navigator.clipboard?.writeText(text);
}

export function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
