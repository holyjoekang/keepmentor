'use client';

import { MentoringArt } from '@/components/MentoringArt';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { StageBar } from '@/components/StageBar';
import { ErrorBox, TopBar, useMe } from '@/components/ui';
import { Overview } from '@/components/eng/Overview';
import { CompanyTab } from '@/components/eng/CompanyTab';
import { DiagnosisTab } from '@/components/eng/DiagnosisTab';
import { SessionsTab } from '@/components/eng/SessionsTab';
import { ExperimentsTab } from '@/components/eng/ExperimentsTab';
import { AITab } from '@/components/eng/AITab';
import { TimelineTab } from '@/components/eng/TimelineTab';
import { ReportTab } from '@/components/eng/ReportTab';
import { call } from '@/lib/client';
import { INDUSTRY_TEMPLATES, STAGES } from '@/lib/methodology';
import { allRedFlags, gradeLift } from '@/lib/scoring';
import type { Bundle } from '@/lib/schema';

const TABS = [
  { k: 'overview', label: '진단 리포트', icon: 'target' },
  { k: 'company', label: '기업·이슈', icon: 'building' },
  { k: 'diagnosis', label: '진단', icon: 'search' },
  { k: 'sessions', label: '회차', icon: 'file' },
  { k: 'experiments', label: '실험 카드', icon: 'flask' },
  { k: 'timeline', label: '사고 흐름', icon: 'pen' },
  { k: 'report', label: '종합', icon: 'map' },
  { k: 'ai', label: 'AI 작업함', icon: 'sparkle', mentorOnly: true },
] as const;
type TabKey = (typeof TABS)[number]['k'];

function journey(b: Bundle) {
  const n = Math.min(6, Math.max(1, Number(b.program?.session_count ?? 3)));
  const steps: { t: string; s: string; done: boolean }[] = [
    { t: '사전진단', s: '자가진단·이슈', done: b.assessments.some((a) => a.rater === 'self') },
  ];
  for (let i = 1; i <= n; i++) {
    const ses = b.sessions.find((x) => Number(x.round_no) === i);
    steps.push({ t: `${i}차`, s: ses ? ses.date : i === 1 ? '진단·목표' : i === n ? '정리·로드맵' : '실행·점검', done: !!ses });
  }
  steps.push({ t: '종합', s: '리포트·로드맵', done: !!b.engagement.final_report });
  steps.push({ t: '사후', s: '3·6개월', done: false });
  const nowIdx = steps.findIndex((x) => !x.done);
  return { steps, nowIdx };
}

export default function EngagementPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const [b, setB] = useState<Bundle | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setB(await call('bundle', id));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => { if (me) reload(); }, [me, reload]);
  useEffect(() => {
    const h = window.location.hash.slice(1) as TabKey;
    if (TABS.some((t) => t.k === h)) setTab(h);
  }, []);
  const go = (k: TabKey) => { setTab(k); history.replaceState(null, '', `#${k}`); };

  if (!me) return <TopBar />;
  return (
    <>
      <TopBar me={me} />
      <div className="wrap mentoring-workspace">
        <ErrorBox error={error} />
        {b && <Header b={b} />}
        {b && (
          <>
            <div className="tabs">
              {TABS.filter((t) => !('mentorOnly' in t) || (b.role === 'mentor' || b.can_record)).map((t) => (
                <button key={t.k} className={tab === t.k ? 'on' : ''} onClick={() => go(t.k)}>
                  <Icon name={t.icon} size={15} /> {t.label}
                </button>
              ))}
            </div>
            {tab === 'overview' && <Overview b={b} reload={reload} />}
            {tab === 'company' && <CompanyTab b={b} reload={reload} />}
            {tab === 'diagnosis' && <DiagnosisTab b={b} reload={reload} />}
            {tab === 'sessions' && <SessionsTab b={b} reload={reload} />}
            {tab === 'experiments' && <ExperimentsTab b={b} reload={reload} />}
            {tab === 'timeline' && <TimelineTab b={b} reload={reload} />}
            {tab === 'report' && <ReportTab b={b} reload={reload} />}
            {tab === 'ai' && (b.role === 'mentor' || b.can_record) && <AITab b={b} reload={reload} />}
          </>
        )}
      </div>
    </>
  );
}

