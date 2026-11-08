'use client';

import { MentoringArt } from '@/components/MentoringArt';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MarkdownNotes, downloadMarkdown } from '@/components/MarkdownNotes';
import { MarkdownView } from '@/components/MarkdownView';
import { Icon } from '@/components/icons';
import { ErrorBox, Status, TopBar, useAsync, useMe } from '@/components/ui';
import { call } from '@/lib/client';
import { parseMeetingNotes } from '@/lib/notes';
import type { MentorMeeting } from '@/lib/schema';

const blank = (): Partial<MentorMeeting> => ({ date: new Date().toISOString().slice(0, 10), title: '', participants: '', share_emails: [], tags: [], summary: '', next_steps: [], details: [], my_takeaways: '', notes_source: '', linked_eng_ids: [] });

interface LinkEng { id: string; company_id: string; company: string; kind: string; mentor_name: string; role: string | null; can_record: boolean }
const engLabel = (e: LinkEng) => `${e.company} · ${e.kind === 'received' ? `받는 멘토링(${e.mentor_name})` : e.role === 'mentor' ? '내가 멘토' : e.role === 'mentee' ? '내가 멘티' : '기관'}`;

export default function MeetingsPage() {
  const me = useMe();
  const [list, setList] = useState<MentorMeeting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<MentorMeeting> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [engs, setEngs] = useState<LinkEng[]>([]);
  const [filter, setFilter] = useState('');

  async function load() {
    try {
      const [ms, es] = await Promise.all([call('meetings'), call('linkableEngagements')]);
      setList(ms); setEngs(es as LinkEng[]);
    } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { const f = new URLSearchParams(window.location.search).get('eng'); if (f) setFilter(f); }, []);
  useEffect(() => { if (me) load(); }, [me]);
  const [deleting, setDeleting] = useState<string | null>(null);
  if (!me) return <TopBar />;
  const isAdmin = String(me.is_admin) === 'true';

  const k = q.trim().toLowerCase();
  const shown = (list ?? []).filter((m) => (!k || [m.title, m.participants, m.summary, m.meeting_notes, (m.tags ?? []).join(' ')].join(' ').toLowerCase().includes(k))
    && (!filter || (filter === 'none' ? !(m.linked_eng_ids ?? []).length : (m.linked_eng_ids ?? []).includes(filter))));

  return (
    <>
      <TopBar me={me} />
      <div className="wrap mentoring-workspace">
        <MentoringArt variant={1} />
        <div className="row between mentoring-heading">
          <div>
            <div className="eyebrow">Mentor meetings</div>
            <h1 style={{ marginBottom: 2 }}>멘토 회의</h1>
            <p className="small muted" style={{ margin: 0 }}>멘토·투자자·전문가와 나눈 회의를 기록합니다. 특정 기업의 멘토링 건과 별개이며, 작성자·공유받은 사람·관리자가 볼 수 있습니다. 관리자는 모든 회의를 관리합니다.</p>
          </div>
          <button className="primary" onClick={() => setEdit(blank())}><Icon name="users" size={16} /> 새 회의 기록</button>
        </div>
        <ErrorBox error={error} />
        {edit && <MeetingForm key={edit.id ?? "new"} m={edit} engs={engs} onDone={async () => { setEdit(null); await load(); }} onCancel={() => setEdit(null)} />}
        <div className="row" style={{ margin: '16px 0', gap: 10 }}>
          <input placeholder="검색: 제목, 참석자, 태그" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
            <option value="">모든 회의</option>
            <option value="none">연결 안 된 회의</option>
            {engs.map((e) => <option key={e.id} value={e.id}>{engLabel(e)}</option>)}
          </select>
        </div>
        {list && !shown.length && <div className="card muted">아직 회의 기록이 없습니다.</div>}
        {shown.map((m) => (
          <div key={m.id} className="card">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="xsmall muted">{m.date} · {m.participants}</div>
                <h2 style={{ margin: '2px 0 6px' }}>{m.title}</h2>
                <div className="row" style={{ gap: 4 }}>
                  {(m.linked_eng_ids ?? []).map((id) => { const e = engs.find((x) => x.id === id); return e ? <Link key={id} href={`/eng/${id}#sessions`} className="badge accent"><Icon name="layers" size={12} /> {e.company}</Link> : null; })}
                  {(m.tags ?? []).map((t) => <span key={t} className="badge">{t}</span>)}
                </div>
              </div>
              <div className="row">
                {m.meeting_notes && <button onClick={() => downloadMarkdown(m.meeting_notes!, `${m.title}-${m.date}`)}>.md 다운로드</button>}
                {(isAdmin || m.owner_email?.toLowerCase() === me.email.toLowerCase()) && <button onClick={() => setEdit(m)}>수정</button>}
                {isAdmin && <button disabled={deleting !== null} onClick={async () => {
                  if (!window.confirm(`“${m.title}” 회의를 삭제하시겠습니까? 목록과 연결된 멘토링에서 더 이상 표시되지 않습니다.`)) return;
                  setDeleting(m.id); setError(null);
                  try { await call('deleteMeeting', m.id); if (edit?.id === m.id) setEdit(null); if (open === m.id) setOpen(null); await load(); }
                  catch (e) { setError((e as Error).message); } finally { setDeleting(null); }
                }}>{deleting === m.id ? '삭제 중…' : '삭제'}</button>}
                <button onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? '접기' : '열기'}</button>
              </div>
            </div>
            {m.summary && <MarkdownView text={m.summary} />}
            {open === m.id && (
              <div style={{ marginTop: 10 }}>
                {m.meeting_notes && <MarkdownView text={m.meeting_notes} />}
                <div className="panel human" style={{ marginBottom: 10 }}>
                  <div className="panel-label" style={{ color: 'var(--green)' }}><Icon name="pen" size={14} /> 내가 얻은 것 · 적용할 것</div>
                  <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{m.my_takeaways || '(아직 작성하지 않았습니다)'}</div>
                </div>
                {!!m.next_steps?.length && <NextSteps m={m} engs={engs.filter((e) => e.can_record && (m.linked_eng_ids ?? []).includes(e.id))} />}
                {!!m.details?.length && <details><summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>상세 내용 {m.details.length}개</summary><ul className="small">{m.details.map((x, i) => <li key={i} style={{ margin: '4px 0' }}>{x}</li>)}</ul></details>}
                <div className="xsmall muted" style={{ marginTop: 8 }}>작성 {m.owner_email}{m.notes_source ? ` · 출처 ${m.notes_source}` : ''}{m.share_emails?.length ? ` · 공유 ${m.share_emails.join(', ')}` : ''}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function MeetingForm({ m, engs, onDone, onCancel }: { m: Partial<MentorMeeting>; engs: LinkEng[]; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState<Partial<MentorMeeting>>(m);
  const [raw, setRaw] = useState('');
  const { busy, error, ok, run } = useAsync();
  const set = (k: keyof MentorMeeting) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const lines = (s: string) => s.split('\n').map((x) => x.replace(/^[-•]\s*/, '').trim()).filter(Boolean);
  return (
    <div className="card">
      <h2>{f.id ? '회의 기록 수정' : '새 회의 기록'}</h2>
      {!f.id && (
        <details style={{ marginBottom: 10 }}>
          <summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>Gemini·Meet 회의록 붙여 넣어 채우기</summary>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} style={{ minHeight: 120, marginTop: 8, fontSize: 13 }} />
          <button style={{ marginTop: 6 }} disabled={!raw.trim()} onClick={() => {
            const p = parseMeetingNotes(raw);
            setF({ ...f, title: f.title || p.title, date: p.date || f.date, summary: p.summary, next_steps: p.nextSteps, details: p.details, notes_source: p.title || 'Gemini 회의록', meeting_notes: raw });
          }}>나눠 채우기</button>
        </details>
      )}
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div><label>회의 제목</label><input value={f.title ?? ''} onChange={set('title')} /></div>
        <div><label>일시</label><input type="date" value={f.date ?? ''} onChange={set('date')} /></div>
        <div><label>참석자 (이름·소속)</label><input value={f.participants ?? ''} onChange={set('participants')} placeholder="예: 이광일 멘토, 엔젤투자자 1명" /></div>
        <div><label>태그 (쉼표로 구분)</label><input value={(f.tags ?? []).join(', ')} onChange={(e) => setF({ ...f, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></div>
      </div>
      <MarkdownNotes value={f.meeting_notes ?? ''} onChange={(text) => setF({ ...f, meeting_notes: text })} filename={`${f.title || '멘토회의'}-${f.date || ''}`} />
      <p className="small muted">파일 내용은 회의록에 그대로 저장됩니다. 아래 요약과 다음 단계는 별도로 정리할 수 있습니다.</p>
      <label>요약</label><textarea value={f.summary ?? ''} onChange={set('summary')} />
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div><label>다음 단계 (줄마다 하나)</label><textarea value={(f.next_steps ?? []).join('\n')} onChange={(e) => setF({ ...f, next_steps: lines(e.target.value) })} /></div>
        <div><label>상세 내용 (줄마다 하나)</label><textarea value={(f.details ?? []).join('\n')} onChange={(e) => setF({ ...f, details: lines(e.target.value) })} /></div>
      </div>
      <label>연결할 멘토링 건 (기업)</label>
      {engs.length ? (
        <div className="row" style={{ gap: 6 }}>
          {engs.map((e) => {
            const on = (f.linked_eng_ids ?? []).includes(e.id);
            return (
              <button key={e.id} type="button" onClick={() => setF({ ...f, linked_eng_ids: on ? (f.linked_eng_ids ?? []).filter((x) => x !== e.id) : [...(f.linked_eng_ids ?? []), e.id] })}
                style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--text)', borderColor: on ? 'var(--accent)' : 'var(--border-strong)' }}>
                {on ? '✓ ' : ''}{engLabel(e)}
              </button>
            );
          })}
        </div>
      ) : <p className="small muted">연결할 수 있는 멘토링 건이 없습니다.</p>}
      <p className="xsmall muted">연결하면 그 멘토링 건의 회차 탭과 사고 흐름에 이 회의가 함께 보입니다. 같은 기업의 다른 건에서도 보입니다. 공개 범위는 그대로입니다(작성자·공유한 사람·관리자).</p>
      <label className="human">내가 얻은 것 · 내 멘토링에 적용할 것</label>
      <textarea value={f.my_takeaways ?? ''} onChange={set('my_takeaways')} />
      <label>공유할 사람 이메일 (쉼표로 구분, 앱 계정이 있는 사람)</label>
      <input value={(f.share_emails ?? []).join(', ')} onChange={(e) => setF({ ...f, share_emails: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
      <Status error={error} ok={ok} />
      <div className="row" style={{ marginTop: 12 }}>
        <button className="primary" disabled={busy} onClick={() => run(async () => { await call('saveMeeting', f); onDone(); })}>저장</button>
        <button onClick={onCancel}>취소</button>
      </div>
    </div>
  );
}

function NextSteps({ m, engs }: { m: MentorMeeting; engs: LinkEng[] }) {
  const [target, setTarget] = useState(engs[0]?.id ?? '');
  const [sent, setSent] = useState<string[]>([]);
  const { busy, error, run } = useAsync();
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="row between">
        <div className="small" style={{ fontWeight: 700 }}>다음 단계</div>
        {engs.length > 0 && (
          <div className="row small" style={{ gap: 6 }}>
            실험 카드로 보낼 건
            <select value={target} onChange={(e) => setTarget(e.target.value)} style={{ width: 'auto', padding: '4px 8px' }}>
              {engs.map((e) => <option key={e.id} value={e.id}>{e.company}</option>)}
            </select>
          </div>
        )}
      </div>
      <ul className="small" style={{ paddingLeft: 18 }}>
        {(m.next_steps ?? []).map((x) => (
          <li key={x} style={{ margin: '4px 0' }}>
            {x}{' '}
            {engs.length > 0 && (sent.includes(x)
              ? <span className="badge accent">실험 카드로 보냄</span>
              : <button style={{ padding: '2px 8px', fontSize: 12 }} disabled={busy} onClick={() => run(async () => {
                  await call('saveExperiment', target, { hypothesis: x, method: `멘토 회의 "${m.title}" (${m.date})에서 나온 과제`, success_metric: '', origin: 'ai_raw' });
                  setSent([...sent, x]);
                })}>→ 실험 카드로</button>)}
          </li>
        ))}
      </ul>
      {engs.length === 0 && (m.linked_eng_ids ?? []).length === 0 && <p className="xsmall muted">멘토링 건에 연결하면 다음 단계를 그 건의 실험 카드로 보낼 수 있습니다.</p>}
      {error && <div className="alert error small">{error}</div>}
    </div>
  );
}
