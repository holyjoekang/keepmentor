'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { call } from '@/lib/client';
import type { MentorMeeting } from '@/lib/schema';

export type LinkedMeeting = MentorMeeting & { direct: boolean };

export function useRelatedMeetings(engId: string) {
  const [list, setList] = useState<LinkedMeeting[] | null>(null);
  useEffect(() => { call('meetingsForEng', engId).then((x) => setList(x as LinkedMeeting[])).catch(() => setList([])); }, [engId]);
  return list;
}

// 멘토링 건에 연결된 멘토 회의 (작성자·공유받은 사람·관리자에게 보인다)
export function RelatedMeetings({ engId }: { engId: string }) {
  const list = useRelatedMeetings(engId);
  const [open, setOpen] = useState<string | null>(null);
  if (!list || !list.length) return null;
  return (
    <div className="card">
      <div className="row between">
        <div className="card-title" style={{ margin: 0 }}><span className="ichip blue"><Icon name="users" /></span><h2>관련 멘토 회의 · {list.length}</h2></div>
        <Link href={`/meetings?eng=${engId}`} className="small">멘토 회의에서 보기 →</Link>
      </div>
      <p className="xsmall muted" style={{ margin: '6px 0 0' }}>이 기업과 연결된 멘토끼리의 회의입니다. 작성자·공유받은 사람·관리자가 볼 수 있습니다.</p>
      {list.map((m) => (
        <div key={m.id} style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 10 }}>
          <div className="row between">
            <div>
              <span className="xsmall muted">{m.date} · {m.participants}</span>
              {!m.direct && <span className="badge" style={{ marginLeft: 6 }}>같은 기업의 다른 건</span>}
              <div style={{ fontWeight: 700 }}>{m.title}</div>
            </div>
            <button onClick={() => setOpen(open === m.id ? null : m.id)}>{open === m.id ? '접기' : '열기'}</button>
          </div>
          {m.my_takeaways && <div className="panel human small" style={{ marginTop: 6 }}><b>내가 얻은 것:</b> {m.my_takeaways}</div>}
          {open === m.id && (
            <div className="small" style={{ marginTop: 8 }}>
              {m.summary && <p style={{ whiteSpace: 'pre-wrap' }}>{m.summary}</p>}
              {!!m.next_steps?.length && <><b>다음 단계</b><ul style={{ paddingLeft: 18 }}>{m.next_steps.map((x) => <li key={x}>{x}</li>)}</ul></>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
