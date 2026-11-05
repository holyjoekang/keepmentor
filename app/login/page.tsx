'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { PubNav } from '@/components/Public';
import { MODE, currentUser, login, resetDemo } from '@/lib/client';
import { DEMO_USERS } from '@/lib/demo';

const ROLE_ICON = ['pen', 'user', 'building'];
const ROLE_LABEL = ['멘토', '멘티(대표)', '기관 담당자'];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      <PubNav />
      <div className="ed-hero" style={{ backgroundImage: 'url(/images/mentoring.jpg)', minHeight: 'calc(100vh - 63px)', alignItems: 'center' }}>
        <div className="pw grid grid-2" style={{ position: 'relative', alignItems: 'center', gap: 40, padding: '48px 24px' }}>
          <div>
            <div className="ed-kicker">Keep Mentor</div>
            <h1 className="serif" style={{ fontSize: 'clamp(30px, 4vw, 46px)', marginTop: 16 }}>진단 → 처방 → 실험 → 점검</h1>
            <p className="lead">사람이 먼저 쓰고 AI는 보완하는 스타트업 멘토링 기록. 멘토와 멘티가 같은 절차와 같은 결과물을 봅니다.</p>
            <Link href="/method" className="btn line-light" style={{ marginTop: 12 }}>방법론 먼저 보기 <Icon name="arrow" size={15} /></Link>
          </div>
          <div className="card" style={{ margin: 0, color: 'var(--text)' }}>
            <h2>로그인</h2>
            {MODE === 'demo' ? (
              <>
                <div className="alert info small"><Icon name="shield" size={16} /> 데모 모드입니다. 데이터는 이 브라우저에만 저장됩니다. 역할을 골라 들어가세요.</div>
                <div className="grid" style={{ gap: 10 }}>
                  {DEMO_USERS.map((u, i) => (
                    <button key={u.email} onClick={() => go(u.email)} style={{ justifyContent: 'flex-start', padding: 14, textAlign: 'left' }}>
                      <span className={`ichip ${i === 1 ? 'blue' : i === 2 ? 'warn' : ''}`}><Icon name={ROLE_ICON[i]} /></span>
                      <span><strong>{u.name}</strong> <span className="badge" style={{ marginLeft: 4 }}>{ROLE_LABEL[i]}</span><br /><span className="small muted" style={{ fontWeight: 500 }}>{u.affiliation}</span></span>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <button onClick={async () => { await resetDemo(); setError(null); setNotice('데모 데이터를 처음 상태로 되돌렸습니다.'); }}>데모 데이터 초기화</button>
                </div>
                {notice && <div className="alert ok small">{notice}</div>}
              </>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); go(); }}>
                <label>이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <label>접근 코드</label>
                <input type="password" value={code} onChange={(e) => setCode(e.target.value)} required />
                <div style={{ marginTop: 18 }}><button className="primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>들어가기</button></div>
                <p className="small muted" style={{ marginTop: 10 }}>접근 코드는 기관 담당자가 발급합니다.</p>
              </form>
            )}
            {error && <div className="alert error">{error}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
