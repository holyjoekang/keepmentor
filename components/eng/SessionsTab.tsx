'use client';

import { useState } from 'react';
import { Origin, Status, useAsync } from '@/components/ui';
import { call } from '@/lib/client';
import { ISSUE_CODES } from '@/lib/methodology';
import type { Session } from '@/lib/schema';
import type { TabProps } from './types';

const empty = (): Partial<Session> => ({
  date: new Date().toISOString().slice(0, 10), mentor_own_summary: '', mentor_next_check: '', advice_3lines: '',
  decisions: '', mentor_confidence: 3, next_date: '', private_note: '', issue_codes: [],
});

export function SessionsTab({ b, reload }: TabProps) {
  const isMentor = b.role === 'mentor';
  const [editing, setEditing] = useState<Partial<Session> | null>(null);
  const lastOpen = b.experiments.filter((x) => x.status !== 'done');

  return (
    <div>
      {isMentor && !editing && (
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="primary" onClick={() => setEditing(empty())}>회차 기록 추가</button>
        </div>
      )}
      {editing && <SessionForm b={b} s={editing} lastOpen={lastOpen.length} onDone={async () => { setEditing(null); await reload(); }} onCancel={() => setEditing(null)} />}
      {!b.sessions.length && <div className="card muted">아직 회차 기록이 없습니다.</div>}
      {[...b.sessions].reverse().map((s) => (
        <SessionCard key={s.id} b={b} s={s} onEdit={() => setEditing(s)} reload={reload} />
      ))}
    </div>
  );
}

