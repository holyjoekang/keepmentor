'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { ErrorBox, Status, TopBar, useAsync, useMe } from '@/components/ui';
import { call } from '@/lib/client';
import { parseMeetingNotes } from '@/lib/notes';
import type { MentorMeeting } from '@/lib/schema';

const blank = (): Partial<MentorMeeting> => ({ date: new Date().toISOString().slice(0, 10), title: '', participants: '', share_emails: [], tags: [], summary: '', next_steps: [], details: [], my_takeaways: '', notes_source: '' });

export default function MeetingsPage() {
  const me = useMe();
  const [list, setList] = useState<MentorMeeting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<MentorMeeting> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState('');

  async function load() {
    try { setList(await call('meetings')); } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { if (me) load(); }, [me]);
  if (!me) return <TopBar />;

  const k = q.trim().toLowerCase();
  const shown = (list ?? []).filter((m) => !k || [m.title, m.participants, m.summary, (m.tags ?? []).join(' ')].join(' ').toLowerCase().includes(k));

  return (
    <>
      <TopBar me={me} />
      <div className="wrap">
        <div className="row between">
          <div>
            <div className="eyebrow">Mentor meetings</div>
            <h1 style={{ marginBottom: 2 }}>멘토 회의</h1>
            <p className="small muted" style={{ margin: 0 }}>멘토·투자자·전문가와 나눈 회의를 기록합니다. 특정 기업의 멘토링 건과 별개이며, 작성자와 공유한 사람만 봅니다.</p>
          </div>
          <button className="primary" onClick={() => setEdit(blank())}><Icon name="users" size={16} /> 새 회의 기록</button>
        </div>
        <ErrorBox error={error} />
        {edit && <MeetingForm m={edit} onDone={async () => { setEdit(null); await load(); }} onCancel={() => setEdit(null)} />}
        <input placeholder="검색: 제목, 참석자, 태그" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 360, margin: '16px 0' }} />
        {list && !shown.length && <div className="card muted">아직 회의 기록이 없습니다.</div>}
        {shown.map((m) => (
          <div key={m.id} className="card">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <div>
                <div className="xsmall muted">{m.date} · {m.participants}</div>
                <h2 style={{ margin: '2px 0 6px' }}>{m.title}</h2>
                <div className="row" style={{ gap: 4 }}>{(m.tags ?? []).map((t) => <span key={t} className="badge">{t}</span>)}</div>
              </div>
              <div className="row">
                {m.owner_email?.toLowerCase() === me.email.toLowerCase() && <button onClick={() => setEdit(m)}>수정</button>}
                <button onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? '접기' : '열기'}</button>
              </div>
            </div>
            {m.summary && <p className="small" style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{m.summary}</p>}
            {open === m.id && (
              <div style={{ marginTop: 10 }}>
                <div className="panel human" style={{ marginBottom: 10 }}>
                  <div className="panel-label" style={{ color: 'var(--green)' }}><Icon name="pen" size={14} /> 내가 얻은 것 · 적용할 것</div>
                  <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{m.my_takeaways || '(아직 작성하지 않았습니다)'}</div>
                </div>
                {!!m.next_steps?.length && <><div className="small" style={{ fontWeight: 700 }}>다음 단계</div><ul className="small">{m.next_steps.map((x) => <li key={x}>{x}</li>)}</ul></>}
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

function MeetingForm({ m, onDone, onCancel }: { m: Partial<MentorMeeting>; onDone: () => void; onCancel: () => void }) {
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
            setF({ ...f, title: f.title || p.title, date: p.date || f.date, summary: p.summary, next_steps: p.nextSteps, details: p.details, notes_source: p.title || 'Gemini 회의록' });
          }}>나눠 채우기</button>
        </details>
      )}
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div><label>회의 제목</label><input value={f.title ?? ''} onChange={set('title')} /></div>
        <div><label>일시</label><input type="date" value={f.date ?? ''} onChange={set('date')} /></div>
        <div><label>참석자 (이름·소속)</label><input value={f.participants ?? ''} onChange={set('participants')} placeholder="예: 이광일 멘토, 엔젤투자자 1명" /></div>
        <div><label>태그 (쉼표로 구분)</label><input value={(f.tags ?? []).join(', ')} onChange={(e) => setF({ ...f, tags: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></div>
      </div>
      <label>요약</label><textarea value={f.summary ?? ''} onChange={set('summary')} />
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div><label>다음 단계 (줄마다 하나)</label><textarea value={(f.next_steps ?? []).join('\n')} onChange={(e) => setF({ ...f, next_steps: lines(e.target.value) })} /></div>
        <div><label>상세 내용 (줄마다 하나)</label><textarea value={(f.details ?? []).join('\n')} onChange={(e) => setF({ ...f, details: lines(e.target.value) })} /></div>
      </div>
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
