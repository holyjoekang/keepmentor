// 공개 방법론 페이지 콘텐츠

export interface FlowStep {
  id: string; no: string; icon: string; title: string; when: string; short: string;
  purpose: string;
  mentee: string[]; mentor: string[]; ai: string[];
  outputs: string[];
  basis: string[]; // FOUNDATIONS id
}

export const FLOW: FlowStep[] = [
  {
    id: 'pre', no: '01', icon: 'search', title: '신청·사전진단', when: '1차 7일 전', short: '대표가 현황과 이슈를 증거와 함께 먼저 적습니다.',
    purpose: '1차 미팅을 상황 파악이 아니라 토론으로 시작하기 위해, 대표가 자기 상황을 같은 기준으로 먼저 정리합니다.',
    mentee: ['기업 프로필 (팀 구성, 주당 가용시간, 런웨이)', '코어 12문항 자가진단 + 근거 (약 10분)', '이슈 서술 3칸: 현상 / 시도해본 것 / 원하는 결과'],
    mentor: ['사전 자료 검토, 1차 질문 준비', 'AI 브리핑을 보기 전에 "내가 보는 병목 1줄"을 먼저 기록'],
    ai: ['사전 브리핑 초안 (추정 단계, 병목 후보, 1차 질문 5개)'],
    outputs: ['자가진단 레이더', '사전 브리핑'],
    basis: ['custdev', 'psst', 'grow'],
  },
  {
    id: 'diag', no: '02', icon: 'target', title: '진단·목표 합의', when: '1차 (D0)', short: '증거로 현재 위치를 판정하고 목표를 1~2개로 좁힙니다.',
    purpose: '대표가 느끼는 문제(요청 이슈)와 진단상 실제 병목을 분리해 보고, 3회차 안에 달성할 목표를 숫자로 합의합니다.',
    mentee: ['사업 소개 10분', '목표와 성공 기준에 합의'],
    mentor: ['문항별 보정 점수와 증거 확인', '단계 관문·레드플래그 판정', '목표 1~2개와 성공 기준(숫자) 정의'],
    ai: ['증거등급 판정 검토 (선택)'],
    outputs: ['진단 리포트 (레이더, 단계, 병목, 레드플래그)', '멘토링 목표'],
    basis: ['yc', 'grow', 'bmc', 'trl'],
  },
  {
    id: 'exp', no: '03', icon: 'flask', title: '실험 설계', when: '1차 마무리', short: '조언 대신 2주 안에 돌릴 실험 카드로 끝냅니다.',
    purpose: '회의는 "좋은 조언"이 아니라 대표가 다음 2주 동안 실행할 검증 실험으로 끝나야 측정할 수 있는 성과가 생깁니다.',
    mentee: ['주당 가용시간 안에서 실행 가능한지 확인'],
    mentor: ['회차 직후 핵심 3줄과 "다음에 확인할 것"을 AI 없이 먼저 작성', '실험 카드 1~3개 확정'],
    ai: ['회의록을 바탕으로 일지·실험 카드 초안 (멘토가 채택할 것만 반영)'],
    outputs: ['회차 일지', '실험 카드: 가설 · 방법 · 성공 기준 · 기한'],
    basis: ['lean', 'jtbd', 'pmf'],
  },
  {
    id: 'run', no: '04', icon: 'loop', title: '실행·점검', when: '2차 (D+14)', short: '실험 결과를 리뷰하고 Pivot · Persevere · Kill을 결정합니다.',
    purpose: '매 회차는 지난 과제 점검으로 시작합니다. 결과 수치와 배운 것을 대표가 직접 적고, 다음 결정을 내립니다.',
    mentee: ['실험 결과 수치와 "배운 것"을 직접 입력', '회차 기록을 읽고 "내가 이해한 핵심 3줄"과 "이번 2주에 할 일"을 작성'],
    mentor: ['결과 리뷰와 결정 기록', '병목 영역 심화, 필요하면 외부 자원 연결'],
    ai: ['회차 일지 초안'],
    outputs: ['실험 결과와 결정', '다음 실험 카드'],
    basis: ['lean', 'yc'],
  },
  {
    id: 'wrap', no: '05', icon: 'map', title: '정리·로드맵', when: '3차 (D+28)', short: '재측정으로 변화를 확인하고 90일 로드맵을 만듭니다.',
    purpose: '처음 진단과 같은 문항으로 다시 재서 증거등급이 실제로 올랐는지 확인하고, 다음 단계의 자금 트랙과 실행 계획을 정합니다.',
    mentee: ['자가진단 재입력', '"가장 크게 바뀐 점 1가지" 작성'],
    mentor: ['목표 달성도 평가, 단계 전환 시 근거 작성', '"가장 크게 바뀐 점 1가지" 작성'],
    ai: ['종합 리포트 · 90일 로드맵 · 1페이지 투자메모 초안', '전문가 패널 의견 (선택)'],
    outputs: ['종합 리포트', '90일 로드맵', '1페이지 투자메모', '자금 트랙 제안'],
    basis: ['psst', 'tips', 'scaling'],
  },
  {
    id: 'follow', no: '06', icon: 'chart', title: '사후 추적', when: '3개월 · 6개월 후', short: '멘토링이 실제 성과로 이어졌는지 추적합니다.',
    purpose: '멘토링 횟수가 아니라 결과를 남깁니다. 기관 보고와 방법론 개정의 근거가 됩니다.',
    mentee: ['5문항 설문: 지원사업 선정, 투자, 고용, 매출, 북극성 지표'],
    mentor: ['비동기 코멘트'],
    ai: ['기관 보고 요약 (익명 집계)'],
    outputs: ['후속 성과 기록', '기관 보고서'],
    basis: ['kirk'],
  },
];

