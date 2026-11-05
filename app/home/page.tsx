'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ErrorBox, TopBar, useMe } from '@/components/ui';
import { call } from '@/lib/client';
import type { HomeItem } from '@/lib/actions';
import { INDUSTRY_TEMPLATES, STAGES } from '@/lib/methodology';
import type { Program } from '@/lib/schema';

type Tab = 'asMentor' | 'asMentee' | 'asAdmin';

export default function HomePage() {
  const me = useMe();
  const [data, setData] = useState<Record<Tab, HomeItem[]> | null>(null);
  const [tab, setTab] = useState<Tab>('asMentor');
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    try {
      const d = await call('home');
      setData(d);
      if (!d.asMentor.length && d.asMentee.length) setTab('asMentee');
      else if (!d.asMentor.length && !d.asMentee.length && d.asAdmin.length) setTab('asAdmin');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => { if (me) load(); }, [me]);

  if (!me) return <TopBar />;
  const items = data?.[tab] ?? [];
  return (
    <>
      <TopBar me={me} />
      <div className="wrap">
        <div className="row between">
          <h1>내 멘토링</h1>
          <button className="primary" onClick={() => setShowNew((v) => !v)}>새 멘토링 건</button>
        </div>
        <p className="muted small">같은 사람이 어떤 건에서는 멘토, 다른 건에서는 멘티가 될 수 있습니다.</p>
        {showNew && <NewEngagement me={me} onDone={() => { setShowNew(false); load(); }} />}
        <div className="tabs">
          <button className={tab === 'asMentor' ? 'on' : ''} onClick={() => setTab('asMentor')}>멘토로 ({data?.asMentor.length ?? 0})</button>
          <button className={tab === 'asMentee' ? 'on' : ''} onClick={() => setTab('asMentee')}>멘티로 ({data?.asMentee.length ?? 0})</button>
          {me.is_admin && <button className={tab === 'asAdmin' ? 'on' : ''} onClick={() => setTab('asAdmin')}>기관 ({data?.asAdmin.length ?? 0})</button>}
        </div>
        <ErrorBox error={error} />
        {data && !items.length && <div className="card muted">아직 멘토링 건이 없습니다.</div>}
        <div className="grid grid-2">
          {items.map((it) => (
            <Link key={it.eng_id} href={`/eng/${it.eng_id}`} className="card" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="row between">
                <h2 style={{ margin: 0 }}>{it.company}</h2>
                {it.stage && <span className="badge accent">{it.stage} {STAGES.find((s) => s.code === it.stage)?.name}</span>}
              </div>
              <div className="muted small">{it.program ?? '프로그램 미지정'} · {it.status}</div>
              <div className="row small" style={{ marginTop: 8 }}>
                <span className="badge">다음 회차 {it.next_date || '미정'}</span>
                <span className="badge">진행 중 실험 {it.open_experiments}</span>
                {it.red_flags > 0 && <span className="badge danger">레드플래그 {it.red_flags}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function NewEngagement({ me, onDone }: { me: { email: string; is_admin: boolean }; onDone: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [f, setF] = useState({ program_id: '', company_name: '', industry: 'saas', mentor_email: me.email, mentee_email: '' });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { call('programs').then(setPrograms).catch(() => undefined); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="card">
      <h2>새 멘토링 건</h2>
      <div className="grid grid-2">
        <div>
          <label>프로그램</label>
          <select value={f.program_id} onChange={set('program_id')}>
            <option value="">선택 안 함</option>
            {programs.map((p) => <option key={p.id} value={p.id}>{p.org_name} · {p.name}</option>)}
          </select>
          <label>기업명</label>
          <input value={f.company_name} onChange={set('company_name')} />
          <label>업종 템플릿</label>
          <select value={f.industry} onChange={set('industry')}>
            {INDUSTRY_TEMPLATES.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label>멘토 이메일</label>
          <input value={f.mentor_email} onChange={set('mentor_email')} disabled={!me.is_admin} />
          <label>멘티(대표) 이메일</label>
          <input value={f.mentee_email} onChange={set('mentee_email')} placeholder="ceo@company.com" />
        </div>
      </div>
      <ErrorBox error={error} />
      <div style={{ marginTop: 12 }}>
        <button className="primary" onClick={async () => {
          try { await call('createEngagement', f); onDone(); } catch (e) { setError((e as Error).message); }
        }}>만들기</button>
      </div>
    </div>
  );
}
