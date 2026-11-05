'use client';

import { useState } from 'react';
import { Status, copyText, downloadText, useAsync } from '@/components/ui';
import { Icon } from '@/components/icons';
import { call } from '@/lib/client';
import { AXES, EVIDENCE_TYPES } from '@/lib/methodology';
import { TASKS, deanonymize, missingHumanInputs, parseResult, type TaskType } from '@/lib/packets';
import type { AIJob } from '@/lib/schema';
import type { TabProps } from './types';

const STATUS_LABEL: Record<string, string> = { exported: '결과 대기', imported: '가져옴', rejected: '거부' };

export function AITab({ b, reload }: TabProps) {
  const [type, setType] = useState<TaskType>('J1');
  const [refId, setRefId] = useState<string>(b.sessions[b.sessions.length - 1]?.id ?? '');
  const { busy, error, ok, run } = useAsync();
  const [openJob, setOpenJob] = useState<string | null>(null);
  const missing = missingHumanInputs(type, b, type === 'J2' ? refId : undefined);
  const jobs = [...b.jobs].sort((x, y) => String(y.exported_at).localeCompare(String(x.exported_at)));

  return (
    <div>
      <div className="alert ai">
        이 앱은 AI를 직접 호출하지 않습니다. 패킷을 복사해 Claude 프로젝트에 붙여 넣고, 돌아온 응답을 아래 "결과 가져오기"에 붙여 넣으세요.
        사람이 먼저 써야 하는 항목이 비어 있으면 패킷을 만들 수 없습니다.
      </div>
      <div className="card">
        <div className="card-title"><span className="ichip ai"><Icon name="sparkle" /></span><h2>AI 패킷 만들기</h2></div>
        <div className="grid grid-2">
          <div>
            <label>작업 유형</label>
            <select value={type} onChange={(e) => setType(e.target.value as TaskType)}>
              {(Object.keys(TASKS) as TaskType[]).map((k) => <option key={k} value={k}>{k} {TASKS[k].name}</option>)}
            </select>
          </div>
          {type === 'J2' && (
            <div>
              <label>대상 회차</label>
              <select value={refId} onChange={(e) => setRefId(e.target.value)}>
                {b.sessions.map((s) => <option key={s.id} value={s.id}>{s.round_no}차 · {s.date}</option>)}
              </select>
            </div>
          )}
        </div>
        {missing.length > 0 && (
          <div className="alert error small">
            먼저 사람이 써야 할 항목: {missing.join(' / ')}
          </div>
        )}
        {type === 'J2' && <p className="small muted">회의록·녹취록은 앱에 올리지 말고 Claude 프로젝트 대화에 직접 첨부하세요. 첨부 전에 실명과 연락처를 가려 주세요.</p>}
        <Status error={error} ok={ok} />
        <button className="ai" disabled={busy || missing.length > 0} onClick={() => run(async () => {
          const job = await call('createJob', b.engagement.id, type, type === 'J2' ? refId : undefined);
          await reload();
          setOpenJob(job.id);
        })}>패킷 만들기</button>
      </div>

      <h2>작업 목록</h2>
      {!jobs.length && <div className="card muted">아직 만든 패킷이 없습니다.</div>}
      {jobs.map((j) => (
        <JobCard key={j.id} b={b} j={j} open={openJob === j.id} toggle={() => setOpenJob(openJob === j.id ? null : j.id)} reload={reload} />
      ))}
    </div>
  );
}

