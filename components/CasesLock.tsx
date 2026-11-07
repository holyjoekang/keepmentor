'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from './icons';

// 사례집 잠금 화면: 로그인하거나 사례 열람 코드를 입력한다.
export function CasesLock({ codeEnabled, onUnlocked }: { codeEnabled: boolean; onUnlocked: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="pw" style={{ maxWidth: 560, padding: '72px 24px' }}>
      <div className="card" style={{ borderRadius: 4, textAlign: 'center', padding: 36 }}>
        <span className="ichip lg" style={{ margin: '0 auto' }}><Icon name="shield" size={22} /></span>
        <h2 className="serif" style={{ fontSize: 26, margin: '14px 0 8px' }}>사례집은 인증 후 볼 수 있습니다</h2>
        <p className="small muted">멘토링 사례와 플레이북은 등록된 멘토·기관과 열람 코드를 받은 분에게만 공개합니다.</p>
        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <Link href="/login" className="btn indigo">로그인</Link>
        </div>
        {codeEnabled && (
          <form style={{ marginTop: 22, textAlign: 'left' }} onSubmit={async (e) => {
            e.preventDefault(); setError(null);
            const r = await fetch('/api/cases/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
            const j = await r.json().catch(() => ({}));
            if (j.ok) onUnlocked(); else setError(j.error || '코드가 맞지 않습니다.');
          }}>
            <label>또는 사례 열람 코드</label>
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <input type="password" value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="primary" type="submit">열기</button>
            </div>
            {error && <div className="alert error small">{error}</div>}
          </form>
        )}
        <p className="xsmall faint" style={{ marginTop: 18 }}>열람 코드는 도입 문의 시 안내해 드립니다.</p>
      </div>
    </div>
  );
}
