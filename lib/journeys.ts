// 멘티 참고자료: 성장 단계 가이드와 선배 기업의 단계별 여정
// 공개 기사·인터뷰를 바탕으로 Keep Mentor 단계(S0~S4)에 맞춰 재구성한 교육용 자료다.
// 수치와 시점은 각 출처의 보도 시점 기준이며, 새 사례는 JOURNEYS 배열에 추가한다.

import type { Stage } from './methodology';

export interface StageGuide {
  code: Stage;
  doNow: string[];      // 이 단계에서 집중할 일
  traps: string[];      // 흔한 함정
  selfCheck: string;    // 멘토링 전에 스스로 답해 볼 질문
}

export const STAGE_GUIDE: StageGuide[] = [
  {
    code: 'S0',
    doNow: ['해법보다 문제를 먼저 쓴다', '낯선 잠재 고객에게 지난번에 겪은 일을 묻는다', '고객이 지금 쓰는 대안과 그 비용을 적는다'],
    traps: ['지인 인터뷰만으로 확신', '설문의 "쓰겠다"를 수요로 착각'],
    selfCheck: '이 문제를 겪은 낯선 사람 10명의 이름과 날짜를 댈 수 있는가?',
  },
  {
    code: 'S1',
    doNow: ['돈을 낼 사람(지불자)과 쓸 사람을 구분한다', 'MVP 범위를 "없으면 아쉬운 한 가지"로 줄인다', '가격을 실제로 제시해 본다'],
    traps: ['완성도에 집착해 출시를 미룸', '외주 개발로 자금 소진'],
    selfCheck: '유료 고객 1곳 또는 서면 LOI 3건을 만들 수 있는 대화가 지금 진행 중인가?',
  },
  {
    code: 'S2',
    doNow: ['가장 빨리 돈을 낸 고객 3곳에서 ICP를 역산한다', '무료 사용자가 아니라 재사용·재결제를 센다', '대표가 직접 팔며 판매 과정을 기록한다'],
    traps: ['여러 세그먼트를 동시에 공략', '할인으로 만든 매출을 PMF로 착각'],
    selfCheck: '고객이 다음 달에도 돈을 낼 이유를 숫자(리텐션·재구매)로 보여 줄 수 있는가?',
  },
  {
    code: 'S3',
    doNow: ['회수되는 획득 채널 1~2개를 찾는다', '영업·온보딩 과정을 문서로 만든다', '인접 세그먼트로 한 단계씩 넓힌다'],
    traps: ['채널을 늘려 효율을 못 봄', '대표만 팔 수 있는 구조'],
    selfCheck: '대표가 빠져도 같은 방식으로 다음 달 고객이 들어오는가?',
  },
  {
    code: 'S4',
    doNow: ['인원보다 단위 경제성(NRR·이익률)을 관리한다', '기능별 리더에게 권한을 넘긴다', '해외·신제품은 독립 지표로 검증한다'],
    traps: ['사람을 늘리면 성장도 늘 것이라는 가정', '투자 환경 변화에 대비 없는 적자 확대'],
    selfCheck: '투자가 멈춰도 12개월을 버틸 계획과 흑자 경로가 있는가?',
  },
];

export interface JourneySource { title: string; outlet: string; date: string; url: string }
export interface JourneyStep {
  stage: Stage;
  period: string;
  title: string;
  happened: string[];   // 무슨 일이 있었나 (사실)
  decision: string;     // 핵심 의사결정
  lesson: string;       // 멘티가 가져갈 교훈
  evidence?: string;    // Keep Mentor 관점의 증거
  sources: number[];    // sources 배열 인덱스
}
export interface Journey {
  id: string;
  company: string;
  product: string;
  industry: string;
  oneLiner: string;
  facts: { label: string; value: string }[];
  steps: JourneyStep[];
  menteeQuestions: string[];
  sources: JourneySource[];
  note: string;
}

