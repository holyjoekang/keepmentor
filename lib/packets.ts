// AI 연계: 데이터 패킷 내보내기 / 결과 가져오기 (설계서 8.3~8.4절)
// 앱은 Claude API를 호출하지 않는다. 멘토가 패킷을 Claude 프로젝트에 붙여 넣고,
// 돌아온 JSON을 다시 앱에 붙여 넣는다.

import { CORE_QUESTIONS, ISSUE_CODES, STAGES, gatesFor } from './methodology';
import { axisScores, effectiveScores } from './scoring';
import type { Bundle } from './schema';

export const TASKS = {
  J1: { name: '사전 브리핑', schema: 'J1.v1' },
  J2: { name: '회차 일지 정리', schema: 'J2.v1' },
  J3: { name: '증거등급 검토', schema: 'J3.v1' },
  J4: { name: '종합 리포트', schema: 'J4.v1' },
  J5: { name: '전문가 패널', schema: 'J5.v1' },
} as const;
export type TaskType = keyof typeof TASKS;

// ---- 사람 점검 지점: 패킷을 만들기 전에 사람이 먼저 써야 하는 것 ----
export function missingHumanInputs(type: TaskType, b: Bundle, refId?: string): string[] {
  const m: string[] = [];
  const c = b.company;
  const e = b.engagement;
  if (type === 'J1') {
    if (!c.issue_symptom?.trim()) m.push('멘티: 이슈 서술 - 현상');
    if (!c.issue_tried?.trim()) m.push('멘티: 이슈 서술 - 시도해본 것');
    if (!c.issue_wanted?.trim()) m.push('멘티: 이슈 서술 - 원하는 결과');
    if (!b.assessments.some((a) => a.rater === 'self')) m.push('멘티: 사전 자가진단');
  }
  if (type === 'J2') {
    const s = b.sessions.find((x) => x.id === refId);
    if (!s) m.push('대상 회차를 선택하세요');
    else {
      if (!s.mentor_own_summary?.trim()) m.push('멘토: 핵심 3줄 (직접 작성)');
      if (!s.mentor_next_check?.trim()) m.push('멘토: 다음 회차에서 확인할 것 1줄');
    }
  }
  if (type === 'J3') {
    if (!b.assessments.length) m.push('진단 응답이 없습니다');
  }
  if (type === 'J4' || type === 'J5') {
    if (!e.mentor_biggest_change?.trim()) m.push('멘토: 가장 크게 바뀐 점 1가지');
    if (!e.mentee_biggest_change?.trim()) m.push('멘티: 가장 크게 바뀐 점 1가지');
    if (!b.sessions.length) m.push('회차 기록이 없습니다');
  }
  if (c.consent_ai === false || String(c.consent_ai) === 'false') m.push('기업의 AI 처리 동의가 없습니다');
  return m;
}

// ---- 익명화된 데이터 ----
function anonymized(b: Bundle) {
  const eff = effectiveScores(b.assessments);
  return {
    company: {
      name: 'A사',
      industry: b.company.industry,
      founded_date: b.company.founded_date,
      team_type: b.company.team_type,
      headcount: b.company.headcount,
      ceo_weekly_hours: b.company.ceo_weekly_hours,
      runway_months: b.company.runway_months,
      summary: b.company.summary,
      issue: { symptom: b.company.issue_symptom, tried: b.company.issue_tried, wanted: b.company.issue_wanted },
    },
    stage: b.engagement.stage,
    gates: gatesFor(b.company.industry).map((g) => ({ to: g.to, evidence: g.evidence, met: !!b.engagement.gates?.[g.to]?.met })),
    red_flags: b.engagement.red_flags ?? [],
    goals: b.engagement.goals ?? [],
    scores: CORE_QUESTIONS.map((q) => ({
      q_code: q.code,
      question: q.text,
      self: eff[q.code].self ? { score: eff[q.code].self!.score_final, grade: eff[q.code].self!.evidence_grade, evidence: eff[q.code].self!.evidence_note } : null,
      mentor: eff[q.code].mentor ? { score: eff[q.code].mentor!.score_final, grade: eff[q.code].mentor!.evidence_grade, evidence: eff[q.code].mentor!.evidence_note } : null,
    })),
    axis_scores: axisScores(b.assessments),
  };
}

const SHAPES: Record<TaskType, string> = {
  J1: `{
  "job_id": "<그대로>",
  "summary": "기업 상황 요약 3~5문장",
  "stage_estimate": "S0|S1|S2|S3|S4",
  "stage_reason": "판단 근거",
  "bottlenecks": [{ "axis": "A2~A7", "reason": "..." }],
  "issue_codes": ["I01"],
  "questions": ["1차 미팅 질문 5개"]
}`,
  J2: `{
  "job_id": "<그대로>",
  "advice_3lines": ["조언 1", "조언 2", "조언 3"],
  "decisions": "대표가 결정한 것",
  "issue_codes": ["I01"],
  "experiments": [{ "hypothesis": "우리는 X 고객이 Y 문제로 Z에 돈을 낸다고 믿는다", "method": "...", "success_metric": "...", "target_value": "...", "due_days": 14 }]
}`,
  J3: `{
  "job_id": "<그대로>",
  "grades": [{ "q_code": "C2", "suggested_type": "none|internal|interview|behavior|money", "reason": "..." }]
}`,
  J4: `{
  "job_id": "<그대로>",
  "summary": "멘토링 전체 요약",
  "goal_achievement": [{ "goal": "...", "achieved": "yes|partial|no", "evidence": "..." }],
  "roadmap_90d": [{ "period": "1~30일", "actions": ["..."] }],
  "invest_memo": { "problem": "...", "customer": "...", "traction": "...", "risks": ["...", "...", "..."] }
}`,
  J5: `{
  "job_id": "<그대로>",
  "round1": [{ "agent": "A1~A5", "stance": "...", "proposals": ["..."] }],
  "issues": ["쟁점"],
  "round2": [{ "agent": "A1~A5", "positions": [{ "issue": "...", "position": "수용|반론|타협", "rationale": "..." }] }],
  "synthesis": { "agreements": [{ "text": "...", "level": "5/5|4:1|3:2" }], "dissents": ["..."] }
}`,
};