export interface Foundation { id: string; name: string; source: string; idea: string; use: string; group: 'global' | 'korea' | 'coach' }

export const FOUNDATIONS: Foundation[] = [
  { id: 'custdev', group: 'global', name: '고객 개발 (Customer Development)', source: 'Steve Blank, 『The Four Steps to the Epiphany』(2005)', idea: '문제와 고객에 대한 가설을 사무실 밖에서 고객을 만나 검증한다.', use: '사전진단의 이슈 서술, S0→S1 관문(비지인 인터뷰 10건)' },
  { id: 'lean', group: 'global', name: '린 스타트업 (Lean Startup)', source: 'Eric Ries, 『The Lean Startup』(2011)', idea: '만들기–측정–학습 순환과 검증된 학습. 결과에 따라 방향 전환(Pivot) 또는 유지(Persevere)를 결정한다.', use: '실험 카드와 Pivot · Persevere · Kill 결정' },
  { id: 'jtbd', group: 'global', name: 'Jobs To Be Done', source: 'Clayton Christensen 외, 『Competing Against Luck』(2016)', idea: '고객은 제품을 사는 것이 아니라 해결하고 싶은 일을 위해 제품을 "고용"한다.', use: '실험 가설 문장: "X 고객이 Y 문제로 Z에 돈을 낸다"' },
  { id: 'yc', group: 'global', name: 'Y Combinator 방식', source: 'Y Combinator 오피스아워·창업자 가이드', idea: '사용자와 대화하고, 주간 목표와 성장률로 진척을 잰다. 진짜 문제가 무엇인지부터 묻는다.', use: '2주 과제 리듬, 북극성 지표와 학습 속도(N1), 요청 이슈와 실제 병목의 분리' },
  { id: 'pmf', group: 'global', name: 'PMF 측정', source: 'Sean Ellis의 PMF 설문(“매우 실망” 40% 기준), 리텐션 분석', idea: '제품-시장 적합성은 느낌이 아니라 유지율과 사용자 반응 같은 지표로 판단한다.', use: '유지·재구매 문항(C3), S2→S3 관문' },
  { id: 'bmc', group: 'global', name: '비즈니스 모델 캔버스', source: 'Alexander Osterwalder · Yves Pigneur, 『Business Model Generation』(2010)', idea: '고객, 가치 제안, 채널, 수익 구조를 한 장에서 함께 본다.', use: '비즈니스 모델 축(지불자 B1, 가격 근거 B2)' },
  { id: 'scaling', group: 'global', name: 'Scaling Up', source: 'Verne Harnish, 『Scaling Up』(2014)', idea: '성장 기업은 사람·전략·실행·현금 네 영역의 결정이 함께 받쳐야 한다.', use: 'S3 이상 조직·GTM 모듈, 런웨이 레드플래그' },
  { id: 'trl', group: 'global', name: '기술성숙도 (TRL)', source: 'NASA에서 시작된 1~9단계 기술 성숙도 척도, 국내 R&D 평가에서도 사용', idea: '기술의 준비 수준을 단계로 나눠 객관적으로 표현한다.', use: '딥테크·바이오 업종의 대체 관문 (PoC, 비임상, DVT)' },
  { id: 'psst', group: 'korea', name: 'PSST 사업계획서 구조', source: '예비·초기창업패키지 등 정부 창업지원사업 사업계획서 양식', idea: '문제인식(Problem) · 실현가능성(Solution) · 성장전략(Scale-up) · 팀 구성(Team)으로 사업을 평가한다.', use: '진단 축과 평가 항목의 매핑, 사업계획서는 실험에서 나온 증거를 옮겨 적는 방식' },
  { id: 'tips', group: 'korea', name: 'TIPS', source: '중소벤처기업부 민간투자주도형 기술창업지원', idea: '민간 운영사가 먼저 투자하고 추천한 기업에 정부가 R&D 자금을 연계 지원한다.', use: '자금조달 준비도 모듈, 결격 사유 점검(레드플래그)' },
  { id: 'grow', group: 'coach', name: 'GROW 코칭 모델', source: 'John Whitmore, 『Coaching for Performance』(1992)', idea: '목표(Goal) → 현실(Reality) → 선택지(Options) → 실행 의지(Will) 순서로 대화를 구조화한다.', use: '회차 진행 순서와 목표·성공 기준 합의' },
  { id: 'kirk', group: 'coach', name: 'Kirkpatrick 4단계 평가', source: 'Donald Kirkpatrick, 교육 효과 평가 모델(1959~)', idea: '반응 → 학습 → 행동 → 결과의 네 수준으로 교육·코칭의 효과를 평가한다.', use: '성과지표 체계: 만족도(반응), 증거등급 상승(학습·행동), 후속 성과(결과)' },
];