function SessionForm({ b, s, lastOpen, onDone, onCancel }: { b: TabProps['b']; s: Partial<Session>; lastOpen: number; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<Session>>(s);
  const { busy, error, ok, run } = useAsync();
  const set = (k: keyof Session) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: k === 'mentor_confidence' ? Number(e.target.value) : e.target.value });
  return (
    <div className="card">
      <h2>{f.id ? `${f.round_no}차 수정` : `${b.sessions.length + 1}차 기록`}</h2>
      {lastOpen > 0 && <div className="alert info">진행 중인 실험 카드 {lastOpen}개가 있습니다. 회차는 지난 과제 점검으로 시작합니다 (실험 카드 탭).</div>}
      <div className="grid grid-2">
        <div>
          <label>일시</label><input type="date" value={f.date ?? ''} onChange={set('date')} />
          <label className="human">핵심 3줄 — 회차 직후, AI를 쓰기 전에 직접 작성</label>
          <textarea value={f.mentor_own_summary ?? ''} onChange={set('mentor_own_summary')} />
          <label className="human">다음 회차에서 확인할 것 1줄</label>
          <input value={f.mentor_next_check ?? ''} onChange={set('mentor_next_check')} />
          <label>이슈 코드</label>
          <div className="row small">
            {ISSUE_CODES.map((i) => (
              <label key={i.code} style={{ display: 'inline-flex', gap: 4, margin: 0 }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={(f.issue_codes ?? []).includes(i.code)}
                  onChange={(e) => setF({ ...f, issue_codes: e.target.checked ? [...(f.issue_codes ?? []), i.code] : (f.issue_codes ?? []).filter((c) => c !== i.code) })} />
                {i.code} {i.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label>조언·권고 (AI 초안을 가져오면 여기에 채워짐)</label>
          <textarea value={f.advice_3lines ?? ''} onChange={set('advice_3lines')} />
          <label>대표가 결정한 것</label>
          <textarea value={f.decisions ?? ''} onChange={set('decisions')} />
          <div className="grid grid-2" style={{ gap: 8 }}>
            <div>
              <label>멘토 확신도</label>
              <select value={f.mentor_confidence ?? 3} onChange={set('mentor_confidence')}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div><label>다음 일정</label><input type="date" value={f.next_date ?? ''} onChange={set('next_date')} /></div>
          </div>
          <label>개인 메모 (멘토만 봄)</label>
          <textarea value={f.private_note ?? ''} onChange={set('private_note')} style={{ minHeight: 60 }} />
        </div>
      </div>
      <Status error={error} ok={ok} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="primary" disabled={busy} onClick={() => run(async () => { await call('saveSession', b.engagement.id, f); onDone(); })}>저장</button>
        <button onClick={onCancel}>취소</button>
      </div>
      <p className="small muted">저장한 뒤 AI 작업함에서 "J2 회차 일지 정리" 패킷을 만들 수 있습니다. 핵심 3줄과 다음 확인 사항이 비어 있으면 패킷을 만들 수 없습니다.</p>
    </div>
  );
}

function SessionCard({ b, s, onEdit, reload }: { b: TabProps['b']; s: Session; onEdit: () => void; reload: () => Promise<void> }) {
  const isMentor = b.role === 'mentor';
  const isMentee = b.role === 'mentee';
  const [ack, setAck] = useState({ mentee_own_summary: s.mentee_own_summary ?? '', mentee_own_tasks: s.mentee_own_tasks ?? '', mentee_comment: s.mentee_comment ?? '', mentee_rating: Number(s.mentee_rating ?? 0) });
  const { busy, error, ok, run } = useAsync();
  const acked = String(s.mentee_ack) === 'true';
  return (
    <div className="card">
      <div className="row between">
        <h2 style={{ margin: 0 }}>{s.round_no}차 · {s.date}</h2>
        <div className="row">
          <Origin origin={s.content_origin} prefix="조언" />
          <span className={`badge ${acked ? 'accent' : 'warn'}`}>{acked ? '멘티 확인 완료' : '멘티 확인 대기'}</span>
          {isMentor && <button onClick={onEdit}>수정</button>}
        </div>
      </div>
      <div className="side-by-side" style={{ marginTop: 12 }}>
        <div className="panel human">
          <div className="panel-label" style={{ color: 'var(--accent)' }}>멘토가 쓴 핵심 3줄 · 사람</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{s.mentor_own_summary || <span className="muted">(미작성)</span>}</div>
          <div className="small muted" style={{ marginTop: 8 }}>다음 회차에서 확인할 것</div>
          <div>{s.mentor_next_check || '-'}</div>
        </div>
        <div className={`panel ${s.content_origin && s.content_origin !== 'human' ? 'ai' : ''}`}>
          <div className="panel-label">조언·권고</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{s.advice_3lines || '-'}</div>
          <div className="small muted" style={{ marginTop: 8 }}>대표가 결정한 것</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{s.decisions || '-'}</div>
        </div>
      </div>
      <div className="row small" style={{ marginTop: 8 }}>
        {(s.issue_codes ?? []).map((c) => <span key={c} className="badge">{c} {ISSUE_CODES.find((i) => i.code === c)?.name}</span>)}
        {s.next_date && <span className="badge">다음 일정 {s.next_date}</span>}
      </div>
      {isMentor && s.private_note && <div className="alert info small">개인 메모: {s.private_note}</div>}

      <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 8 }}>
        <h3>멘티 확인</h3>
        {isMentee && !acked ? (
          <>
            <label className="human">내가 이해한 핵심 3줄 (멘토 기록을 보고 내 말로)</label>
            <textarea value={ack.mentee_own_summary} onChange={(e) => setAck({ ...ack, mentee_own_summary: e.target.value })} />
            <label className="human">이번 2주에 내가 할 일</label>
            <textarea value={ack.mentee_own_tasks} onChange={(e) => setAck({ ...ack, mentee_own_tasks: e.target.value })} style={{ minHeight: 60 }} />
            <label>멘토에게 한마디 (선택)</label>
            <input value={ack.mentee_comment} onChange={(e) => setAck({ ...ack, mentee_comment: e.target.value })} />
            <label>이번 회차 유용성</label>
            <div className="scale">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} className={ack.mentee_rating === n ? 'on' : ''} onClick={() => setAck({ ...ack, mentee_rating: n })}>{n}</button>)}
            </div>
            <Status error={error} ok={ok} />
            <div style={{ marginTop: 8 }}>
              <button className="primary" disabled={busy} onClick={() => run(async () => { await call('ackSession', s.id, ack); await reload(); })}>확인하고 동의</button>
            </div>
          </>
        ) : acked ? (
          <div className="side-by-side">
            <div><div className="small muted">멘티가 이해한 핵심</div><div style={{ whiteSpace: 'pre-wrap' }}>{s.mentee_own_summary}</div></div>
            <div><div className="small muted">멘티가 할 일</div><div style={{ whiteSpace: 'pre-wrap' }}>{s.mentee_own_tasks}</div>
              {s.mentee_comment && <div className="small muted" style={{ marginTop: 6 }}>코멘트: {s.mentee_comment}</div>}
              {s.mentee_rating ? <div className="small muted">유용성 {s.mentee_rating}/5</div> : null}
            </div>
          </div>
        ) : (
          <div className="muted small">멘티가 아직 확인하지 않았습니다.</div>
        )}
      </div>
    </div>
  );
}
