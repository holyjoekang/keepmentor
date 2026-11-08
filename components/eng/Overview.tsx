'use client';

import { useState } from 'react';
import { Radar } from '@/components/Radar';
import { Icon } from '@/components/icons';
import { EvidenceBar } from '@/components/visuals';
import { Status, useAsync } from '@/components/ui';
import { call } from '@/lib/client';
import { AXES, CORE_QUESTIONS, RED_FLAGS, RUNWAY_THRESHOLD_MONTHS, STAGES, gatesFor, type Stage } from '@/lib/methodology';
import { autoRedFlags, axisScores, bottleneckCandidates, gradeLift, suggestedStage } from '@/lib/scoring';
import type { Goal } from '@/lib/schema';
import type { TabProps } from './types';

export function Overview({ b, reload }: TabProps) {
  const e = b.engagement;
  const isMentor = (b.role === 'mentor' || b.can_record);
  const self = axisScores(b.assessments, 'self');
  const mentor = axisScores(b.assessments, 'mentor');
  const bottlenecks = bottleneckCandidates(b.assessments);
  const auto = autoRedFlags(b.company);
  const flags = Array.from(new Set([...(e.red_flags ?? []), ...auto]));
  const gates = gatesFor(b.company.industry);
  const suggested = suggestedStage(e, b.company);
  const { busy, error, ok, run } = useAsync();

  const [stage, setStage] = useState<Stage>((e.stage as Stage) || 'S0');
  const [reason, setReason] = useState('');
  const [gateState, setGateState] = useState(e.gates ?? {});
  const [manualFlags, setManualFlags] = useState<string[]>(e.red_flags ?? []);
  const [goals, setGoals] = useState<Goal[]>(e.goals?.length ? e.goals : [{ text: '', success: '', q_codes: [] }]);

  const lifts = gradeLift(b.assessments, Array.from(new Set((e.goals ?? []).flatMap((g) => g.q_codes))));

  return (
    <div>
    <div className="card row between" style={{ background: 'var(--accent-soft)', borderColor: 'transparent' }}>
      <div>
        <strong>멘티용 진단 결과 설명지</strong>
        <div className="small muted">1차 미팅에서 설명할 순서(단계 → 강점 → 판단 차이 → 위험 → 병목 → 목표 → 2주 실험)대로 한 장에 정리합니다.</div>
      </div>
      <a href={`/eng/${e.id}/brief`} className="btn primary"><Icon name="file" size={15} /> 설명지 열기</a>
    </div>
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title"><span className="ichip "><Icon name="target" /></span><h2>축별 진단</h2></div>
        <Radar self={self} mentor={mentor} />
        <table style={{ marginTop: 8 }}>
          <thead><tr><th>축</th><th>자가</th><th>멘토</th></tr></thead>
          <tbody>
            {AXES.map((a) => (
              <tr key={a.code}>
                <td>{a.name} {bottlenecks.includes(a.code) && <span className="badge warn">병목 후보</span>}</td>
                <td>{self[a.code] ?? '-'}</td>
                <td>{mentor[a.code] ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14 }}><div className="xsmall muted" style={{ fontWeight: 600, marginBottom: 6 }}>증거등급 분포 (멘토 보정 우선)</div><EvidenceBar grades={b.assessments.filter((a) => a.rater === (b.assessments.some((x) => x.rater === 'mentor') ? 'mentor' : 'self')).map((a) => String(a.evidence_grade))} /></div>
        <p className="small muted" style={{ marginTop: 12 }}>점수는 입력 점수와 증거등급 상한 중 낮은 값입니다. 자가진단과 멘토 보정의 차이가 크면 1차에서 다룹니다.</p>
      </div>

      <div>
        <div className="card">
          <div className="card-title"><span className="ichip danger"><Icon name="flag" /></span><h2>레드플래그</h2></div>
          <p className="small muted">하나라도 켜지면 점수와 상관없이 우선 개입 영역이 됩니다.</p>
          {RED_FLAGS.map((f) => {
            const isAuto = auto.includes(f.code);
            const on = isAuto || manualFlags.includes(f.code);
            return (
              <div key={f.code} className="row" style={{ margin: '6px 0' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={on} disabled={!isMentor || isAuto}
                  onChange={(ev) => setManualFlags(ev.target.checked ? [...manualFlags, f.code] : manualFlags.filter((x) => x !== f.code))} />
                <span className={on ? '' : 'muted'}>{f.label}</span>
                {isAuto && <span className="badge danger">자동: 런웨이 {b.company.runway_months}개월 &lt; {RUNWAY_THRESHOLD_MONTHS}</span>}
              </div>
            );
          })}
          {flags.length === 0 && <div className="alert ok">켜진 레드플래그가 없습니다.</div>}
        </div>

        <div className="card">
          <div className="card-title"><span className="ichip blue"><Icon name="stairs" /></span><h2>단계 관문</h2></div>
          <p className="small muted">관문은 "외부 검증 증거 1건 이상"입니다. 무엇을 증거로 인정할지는 업종 템플릿이 정합니다.</p>
          {gates.map((g) => (
            <div key={g.to} className="qrow">
              <div className="row">
                <input type="checkbox" style={{ width: 'auto' }} disabled={!isMentor} checked={!!gateState[g.to]?.met}
                  onChange={(ev) => setGateState({ ...gateState, [g.to]: { met: ev.target.checked, note: gateState[g.to]?.note ?? '' } })} />
                <strong>→ {g.to}</strong> <span className="small">{g.evidence}</span>
              </div>
              {isMentor && gateState[g.to]?.met && (
                <input placeholder="확인한 증거 (링크·수치)" value={gateState[g.to]?.note ?? ''}
                  onChange={(ev) => setGateState({ ...gateState, [g.to]: { met: true, note: ev.target.value } })} style={{ marginTop: 6 }} />
              )}
              {!isMentor && gateState[g.to]?.note && <div className="small muted">{gateState[g.to]?.note}</div>}
            </div>
          ))}
          <div className="small" style={{ marginTop: 8 }}>관문 기준 제안 단계: <strong>{suggested}</strong> · 현재 단계: <strong>{e.stage}</strong></div>
          {e.stage_transition_reason && <div className="small muted">최근 전환 근거: {e.stage_transition_reason}</div>}
          <a href={`/cases?stage=${e.stage ?? 'S0'}`} target="_blank" rel="noopener" className="small" style={{ display: 'inline-block', marginTop: 6 }}>이 단계에서 자주 나오는 사례 보기 ↗</a>
          {isMentor && (
            <>
              <label>단계</label>
              <select value={stage} onChange={(ev) => setStage(ev.target.value as Stage)}>
                {STAGES.map((s) => <option key={s.code} value={s.code}>{s.code} {s.name} — {s.question}</option>)}
              </select>
              {stage !== e.stage && (
                <>
                  <label className="human">왜 이 단계로 넘어가는가 (근거와 참조한 증거)</label>
                  <textarea value={reason} onChange={(ev) => setReason(ev.target.value)} />
                </>
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title"><span className="ichip "><Icon name="compass" /></span><h2>멘토링 목표</h2></div>
          <p className="small muted">3회차 안에 달성 가능한 1~2개. 요청 이슈 1개 + 진단상 병목 1개를 권장합니다.</p>
          {goals.map((g, i) => (
            <div key={i} className="qrow">
              {isMentor ? (
                <>
                  <input placeholder="목표" value={g.text} onChange={(ev) => setGoals(goals.map((x, j) => (j === i ? { ...x, text: ev.target.value } : x)))} />
                  <input placeholder="성공 기준 (숫자)" value={g.success} style={{ marginTop: 6 }} onChange={(ev) => setGoals(goals.map((x, j) => (j === i ? { ...x, success: ev.target.value } : x)))} />
                  <div className="row small" style={{ marginTop: 6 }}>
                    연결 문항:
                    {CORE_QUESTIONS.map((q) => (
                      <label key={q.code} style={{ display: 'inline-flex', gap: 4, margin: 0 }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={g.q_codes.includes(q.code)}
                          onChange={(ev) => setGoals(goals.map((x, j) => (j === i ? { ...x, q_codes: ev.target.checked ? [...x.q_codes, q.code] : x.q_codes.filter((c) => c !== q.code) } : x)))} />
                        {q.code}
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <div><strong>{g.text || '(미정)'}</strong> <span className="muted small">— 성공 기준: {g.success}</span></div>
              )}
            </div>
          ))}
          {isMentor && goals.length < 2 && <button onClick={() => setGoals([...goals, { text: '', success: '', q_codes: [] }])}>목표 추가</button>}
          {lifts.length > 0 && (
            <div className="small" style={{ marginTop: 8 }}>
              증거등급 변화 (성과 1순위 지표):{' '}
              {lifts.map((l) => <span key={l.q} className={`badge ${l.lifted ? 'accent' : ''}`}>{l.q} {l.from ?? '-'}→{l.to ?? '-'}</span>)}
            </div>
          )}
        </div>

        {isMentor && (
          <div className="card">
            <Status error={error} ok={ok} />
            <button className="primary" disabled={busy} onClick={() => run(async () => {
              await call('updateEngagement', e.id, {
                stage, stage_transition_reason: stage !== e.stage ? reason : e.stage_transition_reason,
                gates: gateState, red_flags: manualFlags.filter((f) => f !== 'runway'),
                goals: goals.filter((g) => g.text.trim()), bottlenecks,
              });
              setReason('');
              await reload();
            }, '저장했습니다.')}>진단 리포트 저장</button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
