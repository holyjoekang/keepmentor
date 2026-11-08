'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { ErrorBox, TopBar, useMe } from '@/components/ui';
import { call } from '@/lib/client';
import type { HomeItem } from '@/lib/actions';
import { INDUSTRY_TEMPLATES, STAGES } from '@/lib/methodology';
import type { Program } from '@/lib/schema';
import { StageBar } from '@/components/StageBar';

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
  const all = data ? [...data.asMentor, ...data.asMentee, ...data.asAdmin] : [];
  const stats = [
    { icon: 'layers', label: '진행 중인 건', num: all.filter((x) => x.status !== '완료').length, cls: '' },
    { icon: 'flask', label: '진행 중인 실험', num: all.reduce((a, x) => a + x.open_experiments, 0), cls: 'blue' },
    { icon: 'pen', label: '멘티 확인 대기 회차', num: all.reduce((a, x) => a + x.pending_acks, 0), cls: 'warn' },
    { icon: 'flag', label: '레드플래그', num: all.reduce((a, x) => a + x.red_flags, 0), cls: 'danger' },
  ];

  return (
    <>
      <TopBar me={me} />
      <div className="wrap">
        <div className="row between" style={{ marginBottom: 6 }}>
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 style={{ marginBottom: 2 }}>{me.name}님의 멘토링</h1>
            <p className="muted small" style={{ margin: 0 }}>같은 사람이 어떤 건에서는 멘토, 다른 건에서는 멘티가 될 수 있습니다.</p>
          </div>
          <div className="row">
            <Link href="/" className="btn"><Icon name="book" size={16} /> 방법론</Link>
            <button className="primary" onClick={() => setShowNew((v) => !v)}><Icon name="layers" size={16} /> 새 멘토링 건</button>
          </div>
        </div>

        <div className="grid grid-4" style={{ margin: '18px 0' }}>
          {stats.map((s) => (
            <div key={s.label} className="stat">
              <span className={`ichip lg ${s.cls}`}><Icon name={s.icon} size={20} /></span>
              <div><div className="num">{data ? s.num : '–'}</div><div className="lbl">{s.label}</div></div>
            </div>
          ))}
        </div>

        {showNew && <NewEngagement me={me} onDone={() => { setShowNew(false); load(); }} />}
        <div className="tabs">
          <button className={tab === 'asMentor' ? 'on' : ''} onClick={() => setTab('asMentor')}>멘토로 · {data?.asMentor.length ?? 0}</button>
          <button className={tab === 'asMentee' ? 'on' : ''} onClick={() => setTab('asMentee')}>멘티로 · {data?.asMentee.length ?? 0}</button>
          {!!data?.asAdmin.length && <button className={tab === 'asAdmin' ? 'on' : ''} onClick={() => setTab('asAdmin')}>기관 · {data?.asAdmin.length ?? 0}</button>}
        </div>
        <ErrorBox error={error} />
        {data && !items.length && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <span className="ichip lg" style={{ margin: '0 auto' }}><Icon name="layers" size={22} /></span>
            <h3 style={{ marginTop: 12 }}>아직 멘토링 건이 없습니다</h3>
            <p className="small muted">"새 멘토링 건"으로 시작하거나 기관 담당자의 배정을 기다려 주세요.</p>
          </div>
        )}
        <div className="grid grid-2">
          {items.map((it) => {
            const pct = Math.min(100, Math.round((it.sessions_done / Math.max(1, it.session_total)) * 100));
            return (
              <Link key={it.eng_id} href={`/eng/${it.eng_id}`} className="card link" style={{ margin: 0 }}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div className="row" style={{ gap: 12 }}>
                    <span className="ichip lg" style={{ background: 'var(--navy)', color: '#fff', fontWeight: 800 }}>{it.company.slice(0, 1)}</span>
                    <div>
                      <h2 style={{ margin: 0 }}>{it.company}</h2>
                      <div className="muted small">{it.kind === 'received' ? `받는 멘토링 · 멘토 ${it.mentor_name ?? ''}` : (it.program ?? '프로그램 미지정')} · {INDUSTRY_TEMPLATES.find((t) => t.code === it.industry)?.name ?? '업종 미정'}</div>
                    </div>
                  </div>
                  {it.red_flags > 0 ? <span className="badge danger"><Icon name="flag" size={12} /> {it.red_flags}</span> : <span className="badge accent">{it.status}</span>}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div className="xsmall muted" style={{ marginBottom: 4, fontWeight: 600 }}>성장 단계 · {STAGES.find((s) => s.code === it.stage)?.name ?? '-'}</div>
                  <StageBar stage={it.stage} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <div className="row between xsmall muted" style={{ fontWeight: 600 }}><span>회차 진행</span><span>{it.sessions_done} / {it.session_total}</span></div>
                  <div className="ebar" style={{ height: 6, marginTop: 4 }}><span style={{ width: `${pct}%`, background: 'var(--blue)' }} /></div>
                </div>
                <div className="row small" style={{ marginTop: 14 }}>
                  <span className="badge"><Icon name="clock" size={12} /> 다음 {it.next_date || '미정'}</span>
                  <span className="badge blue"><Icon name="flask" size={12} /> 실험 {it.open_experiments}</span>
                  {it.pending_acks > 0 && <span className="badge warn"><Icon name="pen" size={12} /> 확인 대기 {it.pending_acks}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

function NewEngagement({ me, onDone }: { me: { email: string; is_admin: boolean }; onDone: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [f, setF] = useState({ program_id: '', company_name: '', industry: 'saas', mentor_email: me.email, mentee_email: '', kind: 'given' as 'given' | 'received', mentor_name: '' });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { call('programs').then(setPrograms).catch(() => undefined); }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="card">
      <div className="card-title"><span className="ichip"><Icon name="layers" /></span><h2>새 멘토링 건</h2></div>
      <div className="row" style={{ gap: 8, marginBottom: 6 }}>
        <button className={f.kind === 'given' ? 'primary' : ''} onClick={() => setF({ ...f, kind: 'given', mentor_email: me.email })}>내가 멘토인 멘토링</button>
        <button className={f.kind === 'received' ? 'primary' : ''} onClick={() => setF({ ...f, kind: 'received', mentor_email: '' })}>내가 받는 멘토링 (외부 멘토)</button>
      </div>
      {f.kind === 'received' && <p className="small muted">외부 멘토에게 받는 멘토링을 대표님이 직접 기록합니다. 멘토가 앱 계정이 없어도 됩니다.</p>}
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
          {f.kind === 'received' ? (
            <>
              <label>멘토 이름</label>
              <input value={f.mentor_name} onChange={set('mentor_name')} placeholder="예: 이광일 멘토" />
              <label>멘토 이메일 (선택 · 앱 계정이 있을 때만)</label>
              <input value={f.mentor_email} onChange={set('mentor_email')} />
            </>
          ) : (
            <>
              <label>멘토 이메일</label>
              <input value={f.mentor_email} onChange={set('mentor_email')} disabled={!me.is_admin} />
              <label>멘티(대표) 이메일</label>
              <input value={f.mentee_email} onChange={set('mentee_email')} placeholder="ceo@company.com" />
            </>
          )}
        </div>
      </div>
      <ErrorBox error={error} />
      <div style={{ marginTop: 14 }}>
        <button className="primary" onClick={async () => {
          try { await call('createEngagement', f); onDone(); } catch (e) { setError((e as Error).message); }
        }}>만들기</button>
      </div>
    </div>
  );
}
