'use client';

import { useState } from 'react';
import { Status, useAsync } from '@/components/ui';
import { Icon } from '@/components/icons';
import { call } from '@/lib/client';
import { deanonymize } from '@/lib/packets';
import type { TabProps } from './types';

export function ReportTab({ b, reload }: TabProps) {
  const e = b.engagement;
  const [mine, setMine] = useState(b.role === 'mentor' ? e.mentor_biggest_change ?? '' : e.mentee_biggest_change ?? '');
  const { busy, error, ok, run } = useAsync();
  const r = e.final_report as Record<string, unknown> | null | undefined;
  const da = (t: unknown) => deanonymize(t, b.company.name);
  const memo = (r?.invest_memo ?? {}) as Record<string, unknown>;

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title"><span className="ichip "><Icon name="stairs" /></span><h2>가장 크게 바뀐 점</h2></div>
        <p className="small muted">종합 리포트(J4)와 전문가 패널(J5) 패킷은 멘토와 멘티가 각자 이 칸을 쓴 뒤에 만들 수 있습니다.</p>
        <div className="side-by-side">
          <div><div className="small muted">멘토</div><div style={{ whiteSpace: 'pre-wrap' }}>{e.mentor_biggest_change || '-'}</div></div>
          <div><div className="small muted">멘티</div><div style={{ whiteSpace: 'pre-wrap' }}>{e.mentee_biggest_change || '-'}</div></div>
        </div>
        {(b.role === 'mentor' || b.role === 'mentee') && (
          <>
            <label className="human">내가 본 가장 큰 변화 1가지</label>
            <textarea value={mine} onChange={(ev) => setMine(ev.target.value)} />
            <Status error={error} ok={ok} />
            <button className="primary" disabled={busy} style={{ marginTop: 8 }} onClick={() => run(async () => {
              await call('updateEngagement', e.id, b.role === 'mentor' ? { mentor_biggest_change: mine } : { mentee_biggest_change: mine });
              await reload();
            }, '저장했습니다.')}>저장</button>
          </>
        )}
      </div>
      <div className="card">
        <div className="card-title"><span className="ichip blue"><Icon name="map" /></span><h2>종합 리포트</h2></div>
        {!r ? (
          <div className="muted">아직 없습니다. 멘토가 AI 작업함에서 J4 패킷을 처리해 가져오면 여기에 표시됩니다.</div>
        ) : (
          <>
            <span className="badge ai">AI 초안을 멘토가 확정</span>
            <p style={{ whiteSpace: 'pre-wrap' }}>{da(r.summary)}</p>
            <h3>목표 달성</h3>
            <ul className="small">
              {((r.goal_achievement as { goal: string; achieved: string; evidence: string }[]) ?? []).map((g, i) => (
                <li key={i}>{da(g.goal)} — <strong>{g.achieved}</strong> ({da(g.evidence)})</li>
              ))}
            </ul>
            <h3>90일 로드맵</h3>
            {((r.roadmap_90d as { period: string; actions: string[] }[]) ?? []).map((p, i) => (
              <div key={i} className="small"><strong>{p.period}</strong><ul>{(p.actions ?? []).map((a, k) => <li key={k}>{da(a)}</li>)}</ul></div>
            ))}
            <h3>1페이지 투자메모</h3>
            <table className="small">
              <tbody>
                <tr><th>문제</th><td>{da(memo.problem)}</td></tr>
                <tr><th>고객</th><td>{da(memo.customer)}</td></tr>
                <tr><th>견인 지표</th><td>{da(memo.traction)}</td></tr>
                <tr><th>리스크 Top 3</th><td>{((memo.risks as string[]) ?? []).map((x, i) => <div key={i}>{i + 1}. {da(x)}</div>)}</td></tr>
              </tbody>
            </table>
            <button style={{ marginTop: 12 }} onClick={() => window.print()}>인쇄 / PDF로 저장</button>
          </>
        )}
      </div>
    </div>
  );
}