function JobCard({ b, j, open, toggle, reload }: { b: TabProps['b']; j: AIJob; open: boolean; toggle: () => void; reload: () => Promise<void> }) {
  const type = j.task_type as TaskType;
  const [raw, setRaw] = useState('');
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const { busy, error, run } = useAsync();
  const [ownBottleneck, setOwnBottleneck] = useState(b.engagement.mentor_own_bottleneck ?? '');
  const [ownLocked, setOwnLocked] = useState(!!b.engagement.mentor_own_bottleneck);
  const [choice, setChoice] = useState('');
  const [decision, setDecision] = useState('');
  const [accepted, setAccepted] = useState<string[]>([]);
  const name = b.company.name;
  const da = (t: unknown) => deanonymize(t, name);

  function check() {
    const r = parseResult(type, j.id, raw);
    if (r.ok) {
      setParsed(r.data); setErrors([]);
      if (type === 'J2') setAccepted(((r.data.experiments as unknown[]) ?? []).map((_, i) => String(i)));
      if (type === 'J3') setAccepted([]);
    } else { setParsed(null); setErrors(r.errors); }
  }

  const sess = b.sessions.find((s) => s.id === j.ref_id);

  return (
    <div className="card">
      <div className="row between">
        <div>
          <strong>{j.task_type} {TASKS[type]?.name}</strong>{sess && <span className="muted small"> · {sess.round_no}차</span>}
          <div className="small muted">{j.id} · {String(j.exported_at).slice(0, 16).replace('T', ' ')}</div>
        </div>
        <div className="row">
          <span className={`badge ${j.status === 'imported' ? 'accent' : j.status === 'rejected' ? 'danger' : 'ai'}`}>{STATUS_LABEL[j.status]}</span>
          <button onClick={toggle}>{open ? '닫기' : '열기'}</button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12 }}>
          <h3>1. 패킷 복사 → Claude 프로젝트에 붙여 넣기</h3>
          <pre className="packet">{j.packet_text}</pre>
          <div className="row">
            <button onClick={async () => { await copyText(j.packet_text); setCopied(true); }}>{copied ? '복사됨' : '복사'}</button>
            <button onClick={() => downloadText(`${j.id}.md`, j.packet_text)}>.md 다운로드</button>
          </div>

          {j.status === 'exported' && (
            <>
              <h3 style={{ marginTop: 16 }}>2. 결과 가져오기</h3>
              {type === 'J1' && !ownLocked && (
                <div className="alert info">
                  <label className="human" style={{ marginTop: 0 }}>AI 브리핑을 보기 전에: 내가 보는 병목 1줄</label>
                  <input value={ownBottleneck} onChange={(e) => setOwnBottleneck(e.target.value)} />
                  <button style={{ marginTop: 8 }} disabled={!ownBottleneck.trim()} onClick={() => setOwnLocked(true)}>확정하고 결과 붙여 넣기</button>
                </div>
              )}
              {(type !== 'J1' || ownLocked) && (
                <>
                  <textarea placeholder="Claude 응답 전체를 붙여 넣으세요 (```json 블록 포함)" value={raw} onChange={(e) => setRaw(e.target.value)} style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 13 }} />
                  <div className="row" style={{ marginTop: 8 }}>
                    <button onClick={check} disabled={!raw.trim()}>검증하고 미리보기</button>
                    <button onClick={() => run(async () => { await call('rejectJob', j.id, '멘토가 거부'); await reload(); })}>이 작업 거부</button>
                  </div>
                </>
              )}
              {errors.length > 0 && <div className="alert error small">{errors.map((e) => <div key={e}>{e}</div>)}</div>}

              {parsed && (
                <div style={{ marginTop: 12 }}>
                  <h3>3. 미리보기와 확정</h3>
                  {type === 'J1' && (
                    <>
                      <div className="side-by-side">
                        <div className="card" style={{ margin: 0 }}>
                          <div className="small muted">내가 본 병목 (사람)</div>
                          <div>{ownBottleneck}</div>
                        </div>
                        <div className="card" style={{ margin: 0 }}>
                          <div className="small muted">AI 브리핑</div>
                          <div>{da(parsed.summary)}</div>
                          <div className="small" style={{ marginTop: 6 }}>추정 단계: <strong>{String(parsed.stage_estimate)}</strong> — {da(parsed.stage_reason)}</div>
                          <ul className="small">
                            {((parsed.bottlenecks as { axis: string; reason: string }[]) ?? []).map((x, i) => (
                              <li key={i}><strong>{AXES.find((a) => a.code === x.axis)?.name ?? x.axis}</strong>: {da(x.reason)}</li>
                            ))}
                          </ul>
                          <div className="small muted">1차 질문</div>
                          <ol className="small">{((parsed.questions as string[]) ?? []).map((q, i) => <li key={i}>{da(q)}</li>)}</ol>
                        </div>
                      </div>
                      <label className="human">어느 쪽을 택했는지와 이유 한 줄</label>
                      <input value={choice} onChange={(e) => setChoice(e.target.value)} />
                    </>
                  )}
                  {type === 'J2' && (
                    <>
                      {sess?.mentor_own_summary && (
                        <div className="side-by-side">
                          <div className="card" style={{ margin: 0 }}><div className="small muted">멘토가 쓴 핵심 3줄 (사람)</div><div style={{ whiteSpace: 'pre-wrap' }}>{sess.mentor_own_summary}</div></div>
                          <div className="card" style={{ margin: 0 }}><div className="small muted">AI 조언 초안</div><ol>{((parsed.advice_3lines as string[]) ?? []).map((a, i) => <li key={i}>{da(a)}</li>)}</ol>
                            <div className="small muted">결정</div><div>{da(parsed.decisions)}</div></div>
                        </div>
                      )}
                      <div className="small muted" style={{ marginTop: 8 }}>실험 카드 초안 — 채택할 것만 체크</div>
                      {((parsed.experiments as Record<string, unknown>[]) ?? []).map((x, i) => (
                        <div key={i} className="row" style={{ alignItems: 'flex-start', margin: '6px 0' }}>
                          <input type="checkbox" style={{ width: 'auto', marginTop: 4 }} checked={accepted.includes(String(i))}
                            onChange={(e) => setAccepted(e.target.checked ? [...accepted, String(i)] : accepted.filter((a) => a !== String(i)))} />
                          <div className="small"><strong>{da(x.hypothesis)}</strong><br />{da(x.method)} · {da(x.success_metric)} {da(x.target_value)} · {String(x.due_days ?? 14)}일</div>
                        </div>
                      ))}
                    </>
                  )}
                  {type === 'J3' && (
                    <table>
                      <thead><tr><th>채택</th><th>문항</th><th>AI 판정</th><th>사유</th></tr></thead>
                      <tbody>
                        {((parsed.grades as { q_code: string; suggested_type: string; reason: string }[]) ?? []).map((g) => (
                          <tr key={g.q_code}>
                            <td><input type="checkbox" style={{ width: 'auto' }} checked={accepted.includes(g.q_code)}
                              onChange={(e) => setAccepted(e.target.checked ? [...accepted, g.q_code] : accepted.filter((a) => a !== g.q_code))} /></td>
                            <td>{g.q_code}</td>
                            <td>{EVIDENCE_TYPES.find((t) => t.code === g.suggested_type)?.grade} {EVIDENCE_TYPES.find((t) => t.code === g.suggested_type)?.label ?? g.suggested_type}</td>
                            <td className="small">{da(g.reason)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {type === 'J4' && (
                    <div className="small">
                      <p>{da(parsed.summary)}</p>
                      <p className="muted">90일 로드맵 {((parsed.roadmap_90d as unknown[]) ?? []).length}구간, 투자메모 포함. 가져오면 종합 탭에 표시됩니다.</p>
                    </div>
                  )}
                  {type === 'J5' && (
                    <>
                      <div className="small muted">합의안</div>
                      <ul className="small">
                        {(((parsed.synthesis as Record<string, unknown>)?.agreements as { text: string; level: string }[]) ?? []).map((a, i) => <li key={i}>{da(a.text)} <span className="badge">{a.level}</span></li>)}
                      </ul>
                      <div className="small muted">남은 이견</div>
                      <ul className="small">{(((parsed.synthesis as Record<string, unknown>)?.dissents as string[]) ?? []).map((d, i) => <li key={i}>{da(d)}</li>)}</ul>
                      <label className="human">패널 의견에 대한 멘토 결정 (채택·수정·기각과 이유)</label>
                      <textarea value={decision} onChange={(e) => setDecision(e.target.value)} />
                    </>
                  )}
                  {error && <div className="alert error">{error}</div>}
                  <button className="primary" style={{ marginTop: 12 }} disabled={busy} onClick={() => run(async () => {
                    await call('applyJob', j.id, parsed, { choice_reason: choice, mentor_decision: decision, accepted, mentor_own_bottleneck: ownBottleneck });
                    await reload();
                  })}>확정하고 반영</button>
                </div>
              )}
            </>
          )}
          {j.status === 'imported' && <div className="alert ok small" style={{ marginTop: 12 }}>{String(j.imported_at).slice(0, 16).replace('T', ' ')}에 {j.confirmed_by}가 확정했습니다.</div>}
          {j.status === 'rejected' && <div className="alert error small" style={{ marginTop: 12 }}>거부됨: {j.reject_reason}</div>}
        </div>
      )}
    </div>
  );
}
