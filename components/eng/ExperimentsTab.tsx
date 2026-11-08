'use client';

import { useState } from 'react';
import { Origin, Status, useAsync } from '@/components/ui';
import { call } from '@/lib/client';
import type { Experiment } from '@/lib/schema';
import type { TabProps } from './types';

export function ExperimentsTab({ b, reload }: TabProps) {
  const isMentor = (b.role === 'mentor' || b.can_record);
  const [adding, setAdding] = useState(false);
  const open = b.experiments.filter((x) => x.status !== 'done');
  const done = b.experiments.filter((x) => x.status === 'done');
  return (
    <div>
      <p className="muted small">회차의 기본 단위는 실험 카드입니다. 가설 → 방법 → 성공 기준 → 기한 → 결과 → 배운 것 → 결정(Pivot / Persevere / Kill).</p>
      {isMentor && !adding && <button className="primary" onClick={() => setAdding(true)} style={{ marginBottom: 12 }}>실험 카드 추가</button>}
      {adding && <ExperimentCard b={b} x={{ hypothesis: '', status: 'open' } as Experiment} isNew onDone={async () => { setAdding(false); await reload(); }} />}
      <h2>진행 중 ({open.length})</h2>
      {open.map((x) => <ExperimentCard key={x.id} b={b} x={x} onDone={reload} />)}
      {!open.length && <div className="card muted">진행 중인 실험이 없습니다.</div>}
      <h2>완료 ({done.length})</h2>
      {done.map((x) => <ExperimentCard key={x.id} b={b} x={x} onDone={reload} />)}
    </div>
  );
}

function ExperimentCard({ b, x, isNew, onDone }: { b: TabProps['b']; x: Experiment; isNew?: boolean; onDone: () => Promise<void> | void }) {
  const isMentor = (b.role === 'mentor' || b.can_record);
  const [f, setF] = useState<Experiment>(x);
  const { busy, error, ok, run } = useAsync();
  const set = (k: keyof Experiment) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const done = x.status === 'done';
  const canDesign = isMentor && !done;
  return (
    <div className="card">
      <div className="row between">
        <strong>{isNew ? '새 실험 카드' : `기한 ${x.due_date || '-'}`}</strong>
        <div className="row"><Origin origin={x.origin} />{done && <span className="badge accent">{x.decision || '완료'}</span>}</div>
      </div>
      <label>가설 — 우리는 X 고객이 Y 문제로 Z에 돈을 낸다고 믿는다</label>
      <textarea value={f.hypothesis} onChange={set('hypothesis')} disabled={!canDesign} style={{ minHeight: 56 }} />
      <div className="grid grid-2" style={{ gap: 8 }}>
        <div><label>검증 방법</label><input value={f.method ?? ''} onChange={set('method')} disabled={!canDesign} /></div>
        <div><label>성공 기준 지표</label><input value={f.success_metric ?? ''} onChange={set('success_metric')} disabled={!canDesign} /></div>
        <div><label>목표값</label><input value={f.target_value ?? ''} onChange={set('target_value')} disabled={!canDesign} /></div>
        <div><label>기한</label><input type="date" value={f.due_date ?? ''} onChange={set('due_date')} disabled={!canDesign} /></div>
      </div>
      {!isNew && (
        <div className="grid grid-2" style={{ gap: 8 }}>
          <div><label className="human">결과 수치</label><input value={f.result_value ?? ''} onChange={set('result_value')} disabled={done} /></div>
          <div>
            <label>결정 (멘토)</label>
            <select value={f.decision ?? ''} onChange={set('decision')} disabled={!isMentor || done}>
              <option value="">-</option><option>Pivot</option><option>Persevere</option><option>Kill</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}><label className="human">배운 것</label><textarea value={f.learning ?? ''} onChange={set('learning')} disabled={done} style={{ minHeight: 56 }} /></div>
        </div>
      )}
      <Status error={error} ok={ok} />
      {!done && (
        <div className="row" style={{ marginTop: 10 }}>
          <button disabled={busy} onClick={() => run(async () => { await call('saveExperiment', b.engagement.id, { ...f, status: 'open' }); await onDone(); }, '저장했습니다.')}>저장</button>
          {!isNew && <button className="primary" disabled={busy} onClick={() => run(async () => { await call('saveExperiment', b.engagement.id, { ...f, status: 'done' }); await onDone(); })}>완료 처리</button>}
        </div>
      )}
    </div>
  );
}
