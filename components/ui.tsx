'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MODE, currentUser, logout, type Me } from '@/lib/client';
import { CONTENT_ORIGINS } from '@/lib/methodology';

export function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const router = useRouter();
  useEffect(() => {
    currentUser().then((u) => {
      setMe(u);
      if (!u) router.replace('/');
    });
  }, [router]);
  return me;
}

export function TopBar({ me }: { me?: Me | null }) {
  const router = useRouter();
  return (
    <div className="topbar">
      <div className="row">
        <Link href="/home" className="brand">Keep <span>Mentor</span></Link>
        {MODE === 'demo' && <span className="badge warn">데모 모드</span>}
      </div>
      {me && (
        <div className="row small">
          <Link href="/guide" className="hide-sm">Claude 프로젝트 지침</Link>
          {me.is_admin && <Link href="/admin">관리</Link>}
          <span className="muted">{me.name}</span>
          <button onClick={async () => { await logout(); router.replace('/'); }}>로그아웃</button>
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
