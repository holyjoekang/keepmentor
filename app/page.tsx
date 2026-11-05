'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { PubFooter, PubNav, useOptionalMe } from '@/components/Public';
import { EvidenceLadder, ExperimentLoop, FlowStrip, HumanAiSplit, KpiStack } from '@/components/visuals';
import { FOUNDATIONS, PRINCIPLES } from '@/lib/method-content';

const INSIGHTS = [
  { img: '/images/diagnosis.jpg', tag: '진단', title: '주장이 아니라 증거로 현재 위치를 판정합니다', text: '7축·12문항 표준 진단과 증거등급(E0~E4)으로, 멘토가 달라도 같은 기준의 진단 리포트가 나옵니다.', href: '/method#diagnosis' },
  { img: '/images/experiment.jpg', tag: '실행', title: '모든 회차는 2주짜리 실험으로 끝납니다', text: '가설 · 방법 · 성공 기준 · 기한을 정한 실험 카드로 조언을 실행으로 바꾸고, 다음 회차는 결과 점검으로 시작합니다.', href: '/method#exp' },
  { img: '/images/outcome.jpg', tag: '성과', title: '멘토링 횟수가 아니라 변화를 보고합니다', text: '목표 문항의 증거등급 상승과 3·6개월 후 후속 성과로, 기관이 예산의 근거를 갖게 됩니다.', href: '/method#kpi' },
];

const AUDIENCE = [
  { icon: 'building', title: '창업지원기관', text: '창조경제혁신센터, 창업보육센터, 대학 창업지원단. 멘토 풀마다 다른 멘토링 품질을 하나의 기준으로 맞춥니다.' },
  { icon: 'chart', title: '액셀러레이터·투자사', text: 'TIPS 운영사, AC, 초기 VC. 포트폴리오의 단계와 병목을 같은 언어로 보고, 다음 자금 트랙을 준비시킵니다.' },
  { icon: 'shield', title: '공공기관·지자체', text: '창업 지원사업 운영 기관. 멘토링 결과를 횟수가 아닌 변화량과 후속 성과로 보고합니다.' },
  { icon: 'users', title: '기업·개인 멘토', text: '오픈이노베이션 프로그램과 전문 멘토. 개인의 경험을 검증된 절차와 기록으로 확장합니다.' },
];

