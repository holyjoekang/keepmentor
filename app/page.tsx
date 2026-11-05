'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TopBar } from '@/components/ui';
import { MODE, currentUser, login, resetDemo } from '@/lib/client';
import { DEMO_USERS } from '@/lib/demo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    currentUser().then((u) => u && router.replace('/home'));
  }, [router]);

  async function go(e?: string) {
    setError(null);
    try {
      await login(e ?? email, code);
      router.replace('/home');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <TopBar />
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="card">
          <h1>Keep Mentor</h1>
          <p className="muted">진단 → 처방 → 실험 → 점검. 사람이 먼저 쓰고 AI는 보완하는 스타트업 멘토링 기록.</p>
          {MODE === 'demo' ? (
            <>
              <div className="alert info">데모 모드입니다. 데이터는 이 브라우저에만 저장됩니다. 역할을 골라 들어가세요.</div>
              <div className="grid">
                {DEMO_USERS.map((u) => (
                  <button key={u.email} onClick={() => go(u.email)} style={{ textAlign: 'left' }}>
                    <strong>{u.name}</strong> <span className="muted small">— {u.affiliation}</span>
                  </button>
                ))}
              </div>
              <p className="small muted" style={{ marginTop: 16 }}>
                <button onClick={async () => { await resetDemo(); setError(null); }}>데모 데이터 초기화</button>
              </p>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); go(); }}>
              <label>이메일</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <label>접근 코드</label>
              <input type="password" value={code} onChange={(e) => setCode(e.target.value)} required />
              <div style={{ marginTop: 16 }}><button className="primary" type="submit">들어가기</button></div>
              <p className="small muted">접근 코드는 기관 담당자가 발급합니다.</p>
            </form>
          )}
          {error && <div className="alert error">{error}</div>}
        </div>
      </div>
    </>
  );
}
