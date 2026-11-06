'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { LogoMark } from '@/components/Logo';
import { Radar } from '@/components/Radar';
import { TopBar, useMe } from '@/components/ui';
import { buildBrief } from '@/lib/brief';
import { call } from '@/lib/client';
import { AXES, EVIDENCE_TYPES, GRADE_CAP } from '@/lib/methodology';
import { axisScores } from '@/lib/scoring';
import type { Bundle } from '@/lib/schema';

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const [b, setB] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (me) call('bundle', id).then(setB).catch((e) => setError(e.message)); }, [me, id]);

  if (!me) return <TopBar />;
  return (
    <>
      <div className="no-print"><TopBar me={me} /></div>
      <div className="wrap brief-wrap">
        <div className="row between no-print" style={{ marginBottom: 14 }}>
          <Link href={`/eng/${id}`} className="small">← 멘토링 건으로</Link>
          <div className="row">
            <span className="small muted">A4 한 장 분량으로 인쇄됩니다</span>
            <button className="primary" onClick={() => window.print()}><Icon name="file" size={15} /> 인쇄 / PDF 저장</button>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        {b && <Brief b={b} />}
      </div>
    </>
  );
}

function Sec({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="brief-sec">
      <h3><span className="brief-n">{n}</span>{title}</h3>
      {children}
    </section>
  );
}

