// Keep Mentor 방법론 상수 (설계서 2~5장, 12장 v2 기준)

export type Stage = 'S0' | 'S1' | 'S2' | 'S3' | 'S4';

export const STAGES: { code: Stage; name: string; question: string }[] = [
  { code: 'S0', name: '아이디어', question: '풀 가치가 있는 문제인가' },
  { code: 'S1', name: '예비창업', question: '누가 돈을 낼 것인가' },
  { code: 'S2', name: '초기', question: 'PMF에 가까워지고 있는가' },
  { code: 'S3', name: '도약', question: '성장을 반복 가능한 채널로 만들 수 있는가' },
  { code: 'S4', name: '스케일업', question: '조직·재무·해외가 성장을 버티는가' },
];

export const AXES = [
  { code: 'A2', name: '업종·기술' },
  { code: 'A3', name: '팀' },
  { code: 'A4', name: '비즈니스 모델' },
  { code: 'A5', name: '제품·솔루션' },
  { code: 'A6', name: '고객·시장' },
  { code: 'A7', name: '자금·역량' },
] as const;
export type AxisCode = (typeof AXES)[number]['code'];

export interface Question {
  code: string;
  axis: AxisCode;
  text: string;
  anchors: [string, string, string, string, string]; // 1~5점 행동 기준
}

// 코어 12문항 (12.2절)
export const CORE_QUESTIONS: Question[] = [
  {
    code: 'T1', axis: 'A2', text: '핵심 기술·방식의 차별성',
    anchors: ['차별점을 설명하지 못함', '차별점 주장은 있으나 비교 근거 없음', '경쟁 대안과 비교표·시연으로 설명 가능', '고객이 차별점 때문에 선택한 사례 있음', '특허·외부 평가·대기업 채택으로 검증됨'],
  },
  {
    code: 'M1', axis: 'A3', text: '핵심 역할(개발·영업·운영) 충족',
    anchors: ['대표 혼자, 대체 수단 없음', '부족한 역할을 알고 있으나 계획 없음', '외주·노코드·AI 등 대체 수단으로 운영 중', '핵심 역할 담당자 확보(파트타임 포함)', '핵심 역할 모두 전업 인력 확보'],
  },
  {
    code: 'M0', axis: 'A3', text: '대표의 주당 가용시간',
    anchors: ['주 10시간 미만', '주 10~20시간 (겸업)', '주 20~40시간', '주 40시간 이상 전업', '전업 + 공동창업자도 전업'],
  },
  {
    code: 'B1', axis: 'A4', text: '고객·지불자 명확성',
    anchors: ['고객과 지불자를 구분하지 못함', '고객군은 정했으나 지불 주체 불명확', '지불자를 특정하고 인터뷰로 확인', '지불자가 실제 결제·계약함', '반복 결제하는 지불자 집단이 확인됨'],
  },
  {
    code: 'B2', axis: 'A4', text: '가격 근거',
    anchors: ['가격 미정', '경쟁사 가격을 참고한 추정', '고객 인터뷰·가격 테스트로 확인', '제시 가격으로 실제 판매됨', '가격 인상·업셀 경험 있음'],
  },
  {
    code: 'P1', axis: 'A5', text: '제품 개발 완성도',
    anchors: ['아이디어·기획서 단계', '프로토타입·목업', 'MVP로 실제 사용자 테스트 중', '상용 제품 출시, 안정 운영', '여러 고객이 핵심 업무에 사용'],
  },
  {
    code: 'P2', axis: 'A5', text: '문제-해결 적합성',
    anchors: ['문제 확인 전', '문제는 확인했으나 해결책 검증 전', '파일럿에서 문제 해결 효과 확인', '사용 지표가 반복적으로 개선됨', '고객이 성과를 외부에 공개·추천'],
  },
  {
    code: 'C1', axis: 'A6', text: '타깃 고객 정의',
    anchors: ['"모든 사람"이 고객', '세그먼트를 정했으나 근거 없음', '인터뷰로 1순위 세그먼트 확정', '1순위 세그먼트에서 반복 판매', '세그먼트별 획득 경로·전환율 파악'],
  },
  {
    code: 'C2', axis: 'A6', text: '고객 확보 수준',
    anchors: ['고객 없음', '관심 표명·대기자만 있음', '파일럿·무료 사용자 확보', '유료 고객 1~9곳 또는 LOI 3건 이상', '유료 고객 10곳 이상, 신규 유입 반복'],
  },
  {
    code: 'C3', axis: 'A6', text: '유지·재구매',
    anchors: ['측정 전', '재방문·재구매 사례가 일부 있음', '유지율을 측정하기 시작함', '유지율·재구매율이 안정적', 'NRR 100% 이상 또는 확대 구매 반복'],
  },
  {
    code: 'F1', axis: 'A7', text: '런웨이와 자금 관리',
    anchors: ['보유 현금·월 지출을 모름', '대략 알지만 계산하지 않음', '런웨이를 계산하고 6개월 미만', '런웨이 6~12개월, 월별 관리', '런웨이 12개월 이상, 조달 계획 확정'],
  },
  {
    code: 'N1', axis: 'A7', text: '북극성 지표와 2주 학습속도',
    anchors: ['핵심 지표 없음', '지표는 있으나 측정하지 않음', '지표를 측정, 2주에 실험 1건 미만', '2주마다 실험 1~2건, 지표 변화 기록', '실험이 주간 리듬으로 돌아가고 지표가 개선됨'],
  },
];