export default function Landing() {
  const me = useOptionalMe();
  return (
    <div className="pub">
      <PubNav me={me} />

      <section className="ed-hero" style={{ backgroundImage: 'url(/images/hero.jpg)' }}>
        <div className="pw">
          <div className="ed-kicker">Startup Mentoring Methodology</div>
          <h1 className="serif" style={{ marginTop: 18 }}>멘토링의 품질을<br />증거로 증명합니다.</h1>
          <p className="lead">Keep Mentor는 검증된 창업 방법론과 국내 창업지원 제도의 평가 구조를 하나의 절차로 엮은 스타트업 멘토링 방법론이자 운영 도구입니다. 진단하고, 실험하고, 변화를 측정합니다.</p>
          <div className="row" style={{ marginTop: 28, gap: 12 }}>
            <Link href="/solutions#contact" className="btn dawn lg">도입 문의 <Icon name="arrow" size={16} /></Link>
            <Link href="/method" className="btn line-light lg">방법론 살펴보기</Link>
          </div>
          <div className="ed-facts">
            <div><strong>6단계</strong><span>사전진단부터 사후 추적까지</span></div>
            <div><strong>12문항</strong><span>7개 축의 표준 진단</span></div>
            <div><strong>E0–E4</strong><span>증거등급에 따른 점수 상한</span></div>
            <div><strong>12개</strong><span>참고한 검증 방법론</span></div>
          </div>
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw">
          <div className="ed-kicker">What we do</div>
          <h2 className="ed-h2 serif">멘토 개인의 경험에 기대던 멘토링을,<br />누가 맡아도 같은 품질의 프로그램으로.</h2>
          <div className="ed-cards" style={{ marginTop: 40 }}>
            {INSIGHTS.map((c) => (
              <Link key={c.tag} href={c.href} className="ed-card">
                <div className="img" style={{ backgroundImage: `url(${c.img})` }} />
                <div className="tag">{c.tag}</div>
                <h3 className="serif">{c.title}</h3>
                <p>{c.text}</p>
                <span className="textlink">자세히 <Icon name="arrow" size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-sec tint" id="approach">
        <div className="pw">
          <div className="ed-kicker">Our approach</div>
          <h2 className="ed-h2 serif">6단계로 진행되고, 단계마다 남는 결과물이 정해져 있습니다</h2>
          <p className="ed-intro">약 6~8주. 어느 기관의 어느 멘토가 맡아도 같은 순서, 같은 형식으로 기록됩니다. 3·4단계는 회차마다 반복되는 실험 순환입니다.</p>
          <FlowStrip linkBase="/method" />
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw ed-split">
          <div className="photo" style={{ backgroundImage: 'url(/images/mentoring.jpg)' }} />
          <div>
            <div className="ed-kicker">Principles</div>
            <h2 className="ed-h2 serif">네 가지 원칙</h2>
            <ul className="ed-list">
              {PRINCIPLES.map((p, i) => (
                <li key={p.title}><span className="n">0{i + 1}</span><div><h4>{p.title}</h4><p>{p.text}</p></div></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="ed-sec tint">
        <div className="pw ed-split">
          <div>
            <div className="ed-kicker">Evidence</div>
            <h2 className="ed-h2 serif">점수는 근거의 종류만큼만 올라갑니다</h2>
            <p className="ed-intro" style={{ marginBottom: 0 }}>"고객이 좋다고 했다"와 "고객이 돈을 냈다"는 다른 증거입니다. 모든 문항에 근거를 붙이고, 근거의 등급이 점수 상한을 정합니다. 기관과 업종이 달라도 비교할 수 있는 공통 기준입니다.</p>
          </div>
          <div className="card" style={{ margin: 0 }}><EvidenceLadder /></div>
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw ed-split">
          <div className="card flat" style={{ margin: 0, display: 'flex', justifyContent: 'center' }}><ExperimentLoop /></div>
          <div>
            <div className="ed-kicker">Experiments</div>
            <h2 className="ed-h2 serif">조언은 잴 수 없지만, 실험은 잴 수 있습니다</h2>
            <p className="ed-intro" style={{ marginBottom: 12 }}>실험 카드는 실행률, 성공률, 학습 속도로 성과를 보여줍니다. 대표가 직접 적은 결과를 보고 Pivot · Persevere · Kill을 결정합니다.</p>
            <p className="small faint">근거: 고객 개발(Steve Blank), 린 스타트업(Eric Ries), Jobs To Be Done(Clayton Christensen)</p>
          </div>
        </div>
      </section>

      <section className="ed-sec ink">
        <div className="pw ed-split">
          <div>
            <div className="ed-kicker">Case Library</div>
            <h2 className="ed-h2 serif" style={{ color: '#fff' }}>대표가 가져오는 질문 66개와 그 해결 과정</h2>
            <p className="ed-intro">“지인 12명이 좋다고 했어요”, “PoC를 하고 싶어요”, “연락이 잘 안 돼요.” 단계별로 가장 자주 나오는 이슈를 근본 원인, 진단 질문, 세션 진행, 2주 과제, 멘토의 함정까지 정리한 사례집입니다.</p>
            <div className="row" style={{ gap: 12 }}>
              <Link href="/cases" className="btn dawn lg">사례집 보기 <Icon name="arrow" size={16} /></Link>
              <Link href="/cases?track=b2b-poc" className="btn line-light lg">B2B·PoC 플레이북</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { id: 'S0-01', q: '벌써 12명 만나 봤는데 다들 좋은 아이디어래요. 이 정도면 검증된 거 아닌가요?', t: '지인 인터뷰 12건을 검증으로 착각' },
              { id: 'B2B-01', q: '사장님들이 써 보시면 다 좋다고 하시는데, 이상하게 결제까지는 안 가네요.', t: '사용자·구매결정자·예산보유자 미구분' },
              { id: 'MC-01', q: '죄송해요, 이번 주는 정부과제 마감이라... 사전 질문지는 아직 못 했어요.', t: '대표가 연락을 잘 받지 않는다' },
            ].map((x) => (
              <Link key={x.id} href={`/cases/${x.id}`} style={{ display: 'block', padding: '18px 20px', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 4, color: '#fff' }}>
                <div className="serif" style={{ fontSize: 17, lineHeight: 1.5 }}>“{x.q}”</div>
                <div className="small" style={{ color: 'var(--dawn)', marginTop: 8, fontWeight: 600 }}>{x.id} · {x.t} →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-sec tint">
        <div className="pw">
          <div className="ed-kicker">Who it&apos;s for</div>
          <h2 className="ed-h2 serif">멘토링 프로그램을 운영하는 모든 조직을 위해</h2>
          <div className="ed-split" style={{ marginBottom: 40, alignItems: 'stretch' }}>
            <div className="photo" style={{ backgroundImage: 'url(/images/program.jpg)', aspectRatio: '16 / 9' }} />
            <p className="ed-intro" style={{ alignSelf: 'center' }}>기관 → 프로그램 → 멘토링 건으로 설정만 바꿔 씁니다. 회차 수와 간격은 프로그램마다 다르게, 진단 기준과 기록 형식은 모두 같게. 같은 기업이 여러 기관에서 받은 멘토링도 동의를 받아 하나의 이력으로 이어집니다.</p>
          </div>
          <div className="aud">
            {AUDIENCE.map((a) => (
              <div key={a.title}>
                <span className="ichip"><Icon name={a.icon} /></span>
                <h4>{a.title}</h4>
                <p>{a.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw">
          <div className="ed-kicker">Foundations</div>
          <h2 className="ed-h2 serif">검증된 방법론과 국내 제도의 평가 구조를 따랐습니다</h2>
          <p className="ed-intro">실리콘밸리 창업 방법론, 스케일업 경영 프레임워크, 정부 창업지원사업의 평가 구조, 코칭·교육 평가 모델에서 검증된 요소를 골라 하나의 절차로 엮었습니다.</p>
          <div className="grid grid-3">
            {FOUNDATIONS.slice(0, 6).map((f) => (
              <div key={f.id} className="fw-card" style={{ borderRadius: 4 }}>
                <strong>{f.name}</strong>
                <div className="src">{f.source}</div>
                <div className="small">{f.idea}</div>
                <div className="use"><strong>적용</strong> · {f.use}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}><Link href="/method#foundations" className="textlink">근거 12가지 모두 보기 <Icon name="arrow" size={15} /></Link></div>
        </div>
      </section>

      <section className="ed-sec ink">
        <div className="pw">
          <div className="ed-kicker">People first</div>
          <h2 className="ed-h2 serif" style={{ color: '#fff' }}>AI가 대신 멘토링하지 않도록 설계했습니다</h2>
          <p className="ed-intro">AI가 처음부터 끝까지 자동으로 돌면 회의에서 무엇을 논의했는지, 왜 다음 단계로 넘어가는지 같은 사고 과정이 빠집니다. 핵심 기록은 사람이 먼저 쓰고, 그 칸이 비어 있으면 다음 단계로 넘어갈 수 없습니다.</p>
          <div style={{ color: 'var(--text)' }}><HumanAiSplit /></div>
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw ed-split">
          <div>
            <div className="ed-kicker">Measurement</div>
            <h2 className="ed-h2 serif">네 층위로 측정하고 보고합니다</h2>
            <p className="ed-intro" style={{ marginBottom: 0 }}>Kirkpatrick 교육 평가 모델의 네 수준에 맞췄습니다. 만족도는 멘토 품질 관리에만 쓰고, 성과는 증거등급 상승과 3·6개월 뒤의 후속 성과로 봅니다.</p>
          </div>
          <KpiStack />
        </div>
      </section>

      <section className="ed-cta" style={{ backgroundImage: 'url(/images/city.jpg)' }}>
        <div className="pw">
          <div className="ed-kicker">Get started</div>
          <h2 className="ed-h2 serif" style={{ color: '#fff' }}>귀 기관의 멘토링 프로그램에<br />Keep Mentor를 도입하세요.</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 620, fontSize: 17 }}>파일럿 한 기수부터 시작할 수 있습니다. 방법론, 운영 도구, 멘토 온보딩, 성과 보고 양식을 함께 제공합니다.</p>
          <div className="row" style={{ gap: 12, marginTop: 24 }}>
            <Link href="/solutions" className="btn dawn lg">도입 안내 보기</Link>
            <Link href="/solutions#contact" className="btn line-light lg">도입 문의</Link>
          </div>
        </div>
      </section>
      <PubFooter />
    </div>
  );
}