export const PRINCIPLES = [
  { icon: 'search', title: '진단이 처방보다 먼저', text: '모든 기업을 같은 7축·12문항으로 진단한 뒤에 조언합니다. 멘토 개인의 경험에만 기대지 않습니다.' },
  { icon: 'stairs', title: '주장보다 증거', text: '같은 3점이라도 근거가 대표 의견인지, 고객의 결제인지에 따라 다르게 봅니다. 증거등급이 점수 상한을 정합니다.' },
  { icon: 'flask', title: '조언보다 실험', text: '매 회차는 2주 안에 돌릴 실험 카드로 끝나고, 다음 회차는 그 결과 점검으로 시작합니다.' },
  { icon: 'pen', title: '사람이 먼저 쓰고 AI는 보완', text: '핵심 요약, 단계 전환 근거, 멘티의 이해 확인은 사람이 직접 씁니다. AI 결과를 대신 읽어 주는 멘토링을 막습니다.' },
];

export const PANEL = [
  { code: 'A1', name: '글로벌 VC', view: '견인 지표, 학습 속도, 치명적 리스크' },
  { code: 'A2', name: '국내 VC·TIPS', view: '자금 트랙, 결격 요건, 평가표 적합성' },
  { code: 'A3', name: '스케일업 COO', view: '조직, GTM 반복성, 현금 운용' },
  { code: 'A4', name: '프로그램 운영자', view: '실행 가능성, 기록 품질, 기관 보고' },
  { code: 'A5', name: '연쇄창업가', view: '증거의 질, 실험 설계' },
];

export const KPI_LAYERS = [
  { level: '성과', metric: '목표 문항의 증거등급 상승, 북극성 지표 2주 변화', note: '멘토링이 효과가 있었는가', kirk: '학습·행동' },
  { level: '후속 성과', metric: '3·6개월 후 지원사업 선정, 투자, 고용, 매출', note: '기관 보고와 예산의 근거', kirk: '결과' },
  { level: '실행', metric: '과제·실험 이행률, 기록 완료율', note: '멘토링이 굴러가고 있는가', kirk: '행동' },
  { level: '품질', metric: '회차별 30초 평가, NPS', note: '멘토 품질 관리용 (성과로 보고하지 않음)', kirk: '반응' },
];