// 증거등급 (12.3절)
export const EVIDENCE_TYPES = [
  { code: 'none', label: '근거 없음 / 대표 의견', grade: 'E0' },
  { code: 'internal', label: '지인 인터뷰·설문·내부 문서', grade: 'E1' },
  { code: 'interview', label: '비지인 고객 인터뷰 10건+·데이터', grade: 'E2' },
  { code: 'behavior', label: '행동 증거: 사전예약·LOI·파일럿 로그·PoC', grade: 'E3' },
  { code: 'money', label: '돈·제3자 검증: 결제·계약·재구매·투자·인허가', grade: 'E4' },
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number]['code'];
export type EvidenceGrade = 'E0' | 'E1' | 'E2' | 'E3' | 'E4';

export const GRADE_CAP: Record<EvidenceGrade, number> = { E0: 2, E1: 2, E2: 3, E3: 4, E4: 5 };

export function gradeOf(type: string | undefined): EvidenceGrade {
  return (EVIDENCE_TYPES.find((t) => t.code === type)?.grade ?? 'E0') as EvidenceGrade;
}

// 업종 템플릿 6종과 단계 관문 (12.4절). 수치는 패널 추정치.
export const INDUSTRY_TEMPLATES = [
  { code: 'saas', name: 'SaaS' },
  { code: 'commerce', name: '플랫폼·커머스' },
  { code: 'deeptech', name: '딥테크·하드웨어' },
  { code: 'bio', name: '바이오·헬스' },
  { code: 'content', name: '콘텐츠' },
  { code: 'local', name: '로컬·소셜·B2G' },
] as const;
export type IndustryCode = (typeof INDUSTRY_TEMPLATES)[number]['code'];

const ALT = new Set<IndustryCode>(['deeptech', 'bio', 'local']);

export interface Gate { to: Stage; evidence: string }

export function gatesFor(industry: string | undefined): Gate[] {
  const alt = ALT.has(industry as IndustryCode);
  return [
    { to: 'S1', evidence: '비지인 인터뷰 10건, 문제 정의서 1장' },
    { to: 'S2', evidence: alt ? 'PoC·공동연구 MOU, 사전주문, 실증사업 선정 중 1건 이상' : '유료 고객 1곳 또는 LOI 3건' },
    {
      to: 'S3',
      evidence: alt
        ? '기술이전 LOI 2건, 비임상 진입, DVT 통과 + 선주문 중 1건 이상'
        : 'MRR 1천만~3천만 원에 3개월 연속 성장(월 10~15%), B2C는 4주 리텐션 20% 이상',
    },
    { to: 'S4', evidence: alt ? '임상 단계 진입, 양산 계약, 누적 투자 10억 원 이상' : 'ARR 10억 원 이상, NRR 100% 이상, 시리즈A 완료' },
  ];
}

// 레드플래그 (12.4절)
export const RED_FLAGS = [
  { code: 'runway', label: '런웨이 기준 미만' },
  { code: 'cofounder', label: '공동창업자 분쟁 또는 지분 미정리' },
  { code: 'disqualify', label: '지원사업·투자 결격 사유 (중복수혜·대표 지분·재무 증빙)' },
  { code: 'talent_legal', label: '(S3 이상) 핵심인재 이탈 또는 법적 분쟁' },
] as const;

export const RUNWAY_THRESHOLD_MONTHS = 6;

// 이슈 코드 (5장)
export const ISSUE_CODES = [
  { code: 'I01', name: '문제·고객 검증' },
  { code: 'I02', name: '제품·MVP' },
  { code: 'I03', name: 'BM·가격' },
  { code: 'I04', name: '마케팅·고객 획득' },
  { code: 'I05', name: '영업·B2B 세일즈' },
  { code: 'I06', name: '팀·채용' },
  { code: 'I07', name: '지원사업 선정' },
  { code: 'I08', name: '투자 유치·IR' },
  { code: 'I09', name: '기술·IP·인허가' },
  { code: 'I10', name: '재무·자금 관리' },
  { code: 'I11', name: '조직·스케일업' },
  { code: 'I12', name: '해외 진출' },
] as const;

export const CONTENT_ORIGINS = {
  human: '사람 작성',
  ai_edited: 'AI 초안을 수정',
  ai_raw: 'AI 초안 그대로',
} as const;
export type ContentOrigin = keyof typeof CONTENT_ORIGINS;
