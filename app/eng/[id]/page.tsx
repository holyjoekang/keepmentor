'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
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
import { STAGES } from '@/lib/methodology';
import type { Bundle } from '@/lib/schema';

const TABS = [
  { k: 'overview', label: '진단 리포트' },
  { k: 'company', label: '기업·이슈' },
  { k: 'diagnosis', label: '진단' },
  { k: 'sessions', label: '회차' },
  { k: 'experiments', label: '실험 카드' },
  { k: 'timeline', label: '사고 흐름' },
  { k: 'report', label: '종합' },
  { k: 'ai', label: 'AI 작업함', mentorOnly: true },
] as const;
type TabKey = (typeof TABS)[number]['k'];


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
      <div className="wrap">
        <ErrorBox error={error} />
        {b && (
          <>
            <div className="row between">
              <div>
                <h1 style={{ marginBottom: 2 }}>{b.company.name}</h1>
                <div className="muted small">
                  {b.program ? `${b.program.org_name} · ${b.program.name}` : '프로그램 미지정'} · 멘토 {b.engagement.mentor_email} · 내 역할{' '}
                  <strong>{b.role === 'mentor' ? '멘토' : b.role === 'mentee' ? '멘티' : '기관'}</strong>
                </div>
              </div>
              {b.engagement.stage && <span className="badge accent">{b.engagement.stage} {STAGES.find((s) => s.code === b.engagement.stage)?.name}</span>}
            </div>
            <div className="tabs" style={{ marginTop: 12 }}>
              {TABS.filter((t) => !('mentorOnly' in t) || b.role === 'mentor').map((t) => (
                <button key={t.k} className={tab === t.k ? 'on' : ''} onClick={() => go(t.k)}>{t.label}</button>
              ))}
            </div>
            {tab === 'overview' && <Overview b={b} reload={reload} />}
            {tab === 'company' && <CompanyTab b={b} reload={reload} />}
            {tab === 'diagnosis' && <DiagnosisTab b={b} reload={reload} />}
            {tab === 'sessions' && <SessionsTab b={b} reload={reload} />}
            {tab === 'experiments' && <ExperimentsTab b={b} reload={reload} />}
            {tab === 'timeline' && <TimelineTab b={b} reload={reload} />}
            {tab === 'report' && <ReportTab b={b} reload={reload} />}
            {tab === 'ai' && b.role === 'mentor' && <AITab b={b} reload={reload} />}
          </>
        )}
      </div>
    </>
  );
}