const INSTRUCTIONS: Record<TaskType, string> = {
  J1: '아래 데이터로 1차 멘토링 전 사전 브리핑을 작성하라. 멘티 자가진단은 보통 부풀려져 있으므로 증거등급을 기준으로 판단하라.',
  J2: '첨부한 회의록(또는 메모)과 아래 데이터로 이번 회차 일지를 정리하라. 멘토가 직접 쓴 핵심 3줄(mentor_own_summary)을 우선하고, 이와 다른 해석은 하지 마라. 실험 카드는 대표의 주당 가용시간 안에서 2주 내 실행 가능한 것만 1~3개 제안하라.',
  J3: '각 문항의 근거(evidence)를 보고 증거 유형을 판정하라. 근거가 주장뿐이면 none이다.',
  J4: '전 회차 기록과 실험 결과로 종합 리포트, 90일 로드맵, 1페이지 투자메모 초안을 작성하라. 멘토·멘티가 직접 쓴 "가장 크게 바뀐 점"을 요약의 중심에 둬라.',
  J5: '프로젝트 지식의 전문가 패널 역할 카드(A1 글로벌 VC, A2 국내 VC·TIPS, A3 스케일업 경영자, A4 프로그램 운영자, A5 연쇄창업가)와 사회자 규칙에 따라, 1라운드 독립 의견 → 쟁점 추출 → 2라운드 교차 반론 → 종합 순서로 토론하라.',
};

export function buildPacket(type: TaskType, jobId: string, b: Bundle, refId?: string): string {
  const data: Record<string, unknown> = anonymized(b);
  if (type === 'J2' || type === 'J4' || type === 'J5') {
    data.sessions = b.sessions
      .filter((s) => type !== 'J2' || s.id === refId || Number(s.round_no) < Number(b.sessions.find((x) => x.id === refId)?.round_no ?? 99))
      .map((s) => ({
        round_no: s.round_no, date: s.date,
        mentor_own_summary: s.mentor_own_summary, mentor_next_check: s.mentor_next_check,
        advice_3lines: s.advice_3lines, decisions: s.decisions,
        mentee_own_summary: s.mentee_own_summary, mentee_own_tasks: s.mentee_own_tasks,
      }));
    data.experiments = b.experiments.map((x) => ({
      hypothesis: x.hypothesis, success_metric: x.success_metric, target_value: x.target_value,
      result_value: x.result_value, learning: x.learning, decision: x.decision, status: x.status,
    }));
  }
  if (type === 'J2') data.target_session = b.sessions.find((s) => s.id === refId)?.round_no;
  if (type === 'J4' || type === 'J5') {
    data.mentor_biggest_change = b.engagement.mentor_biggest_change;
    data.mentee_biggest_change = b.engagement.mentee_biggest_change;
  }
  const t = TASKS[type];
  return [
    '<!-- KEEPMENTOR-PACKET v1 -->',
    `job_id: ${jobId}`,
    `task: ${type} ${t.name}`,
    `schema: ${t.schema}`,
    '',
    '## 지시',
    INSTRUCTIONS[type],
    '데이터에 없는 사실은 만들지 말고, 근거 없는 수치에는 "추정"을 붙여라.',
    '',
    '## 데이터',
    '```json',
    JSON.stringify(data, null, 2),
    '```',
    '',
    '## 출력 형식',
    '아래 형식의 ```json 코드블록 하나로만 답하라. job_id는 그대로 돌려줘라.',
    '```json',
    SHAPES[type].replace('<그대로>', jobId),
    '```',
    '',
    `참고 코드 — 단계: ${STAGES.map((s) => `${s.code} ${s.name}`).join(', ')} / 이슈: ${ISSUE_CODES.map((i) => `${i.code} ${i.name}`).join(', ')}`,
  ].join('\n');
}

// ---- 결과 가져오기: JSON 추출과 검증 ----
const REQUIRED: Record<TaskType, string[]> = {
  J1: ['summary', 'stage_estimate', 'bottlenecks', 'questions'],
  J2: ['advice_3lines', 'experiments'],
  J3: ['grades'],
  J4: ['summary', 'roadmap_90d', 'invest_memo'],
  J5: ['round1', 'issues', 'round2', 'synthesis'],
};

export function extractJson(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence ? fence[1] : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
  return JSON.parse(candidate);
}

export function parseResult(type: TaskType, jobId: string, text: string): { ok: true; data: Record<string, unknown> } | { ok: false; errors: string[] } {
  let data: Record<string, unknown>;
  try {
    data = extractJson(text) as Record<string, unknown>;
  } catch {
    return { ok: false, errors: ['JSON 블록을 찾거나 읽을 수 없습니다. Claude 응답 전체를 붙여 넣었는지 확인하세요.'] };
  }
  const errors: string[] = [];
  if (data.job_id !== jobId) errors.push(`job_id가 다릅니다 (패킷: ${jobId}, 결과: ${String(data.job_id)})`);
  for (const k of REQUIRED[type]) if (data[k] === undefined) errors.push(`필수 항목 누락: ${k}`);
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

// 표시할 때 "A사"를 실제 기업명으로 바꿔 보여준다
export function deanonymize(text: unknown, companyName: string): string {
  return String(text ?? '').replaceAll('A사', companyName);
}
