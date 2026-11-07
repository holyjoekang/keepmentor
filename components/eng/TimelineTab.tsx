'use client';

import { Icon } from '@/components/icons';
import { useRelatedMeetings } from './RelatedMeetings';
import type { TabProps } from './types';

// 사고 흐름: 사람이 쓴 내용만 시간 순으로 모아 본다 (설계서 8.4절)
export function TimelineTab({ b }: TabProps) {
  const e = b.engagement;
  const meetings = useRelatedMeetings(e.id) ?? [];
  const items: { date: string; who: string; title: string; text: string }[] = [];
  const c = b.company;
  if (c.issue_symptom) items.push({ date: String(e.start_date ?? ''), who: '멘티', title: '요청 이슈', text: `현상: ${c.issue_symptom}\n시도: ${c.issue_tried ?? ''}\n원하는 결과: ${c.issue_wanted ?? ''}` });
  if (e.mentor_own_bottleneck) items.push({ date: String(e.start_date ?? ''), who: '멘토', title: '내가 본 병목', text: `${e.mentor_own_bottleneck}${e.briefing_choice_reason ? `\nAI 브리핑과 비교 후 선택: ${e.briefing_choice_reason}` : ''}` });
  for (const s of b.sessions) {
    if (s.mentor_own_summary) items.push({ date: s.date, who: '멘토', title: `${s.round_no}차 핵심 3줄`, text: `${s.mentor_own_summary}${s.mentor_next_check ? `\n다음에 확인할 것: ${s.mentor_next_check}` : ''}` });
    if (s.mentee_own_summary) items.push({ date: s.date, who: '멘티', title: `${s.round_no}차 내가 이해한 것`, text: `${s.mentee_own_summary}\n할 일: ${s.mentee_own_tasks ?? ''}` });
  }
  for (const x of b.experiments.filter((x) => x.status === 'done')) {
    items.push({ date: String(x.updated_at ?? '').slice(0, 10), who: '멘티·멘토', title: `실험 결과 — ${x.decision || '결정 전'}`, text: `${x.hypothesis}\n결과: ${x.result_value}\n배운 것: ${x.learning}` });
  }
  if (e.stage_transition_reason) items.push({ date: String(e.updated_at ?? '').slice(0, 10), who: '멘토', title: `단계 ${e.stage} 전환 근거`, text: e.stage_transition_reason });
  for (const p of b.panels) if (p.mentor_decision) items.push({ date: String(p.created_at).slice(0, 10), who: '멘토', title: '전문가 패널에 대한 결정', text: p.mentor_decision });
  if (e.mentor_biggest_change) items.push({ date: String(e.updated_at ?? '').slice(0, 10), who: '멘토', title: '가장 크게 바뀐 점', text: e.mentor_biggest_change });
  if (e.mentee_biggest_change) items.push({ date: String(e.updated_at ?? '').slice(0, 10), who: '멘티', title: '가장 크게 바뀐 점', text: e.mentee_biggest_change });
  for (const m of meetings) if (m.my_takeaways) items.push({ date: String(m.date), who: '멘토 회의', title: `멘토 회의 — ${m.title}`, text: m.my_takeaways });
  items.sort((a, b2) => a.date.localeCompare(b2.date));

  return (
    <div className="card">
      <div className="card-title"><span className="ichip "><Icon name="pen" /></span><h2>사고 흐름</h2></div>
      <p className="small muted">사람이 직접 쓴 내용만 모았습니다. 다른 멘토나 기관이 이어받을 때 이 흐름을 먼저 봅니다.</p>
      {!items.length && <div className="muted">아직 기록이 없습니다.</div>}
      <div className="timeline">
        {items.map((it, i) => (
          <div className={`item ${it.who === '멘티' ? 'mentee' : ''}`} key={i}>
            <div className="small muted">{it.date} · {it.who}</div>
            <strong>{it.title}</strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{it.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