function Header({ b }: { b: Bundle }) {
  const e = b.engagement;
  const { steps, nowIdx } = journey(b);
  const goalQs = Array.from(new Set((e.goals ?? []).flatMap((g) => g.q_codes)));
  const lifts = gradeLift(b.assessments, goalQs);
  const doneExp = b.experiments.filter((x) => x.status === 'done').length;
  const acked = b.sessions.filter((s) => String(s.mentee_ack) === 'true').length;
  const flags = allRedFlags(e, b.company);
  const stage = STAGES.find((s) => s.code === e.stage);
  const kpis = [
    { icon: 'stairs', label: '목표 문항 증거등급 상승', value: goalQs.length ? `${lifts.filter((l) => l.lifted).length} / ${goalQs.length}` : '목표 미설정', cls: '' },
    { icon: 'flask', label: '실험 완료', value: `${doneExp} / ${b.experiments.length}`, cls: 'blue' },
    { icon: 'pen', label: '멘티 확인한 회차', value: `${acked} / ${b.sessions.length}`, cls: 'warn' },
    { icon: 'flag', label: '레드플래그', value: String(flags.length), cls: flags.length ? 'danger' : '' },
  ];
  const received = e.kind === 'received';
  const roleLabel = b.role === 'mentee' && b.can_record ? '멘티 · 직접 기록' : (b.role === 'mentor' || b.can_record) ? '멘토' : b.role === 'mentee' ? '멘티' : '기관';

  return (
    <>
      <div className="xsmall muted" style={{ marginBottom: 8 }}><Link href="/home">내 멘토링</Link> / {b.company.name}</div>
      <MentoringArt variant={2} />
      <div className="hero-band">
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <div className="row" style={{ gap: 14 }}>
            <span className="ichip lg" style={{ background: '#23306B', color: '#fff', fontWeight: 800, fontSize: 18 }}>{b.company.name.slice(0, 1)}</span>
            <div>
              <h1 style={{ margin: 0 }}>{b.company.name}</h1>
              <div className="small muted">{b.company.summary || '한 줄 소개를 기업·이슈 탭에서 입력하세요'}</div>
            </div>
          </div>
          <div className="row">
            <span className="badge">{b.program ? `${b.program.org_name} · ${b.program.name}` : '프로그램 미지정'}</span>
            <span className="badge">{INDUSTRY_TEMPLATES.find((t) => t.code === b.company.industry)?.name ?? '업종 미정'}</span>
            <span className="badge accent">내 역할 · {roleLabel}</span>
          </div>
        </div>
        <div className="grid grid-2" style={{ marginTop: 18, gap: 24, alignItems: 'end' }}>
          <div>
            <div className="small muted" style={{ marginBottom: 6 }}>성장 단계 <strong style={{ color: 'var(--text)' }}>{e.stage} {stage?.name}</strong> — {stage?.question}</div>
            <StageBar stage={e.stage} />
          </div>
          <div className="small muted" style={{ textAlign: 'right' }}>멘토 {received ? e.mentor_name : e.mentor_email} · 시작 {e.start_date}</div>
        </div>
      </div>

      <div className="card">
        <div className="stepper" style={{ ['--n' as string]: steps.length } as React.CSSProperties}>
          {steps.map((s, i) => (
            <div key={s.t} className={`st ${s.done ? 'done' : i === nowIdx ? 'now' : ''}`}>
              <div className="dot">{s.done ? <Icon name="check" size={15} stroke={2.6} /> : i + 1}</div>
              <div className="t">{s.t}</div>
              <div className="s">{s.s}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 18 }}>
        {kpis.map((k) => (
          <div key={k.label} className="stat">
            <span className={`ichip ${k.cls}`}><Icon name={k.icon} /></span>
            <div><div className="num" style={{ fontSize: 20 }}>{k.value}</div><div className="lbl">{k.label}</div></div>
          </div>
        ))}
      </div>
    </>
  );
}
