'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { PubFooter, PubNav } from '@/components/Public';

interface Status { env: Record<string, boolean | string>; gas: { reachable: boolean; detail: string } }

const randomSecret = () => {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
};

export default function SetupPage() {
  const [st, setSt] = useState<Status | null>(null);
  const [f, setF] = useState({ secret: '', admin_email: '', admin_name: '', admin_code: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [sample, setSample] = useState({ a: '', b: '' });

  async function check() {
    try { setSt(await (await fetch('/api/setup', { cache: 'no-store' })).json()); } catch { setSt(null); }
  }
  useEffect(() => { check(); setSample({ a: randomSecret(), b: randomSecret() }); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const Row = ({ k, label }: { k: string; label: string }) => {
    const v = st?.env[k];
    const ok = k === 'NEXT_PUBLIC_MODE' ? v === 'live' : !!v;
    return (
      <tr><td><code>{k}</code></td><td className="small muted">{label}</td>
        <td>{st ? <span className={`badge ${ok ? 'accent' : 'warn'}`}>{k === 'NEXT_PUBLIC_MODE' ? String(v) : ok ? '설정됨' : '없음'}</span> : '…'}</td></tr>
    );
  };

  return (
    <div className="pub">
      <PubNav />
      <div className="pw" style={{ maxWidth: 900, padding: '48px 24px' }}>
        <div className="ed-kicker">Setup</div>
        <h1 className="serif" style={{ fontSize: 34, margin: '12px 0' }}>Google Sheets 연결 점검</h1>
        <p className="muted">Vercel 환경변수와 Apps Script 연결 상태를 확인하고, 처음 한 번 시트를 만들고 관리자를 등록합니다. 비밀값 자체는 화면에 표시하지 않습니다.</p>

        <div className="card" style={{ borderRadius: 4 }}>
          <div className="row between"><h2 style={{ margin: 0 }}>1. 환경변수</h2><button onClick={check}>다시 점검</button></div>
          <table style={{ marginTop: 10 }}>
            <tbody>
              <Row k="NEXT_PUBLIC_MODE" label="live 여야 시트에 저장합니다" />
              <Row k="GAS_URL" label="Apps Script 웹앱 URL (…/exec)" />
              <Row k="GAS_SECRET" label="Apps Script 스크립트 속성 SECRET과 같은 값" />
              <Row k="SESSION_SECRET" label="로그인 쿠키 서명용 임의 문자열" />
              <Row k="NEXT_PUBLIC_CONTACT_EMAIL" label="(선택) 도입 문의 받을 이메일" />
            </tbody>
          </table>
          <div className="alert info small" style={{ marginTop: 12 }}>
            <Icon name="shield" size={16} />
            <div>비밀값이 필요하면 아래 무작위 값을 쓰세요. 새로고침할 때마다 바뀝니다.<br />
              GAS_SECRET 후보: <code>{sample.a}</code><br />SESSION_SECRET 후보: <code>{sample.b}</code></div>
          </div>
        </div>

        <div className="card" style={{ borderRadius: 4 }}>
          <h2 style={{ margin: 0 }}>2. Apps Script 연결</h2>
          {st ? <div className={`alert ${st.gas.reachable ? 'ok' : 'error'}`}>{st.gas.detail}</div> : <p className="muted">점검 중…</p>}
        </div>

        <div className="card" style={{ borderRadius: 4 }}>
          <h2 style={{ margin: 0 }}>3. 시트 만들기 + 첫 관리자 등록</h2>
          <p className="small muted">여러 번 실행해도 안전합니다. 없는 시트와 헤더만 만들고, 같은 이메일의 관리자는 다시 만들지 않습니다.</p>
          <label>GAS_SECRET (Vercel에 넣은 값)</label><input type="password" value={f.secret} onChange={set('secret')} />
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div><label>관리자 이메일</label><input type="email" value={f.admin_email} onChange={set('admin_email')} /></div>
            <div><label>관리자 이름</label><input value={f.admin_name} onChange={set('admin_name')} /></div>
          </div>
          <label>관리자 접근 코드 (로그인 비밀번호로 씁니다)</label><input type="password" value={f.admin_code} onChange={set('admin_code')} />
          {msg && <div className={`alert ${msg.ok ? 'ok' : 'error'}`}>{msg.text}</div>}
          <button className="primary" style={{ marginTop: 14 }} disabled={busy || !f.secret} onClick={async () => {
            setBusy(true); setMsg(null);
            try {
              const r = await (await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
              setMsg(r.ok ? { ok: true, text: `완료: 시트 ${r.sheets?.length ?? 0}개 준비됨. 이제 로그인할 수 있습니다.` } : { ok: false, text: r.error || '실패했습니다.' });
            } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } finally { setBusy(false); }
          }}>시트 만들기 실행</button>
        </div>

        <div className="row" style={{ gap: 12 }}>
          <Link href="/login" className="btn indigo">로그인으로</Link>
          <Link href="/admin" className="btn">관리 화면 (로그인 후)</Link>
        </div>
      </div>
      <PubFooter />
    </div>
  );
}
