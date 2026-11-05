import { finalScore } from './scoring';
import { newId, nowIso, type Assessment, type Company, type Engagement, type Experiment, type Program, type Session, type User } from './schema';
import type { Store } from './store';

export const DEMO_USERS: User[] = [
  { id: 'USR-demo-mentor', email: 'mentor@demo.keepmentor', name: '김멘토', affiliation: '서울창조경제혁신센터 멘토', access_code: 'demo', is_admin: false },
  { id: 'USR-demo-mentee', email: 'ceo@demo.keepmentor', name: '이대표', affiliation: '그린루프 대표', access_code: 'demo', is_admin: false },
  { id: 'USR-demo-admin', email: 'admin@demo.keepmentor', name: '박매니저', affiliation: '강서 창조센터 프로그램 매니저', access_code: 'demo', is_admin: true },
];

// 데모용 가상 데이터 (실제 기업이 아님)
export async function seedDemo(store: Store) {
  for (const u of DEMO_USERS) await store.insert('Users', { ...u, created_at: nowIso() });
  const program: Program = { id: 'PRG-demo', org_name: '강서 창조센터', name: '2026 하반기 멘토링', year: 2026, session_count: 3, interval_weeks: 2, created_at: nowIso() };
  await store.insert('Programs', program);
  const company: Company = {
    id: 'COM-demo', name: '그린루프', industry: 'saas', founded_date: '2025-03-02', team_type: '공동창업', headcount: 3,
    ceo_weekly_hours: 50, runway_months: 5, summary: '중소 식품 제조사의 원재료 재고·폐기 관리를 돕는 SaaS',
    issue_symptom: '파일럿 4곳을 했는데 유료 전환이 1곳뿐이다.',
    issue_tried: '무료 기간을 1개월에서 2개월로 늘리고, 기능을 두 가지 더 만들었다.',
    issue_wanted: '연말까지 유료 고객 5곳, 내년 초 예비·초기 패키지 지원.',
    consent_ai: true, updated_at: nowIso(),
  };
  await store.insert('Companies', company);
  const eng: Engagement = {
    id: 'ENG-demo', program_id: program.id, company_id: company.id, mentor_email: DEMO_USERS[0].email, mentee_emails: [DEMO_USERS[1].email],
    status: '진행', stage: 'S1', stage_transition_reason: '비지인 인터뷰 14건과 문제 정의서 확인 (사전진단 근거)',
    gates: { S1: { met: true, note: '인터뷰 14건 기록 확인' } }, red_flags: [], issue_codes: ['I03', 'I05'],
    goals: [{ text: '유료 전환 구조 만들기', success: 'LOI 또는 유료 계약 3건', q_codes: ['C2', 'B2'] }],
    bottlenecks: [], start_date: '2026-10-20', created_at: nowIso(), updated_at: nowIso(),
  };
  await store.insert('Engagements', eng);
  const selfScores: [string, number, string, string][] = [
    ['T1', 4, 'internal', '경쟁사 대비 기능 비교표'], ['M1', 3, 'internal', 'CTO 공동창업, 영업은 대표'], ['M0', 4, 'internal', '대표 전업'],
    ['B1', 4, 'interview', '구매 담당 인터뷰 9건'], ['B2', 3, 'none', '월 29만 원 (경쟁사 참고)'], ['P1', 4, 'behavior', '파일럿 4곳 운영 중'],
    ['P2', 3, 'behavior', '폐기량 12% 감소 (1곳)'], ['C1', 3, 'interview', '연매출 50억 이하 식품 제조사'], ['C2', 3, 'money', '유료 1곳 월 29만 원'],
    ['C3', 2, 'none', '측정 전'], ['F1', 3, 'internal', '현금 4천만 원, 월 800만 원 지출'], ['N1', 2, 'none', '지표 미정'],
  ];
  for (const [q, s, t, note] of selfScores) {
    const { grade, final } = finalScore(s, t);
    const row: Assessment = { id: newId('ASM'), eng_id: eng.id, round: 0, rater: 'self', q_code: q, score_input: s, evidence_type: t, evidence_note: note, evidence_grade: grade, score_final: final, origin: 'human', updated_at: nowIso() };
    await store.insert('Assessments', row);
  }
  const s1: Session = {
    id: 'SES-demo-1', eng_id: eng.id, round_no: 1, date: '2026-10-22', issue_codes: ['I03'],
    mentor_own_summary: '1. 문제는 확인됐지만 유료 전환 실패 원인은 가격이 아니라 구매 결정자 미파악.\n2. 무료 기간 연장은 중단.\n3. 파일럿 4곳의 결정자 인터뷰가 우선.',
    mentor_next_check: '결정자 인터뷰 결과와 LOI 제안 반응',
    advice_3lines: '', decisions: '무료 기간 연장 중단, 결정자 인터뷰 진행', mentor_confidence: 4, next_date: '2026-11-05', private_note: '대표가 기능 개발로 도피하는 경향',
    content_origin: 'human', mentee_ack: true,
    mentee_own_summary: '무료 기간보다 누가 돈을 내는지 먼저 알아야 한다. 파일럿 고객사의 결정자를 만난다.',
    mentee_own_tasks: '파일럿 4곳 결정자 인터뷰, LOI 초안 작성', mentee_rating: 5, created_at: nowIso(), updated_at: nowIso(),
  };
  await store.insert('Sessions', s1);
  const x1: Experiment = {
    id: 'EXP-demo-1', eng_id: eng.id, session_id: s1.id,
    hypothesis: '우리는 식품 제조사 생산관리 팀장이 폐기 비용 절감 보고를 위해 월 29만 원을 낸다고 믿는다',
    method: '파일럿 4곳 결정자 인터뷰 + LOI 제안', success_metric: 'LOI 서명 수', target_value: '3건', due_date: '2026-11-05',
    status: 'open', origin: 'human', created_at: nowIso(), updated_at: nowIso(),
  };
  await store.insert('Experiments', x1);
}