export const JOURNEYS: Journey[] = [
  {
    id: 'tosslab',
    company: '토스랩',
    product: '잔디(JANDI)',
    industry: 'B2B SaaS · 협업툴',
    oneLiner: '무료 배포로 시장을 먼저 만들고, 유료화·세그먼트 확장을 거쳐 시장 위축기에 리텐션과 효율로 흑자를 만든 국내 B2B SaaS.',
    facts: [
      { label: '설립', value: '2014년 6월' },
      { label: '정식 출시', value: '2015년 5월' },
      { label: '첫 월간 흑자', value: '2024년 1월 (설립 9년)' },
      { label: '유료 고객사', value: '5,000곳+ (2024)' },
    ],
    steps: [
      {
        stage: 'S0', period: '2014', title: '내가 겪은 비효율에서 문제를 찾다',
        happened: [
          '김대현 대표는 교통카드 회사와 티몬 등 대기업·스타트업을 거치며 일하는 과정에서 가장 비효율적인 부분이 소통과 협업이라고 판단했다.',
          '2014년 6월 토스랩을 설립했다.',
        ],
        decision: '개인 메신저로 업무를 하는 관행(자료 보관·보안 문제)을 풀 문제로 정했다.',
        lesson: '창업자의 직무 경험은 좋은 출발점이지만, 같은 고통을 겪는 낯선 고객이 많다는 확인은 따로 필요하다.',
        evidence: 'E0 → 대표의 경험(의견). 다음 단계에서 시장 반응으로 확인해야 한다.',
        sources: [0, 1, 3],
      },
      {
        stage: 'S1', period: '2014–2015', title: '처음부터 아시아 시장을 겨냥해 만들다',
        happened: [
          '약 1년의 개발 끝에 2015년 5월 잔디를 정식 출시했다.',
          '초기 기획 단계부터 국내에 한정하지 않고 아시아 시장을 목표로 인프라(AWS)를 설계했다.',
          '소프트뱅크벤처스를 시작으로 2015년 말 퀄컴벤처스 등에서 프리 시리즈A를 유치했고, 퀄컴 큐프라이즈 글로벌 대회에서 한국 기업 최초로 우승했다.',
        ],
        decision: '시장(아시아)과 인프라 구조를 출시 전에 정했다. 나중에 바꾸기 어려운 결정이기 때문이다.',
        lesson: '확장 방향이 분명하다면 되돌리기 어려운 기술 구조는 초기에 정한다. 단, 기능 범위는 작게 시작한다.',
        evidence: '외부 검증(대회 우승·투자)은 E4 성격이지만, 고객 지불 의사의 증거는 아니다.',
        sources: [2, 3, 4],
      },
      {
        stage: 'S2', period: '2015–2017', title: '무료로 써 보게 하고, 2년 뒤 과금하다',
        happened: [
          '"협업툴"이라는 개념 자체가 낯선 시장이라 초기에는 무료로 배포해 기업이 효용을 직접 느끼게 했다.',
          '출시 2년여 만인 2017년 약 10만 팀이 가입했다.',
          '2017년 과금 모델을 도입했고, 같은 해 시리즈A를 유치했다. 이후 매년 2배 가까운 성장을 이어 갔다고 밝혔다.',
          'IT기업과 중소기업이 먼저 반응했다.',
        ],
        decision: '시장 교육 비용을 무료 배포로 치르고, 사용이 쌓인 뒤 유료화했다.',
        lesson: '무료 사용자 수는 PMF의 증거가 아니다. 과금 후에도 남는 고객과 매출 성장이 진짜 신호였다. 무료 기간을 둘 거라면 언제, 어떤 기준으로 과금할지 미리 정해 둔다.',
        evidence: '가입 팀 수(E2 데이터) → 유료 전환·매출 성장(E4)으로 증거등급이 올라간 구간.',
        sources: [0, 1, 2, 6],
      },
      {
        stage: 'S3', period: '2017–2021', title: '작은 기업에서 검증하고 위로 넓히다',
        happened: [
          '스타트업·작은 기업에서 서비스를 검증한 뒤 중소·중견, 대기업 순으로 타깃을 넓혔다.',
          '국내 업무용 메신저 시장이 초기여서 브랜드 인지도와 "업무용 메신저"에 대한 신뢰를 함께 높이는 PR에 공을 들였고, 고객이 궁금해할 내용을 블로그·웹사이트 콘텐츠와 실시간 상담으로 풀었다.',
          '고객 사례 콘텐츠를 꾸준히 쌓았다. 처음엔 반응이 적었지만 양과 질이 쌓이며 문의로 이어졌다.',
          '2020년 1월 사용 팀 22만, 2021년 30만 팀을 넘었고 넥센타이어 등 제조 대기업으로 고객이 넓어졌다. 코로나로 원격 협업 수요가 커진 영향도 받았다.',
        ],
        decision: '가장 빨리 반응한 세그먼트(IT·중소기업)에서 출발해 인접 세그먼트로 한 단계씩 확장했다.',
        lesson: '반복 가능한 획득 경로(콘텐츠·고객 사례·PR)는 시간이 걸려 쌓인다. 세그먼트는 동시에 공략하지 말고 순서대로 넓힌다.',
        evidence: '채널별 유입과 대기업 레퍼런스가 E3~E4 증거로 쌓인 구간.',
        sources: [0, 5, 7, 8, 9],
      },
      {
        stage: 'S4', period: '2022–2024', title: '시장이 얼어붙자 성장보다 이익을 택하다',
        happened: [
          '2022년 6월 시리즈C를 유치했다. 누적 투자는 약 285억 원 규모로 알려졌다.',
          '코로나 특수 뒤 협업툴 시장이 위축되며 문을 닫는 업체가 나왔다. 토스랩은 신규 고객 확보보다 기존 고객 리텐션에 집중했다.',
          '대표는 인원을 두 배로 늘리면 매출과 속도도 두 배가 될 줄 알았지만 그렇지 않았다고 돌아봤다. 이후 비용 목표를 세우고 실행·평가를 반복했다.',
          '2024년 1월 설립 9년 만에 첫 월간 흑자를 냈다. 유료 고객사 5,000곳, 2019년 이후 4년간 매출 약 4배, 2023년 매출의 80%가 연간 계약, NDR 약 100%로 발표됐다.',
          '대만 법인은 현지 인력으로 운영하며 연 단위 흑자를 냈고, 일본은 채널 파트너를 통해 영업했다.',
        ],
        decision: '투자 환경 변화에 맞춰 목표를 "성장"에서 "이익"으로 바꾸고, 기회를 기다릴 체력을 만들었다.',
        lesson: '사람이 늘어도 성장이 자동으로 늘지 않는다. 연간 계약·NRR 같은 단위 경제성을 먼저 만들면 시장이 나빠져도 버틸 수 있다.',
        evidence: '연간 계약 비중·NDR·흑자는 E4(돈) 증거. S4 관문 지표(NRR 100% 이상)와 맞닿아 있다.',
        sources: [10, 16, 11, 12],
      },
      {
        stage: 'S4', period: '2025–2026', title: 'AI와 두 번째 제품으로 다음 성장을 준비하다',
        happened: [
          '자체 모델 대신 기존 AI 모델을 잔디에 접목하는 방식을 택했고, 2025년 3월 잔디 AI를 정식 출시했다. 130여 개 기업 3,400여 명이 PoC를 거쳐 2,100명 이상(약 63%)이 유료로 전환됐다고 밝혔다.',
          '비핵심 영역(전자결재·재무·인사 등)은 직접 만들기보다 제휴·연동으로 풀었고, AWS 마켓플레이스에도 등록했다.',
          '2026년 7월 미용의원 전용 상담 SaaS "잔디톡"을 내며 내부 협업에서 고객 접점으로 영역을 넓혔다.',
        ],
        decision: '새 기능·새 시장도 PoC → 유료 전환율로 검증하고, 잘하는 회사와는 제휴한다.',
        lesson: '두 번째 제품은 첫 제품과 별도 지표로 검증한다. 직접 만들 것과 제휴할 것을 구분하면 시간과 비용을 아낀다.',
        evidence: 'PoC 대비 유료 전환율(63%)처럼 신규 제품도 행동·돈 증거로 판단.',
        sources: [11, 13, 14, 15],
      },
    ],
    menteeQuestions: [
      '우리도 무료로 시장을 먼저 열어야 하는가? 그렇다면 과금 시점과 기준은 무엇인가?',
      '가장 먼저 돈을 낸(또는 낼) 세그먼트는 어디이고, 다음으로 넓힐 인접 세그먼트는 어디인가?',
      '우리 제품에서 연간 계약·재구매처럼 매출을 반복시키는 구조는 무엇인가?',
      '채용 계획이 매출 계획과 같은 속도로 짜여 있지는 않은가? 인원 1명당 매출을 보고 있는가?',
      '직접 만들 것과 제휴로 풀 것을 구분했는가?',
    ],
    sources: [
      { title: '30만 팀 Pick! 국내 1위 협업툴 잔디 운영사 토스랩 김대현 대표 인터뷰', outlet: '모비인사이드', date: '2022-01-24', url: 'https://www.mobiinside.co.kr/2022/01/24/jandi-interview/' },
      { title: '토스랩 김대현 대표 "아시아 넘버원 기업용 메신저 거듭나겠다"', outlet: '뉴스토마토', date: '2017-03-03', url: 'https://newstomato.com/ReadNews.aspx?no=735774' },
      { title: '토스랩 김대현 대표 "국내 1위 넘어 아시아 1위가 목표"', outlet: '여성경제신문', date: '2021', url: 'https://www.womaneconomy.co.kr/news/articleView.html?idxno=102692' },
      { title: '(주)토스랩 기업 소개', outlet: '잡플래닛', date: '-', url: 'https://www.jobplanet.co.kr/companies/96271/landing/토스랩' },
      { title: '(주)토스랩 기업정보·연혁', outlet: '사람인', date: '-', url: 'https://www.saramin.co.kr/zf_user/company-info/view/csn/dGJ3YnhUMDZ0TnVRaHcyYmJRaG5zdz09/company_nm/(%EC%A3%BC)%ED%86%A0%EC%8A%A4%EB%9E%A9' },
      { title: '김대현 토스랩 대표 "잔디 통해 리모트 워크 돕는다"', outlet: '이투데이', date: '2020', url: 'https://www.etoday.co.kr/news/view/1972969' },
      { title: '토스랩, 업무용 메신저 잔디 누적 사용팀 10만 돌파', outlet: '모비인사이드', date: '2018-02-21', url: 'https://www.mobiinside.co.kr/2018/02/21/press-jandi/' },
      { title: 'B2B와 B2C 마케팅 전략과 활용 채널 (잔디 마케팅 인터뷰)', outlet: '모비인사이드', date: '2017-05-26', url: 'https://www.mobiinside.co.kr/2017/05/26/b2b-b2c-digitalmarketing/' },
      { title: '디지털 전환 앞둔 제조기업 위주로 사용자 증가', outlet: '이코노미스트', date: '2021-07-14', url: 'https://economist.co.kr/article/view/ecn202107140019' },
      { title: '협업툴 잔디 사례로 본 B2B 브랜딩 성공 전략', outlet: '모비인사이드', date: '2021-05-11', url: 'https://www.mobiinside.co.kr/2021/05/11/jandi-branding/' },
      { title: '토스랩(잔디) 기업정보', outlet: 'THE VC', date: '2026', url: 'https://thevc.kr/tosslab' },
      { title: '토스랩 잔디: 죽음의 시장서 살아남은 자', outlet: '바이라인네트워크', date: '2024-05-28', url: 'https://byline.network/2024/05/0528/' },
      { title: '5000개 기업 잔디 깔더니… 토스랩, 사상 첫 흑자 달성', outlet: '이코노믹리뷰', date: '2024-02', url: 'https://www.econovill.com/news/articleView.html?idxno=645019' },
      { title: 'AI 협업툴 잔디, 인텔리전스 허브 잔디홈 출시', outlet: '벤처스퀘어', date: '2025-08-22', url: 'https://www.venturesquare.net/?p=1001071' },
      { title: 'AWS 마켓 등록한 K-협업툴… 잔디 "글로벌 고객과 접점 확대"', outlet: '유니콘팩토리', date: '2025-04-30', url: 'https://www.unicornfactory.co.kr/article/2025042910505887785' },
      { title: '토스랩, 미용의원 전용 통합 상담 SaaS 잔디톡 출시 (뉴스 모음)', outlet: 'THE VC', date: '2026-07-20', url: 'https://thevc.kr/tosslab' },
      { title: '토스랩(JANDI) 회사 소개', outlet: '원티드', date: '-', url: 'https://www.wanted.co.kr/company/64' },
    ],
    note: '공개 기사·인터뷰를 바탕으로 Keep Mentor 단계에 맞춰 재구성한 교육용 자료입니다. 단계 구분과 교훈은 Keep Mentor의 해석이며 토스랩의 공식 입장이 아닙니다. 수치는 각 보도 시점 기준입니다.',
  },
];

// 추가로 읽을 원문 (사례별)
export const FURTHER_READING: Record<string, { title: string; url: string }[]> = {
  tosslab: [
    { title: '모비인사이드 블로그: 토스랩 사례', url: 'https://m.blog.naver.com/PostView.naver?blogId=mobiinside&logNo=224363019289' },
  ],
};