function Brief({ b }: { b: Bundle }) {
  const d = buildBrief(b);
  const today = new Date().toISOString().slice(0, 10);
  const self = axisScores(b.assessments, 'self');
  const mentor = axisScores(b.assessments, 'mentor');

  return (
    <article className="brief">
      <header className="brief-head">
        <div className="row" style={{ gap: 10 }}>
          <LogoMark size={34} />
          <div>
            <div className="xsmall muted" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>KEEP MENTOR · 진단 결과 설명지</div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{b.company.name}</h1>
          </div>
        </div>
        <div className="small muted" style={{ textAlign: 'right' }}>
          {b.program ? `${b.program.org_name} · ${b.program.name}` : ''}<br />
          멘토 {b.engagement.mentor_email} · 작성일 {today}
        </div>
      </header>

      {!d.hasData && <div className="alert info">아직 진단 응답이 없습니다. 진단 탭에서 자가진단 또는 멘토 보정을 먼저 입력하세요.</div>}

      <Sec n={1} title="이 진단은 무엇인가요">
        <p>점수는 회사의 성적이 아니라 <strong>이번 멘토링에서 무엇을 다룰지 찾는 지도</strong>입니다. 모든 기업에 같은 12문항을 묻고, 근거의 종류가 점수의 상한을 정합니다. 그래서 "좋다는 말"보다 "고객의 행동과 돈"이 높은 점수를 받습니다.</p>
        <div className="brief-legend">
          {EVIDENCE_TYPES.map((t) => <span key={t.code}><b>{t.grade}</b> {t.label} · 최대 {GRADE_CAP[t.grade]}점</span>)}
          <span><b>예외</b> 대표 주당 가용시간(M0)은 사실 입력이라 상한이 없습니다</span>
        </div>
      </Sec>

      <div className="brief-grid">
        <Sec n={2} title="지금 단계">
          <div className="brief-stage"><b>{d.stage.code}</b> {d.stage.name}<span>— {d.stage.question}</span></div>
          {d.metGates.length > 0 && <p className="small">확인한 증거: {d.metGates.map((g) => `${g.to} 관문 (${g.note || g.evidence})`).join(' · ')}</p>}
          {d.stageReason && <p className="small">판정 근거: {d.stageReason}</p>}
          {d.nextGate && <p className="small"><strong>다음 단계({d.nextGate.to})로 가려면:</strong> {d.nextGate.evidence}</p>}
          <p className="xsmall muted">단계는 업력이 아니라 외부 검증 증거로 판정합니다.</p>
        </Sec>
        <div className="brief-radar">
          <Radar self={self} mentor={mentor} />
          <table className="small">
            <tbody>{AXES.map((a) => <tr key={a.code}><td>{a.name}</td><td>{d.scores[a.code] ?? '–'}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <Sec n={3} title="잘하고 있는 것">
        {d.strengths.length ? (
          <ul>{d.strengths.map((s) => (
            <li key={s.axis}><strong>{s.axis} ({s.score}점)</strong>{s.q && <> — {s.q.code} {s.q.text}: {s.q.anchorNow}{s.q.evidence && <span className="muted"> (근거: {s.q.evidence})</span>}</>}</li>
          ))}</ul>
        ) : <p className="muted small">진단 후 채워집니다.</p>}
      </Sec>

      <Sec n={4} title="대표님의 판단과 증거가 다른 곳">
        {!d.hasMentor || !d.hasSelf ? <p className="muted small">자가진단과 멘토 보정이 모두 있어야 비교할 수 있습니다.</p>
          : d.gaps.length ? (
            <table className="small brief-table">
              <thead><tr><th>문항</th><th>자가</th><th>멘토</th><th>다음 점수가 되려면</th></tr></thead>
              <tbody>{d.gaps.map((g) => (
                <tr key={g.code}><td><b>{g.code}</b> {g.text}</td><td>{g.self}</td><td>{g.mentor}</td><td>{g.anchorNext ?? '이미 최고 수준'}</td></tr>
              ))}</tbody>
            </table>
          ) : <p className="small">자가진단과 멘토 판단이 대체로 일치합니다.</p>}
        {d.lowCaps.length > 0 && (
          <p className="small" style={{ marginTop: 8 }}>근거 때문에 점수가 내려간 문항: {d.lowCaps.map((l) => `${l.code} (${l.capNote})`).join(' ')}</p>
        )}
        <p className="xsmall muted">"틀렸다"는 뜻이 아니라 "아직 증거가 없다"는 뜻입니다. 증거가 생기면 점수는 바로 오릅니다.</p>
      </Sec>

      <Sec n={5} title="먼저 챙겨야 할 위험 (레드플래그)">
        {d.flags.length ? (
          <ul>{d.flags.map((f) => <li key={f.code} style={{ color: 'var(--danger)' }}><strong>{f.label}</strong>{f.detail && ` — ${f.detail}`}</li>)}</ul>
        ) : <p className="small">켜진 레드플래그가 없습니다.</p>}
        <p className="xsmall muted">레드플래그는 다른 점수와 상관없이 이번 멘토링의 우선순위가 됩니다.</p>
      </Sec>

      <Sec n={6} title="가장 큰 병목과 대표님의 질문">
        <div className="side-by-side">
          <div className="panel" style={{ borderRadius: 6 }}>
            <div className="panel-label">대표님이 가져온 이슈</div>
            <p className="small" style={{ margin: 0 }}>{d.request.symptom || '–'}</p>
            {d.request.wanted && <p className="small muted" style={{ margin: '6px 0 0' }}>원하는 결과: {d.request.wanted}</p>}
          </div>
          <div className="panel" style={{ borderRadius: 6, background: 'var(--dawn-soft)' }}>
            <div className="panel-label">진단에서 드러난 병목</div>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              {d.bottlenecks.map((x) => <li key={x.axis}><strong>{x.axis} ({x.score}점)</strong>{x.q && <> — {x.q.code} {x.q.text}: {x.q.anchorNow}</>}</li>)}
            </ul>
            {d.mentorView && <p className="small" style={{ margin: '6px 0 0' }}>멘토의 판단: {d.mentorView}</p>}
          </div>
        </div>
        <div className="brief-write">
          <span>둘은 어떻게 연결되나요? (멘토와 함께 적기)</span>
          <i /><i />
        </div>
      </Sec>

      <div className="brief-grid">
        <Sec n={7} title="합의한 목표">
          {d.goals.length ? (
            <ol>{d.goals.map((g, i) => <li key={i}><strong>{g.text}</strong><br /><span className="small muted">성공 기준: {g.success}</span></li>)}</ol>
          ) : (
            <div className="brief-write"><span>목표 1 · 성공 기준(숫자)</span><i /><span>목표 2 · 성공 기준(숫자)</span><i /></div>
          )}
        </Sec>
        <Sec n={8} title="첫 2주 실험">
          {d.experiments.length ? (
            d.experiments.slice(0, 2).map((x) => (
              <div key={x.id} className="small" style={{ marginBottom: 8 }}>
                <strong>{x.hypothesis}</strong><br />
                방법: {x.method || '–'} · 성공 기준: {x.success_metric} {x.target_value} · 기한 {x.due_date || '–'}
              </div>
            ))
          ) : (
            <div className="brief-write"><span>가설: 우리는 X 고객이 Y 문제로 Z에 돈을 낸다고 믿는다</span><i /><span>방법 · 성공 기준 · 기한</span><i /></div>
          )}
        </Sec>
      </div>

      <section className="brief-sec brief-mentee">
        <h3><Icon name="pen" size={16} /> 대표님이 직접 쓰는 칸</h3>
        <div className="brief-write"><span>오늘 내가 이해한 핵심 3줄</span><i /><i /><i /><span>다음 2주에 내가 할 일</span><i /></div>
      </section>

      <footer className="xsmall muted brief-foot">
        Keep Mentor 진단 기준: 7개 축 · 코어 12문항 · 증거등급 E0~E4 · 단계 관문 S0~S4. 점수와 관문 수치는 초기 기준이며 파일럿 후 개정합니다.
      </footer>
    </article>
  );
}
