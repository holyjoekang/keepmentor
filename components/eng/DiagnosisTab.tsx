'use client';

import { useMemo, useState } from 'react';
import { Origin, Status, useAsync } from '@/components/ui';
import { call } from '@/lib/client';
import { AXES, CAP_EXEMPT, CORE_QUESTIONS, EVIDENCE_TYPES, GRADE_CAP, gradeOf } from '@/lib/methodology';
import type { TabProps } from './types';

interface Item { q_code: string; score_input: number; evidence_type: string; evidence_note: string; override_reason: string }

export function DiagnosisTab({ b, reload }: TabProps) {
  const rater = b.role === 'mentee' ? 'self' : b.role === 'mentor' ? 'mentor' : null;
  const rounds = Array.from(new Set([0, ...b.assessments.map((a) => Number(a.round))])).sort((x, y) => x - y);
  const [round, setRound] = useState(0);
  const { busy, error, ok, run } = useAsync();

  const initial = useMemo(() => {
    const m: Record<string, Item> = {};
    for (const q of CORE_QUESTIONS) {
      const prev = b.assessments.find((a) => a.rater === rater && Number(a.round) === round && a.q_code === q.code);
      const selfPrev = b.assessments.find((a) => a.rater === 'self' && Number(a.round) === round && a.q_code === q.code);
      const base = prev ?? (rater === 'mentor' ? selfPrev : undefined);
      m[q.code] = {
        q_code: q.code, score_input: Number(base?.score_input ?? 0), evidence_type: String(base?.evidence_type ?? 'none'),
        evidence_note: String(base?.evidence_note ?? ''), override_reason: String(prev?.override_reason ?? ''),
      };
    }
    return m;
  }, [b.assessments, rater, round]);
  const [items, setItems] = useState(initial);
  const [loadedFor, setLoadedFor] = useState(`${round}`);
  if (loadedFor !== `${round}`) { setItems(initial); setLoadedFor(`${round}`); }

  const upd = (q: string, patch: Partial<Item>) => setItems({ ...items, [q]: { ...items[q], ...patch } });

  if (!rater) return <div className="card muted">기관 담당자는 진단 결과를 진단 리포트 탭에서 봅니다.</div>;

  return (
    <div className="card">
      <div className="row between">
        <h2>{rater === 'self' ? '자가진단' : '멘토 보정'} — 코어 12문항</h2>
        <div className="row small">
          회차
          <select value={round} onChange={(e) => setRound(Number(e.target.value))} style={{ width: 'auto' }}>
            {Array.from(new Set([...rounds, 3])).sort((x, y) => x - y).map((r) => <option key={r} value={r}>{r === 0 ? '사전 (0)' : `${r}차 재측정`}</option>)}
          </select>
        </div>
      </div>
      <p className="small muted">
        점수는 각 단계의 행동 기준을 보고 고르세요. 증거 유형에 따라 점수 상한이 자동으로 걸립니다 (근거 없음·지인 2점, 인터뷰·데이터 3점, 행동 증거 4점, 돈·제3자 검증 5점).
        {rater === 'self' && ' 자가진단은 10분 안에 끝내는 것을 목표로 합니다.'}
      </p>
      {AXES.map((ax) => (
        <div key={ax.code} style={{ marginTop: 16 }}>
          <h3>{ax.name}</h3>
          {CORE_QUESTIONS.filter((q) => q.axis === ax.code).map((q) => {
            const it = items[q.code];
            const grade = gradeOf(it.evidence_type);
            const exempt = CAP_EXEMPT.has(q.code);
            const cap = exempt ? 5 : GRADE_CAP[grade];
            const capped = !exempt && it.score_input > cap;
            const selfRow = b.assessments.find((a) => a.rater === 'self' && Number(a.round) === round && a.q_code === q.code);
            const myRow = b.assessments.find((a) => a.rater === rater && Number(a.round) === round && a.q_code === q.code);
            return (
              <div className="qrow" key={q.code}>
                <div className="row between">
                  <strong>{q.code} · {q.text}</strong>
                  <span className="row">
                    <Origin origin={myRow?.origin} />
                    {exempt ? <span className="badge">사실 입력 · 상한 없음</span> : <span className={`badge ${capped ? 'warn' : ''}`}>{grade} · 상한 {cap}{capped ? ` → ${cap}점으로 확정` : ''}</span>}
                  </span>
                </div>
                <div className="scale" style={{ marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} className={it.score_input === s ? 'on' : ''} onClick={() => upd(q.code, { score_input: s })}>{s}</button>
                  ))}
                </div>
                {it.score_input > 0 && <div className="anchor">{it.score_input}점: {q.anchors[it.score_input - 1]}</div>}
                <div className="grid grid-2" style={{ gap: 8, marginTop: 6 }}>
                  <select value={it.evidence_type} onChange={(e) => upd(q.code, { evidence_type: e.target.value })}>
                    {EVIDENCE_TYPES.map((t) => <option key={t.code} value={t.code}>{t.grade} {t.label}</option>)}
                  </select>
                  <input placeholder="근거 (링크·수치·사례)" value={it.evidence_note} onChange={(e) => upd(q.code, { evidence_note: e.target.value })} />
                </div>
                {rater === 'mentor' && selfRow && (
                  <div className="small muted" style={{ marginTop: 4 }}>
                    멘티 자가: {selfRow.score_input}점 ({selfRow.evidence_grade}) — {selfRow.evidence_note || '근거 없음'}
                    {Math.abs(Number(selfRow.score_input) - it.score_input) >= 2 && it.score_input > 0 && (
                      <input placeholder="차이가 2점 이상입니다. 보정 사유" value={it.override_reason} onChange={(e) => upd(q.code, { override_reason: e.target.value })} style={{ marginTop: 4 }} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <Status error={error} ok={ok} />
      <div style={{ marginTop: 12 }}>
        <button className="primary" disabled={busy} onClick={() => run(async () => {
          await call('saveAssessments', b.engagement.id, round, rater, Object.values(items).filter((i) => i.score_input > 0));
          await reload();
        }, '저장했습니다.')}>저장</button>
      </div>
    </div>
  );
}
