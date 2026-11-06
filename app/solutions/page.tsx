'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { CONTACT_EMAIL, PubFooter, PubNav, useOptionalMe } from '@/components/Public';

const PACKAGES = [
  {
    name: '파일럿', for: '처음 도입하는 기관 · 멘토 1~5명', feat: false,
    items: ['멘토링 1기수(기업 5~10곳) 운영', 'Keep Mentor 운영 도구(웹앱)', '표준 진단·회차·실험 카드 양식', '멘토 온보딩 1회', '기수 종료 성과 보고서 1회'],
  },
  {
    name: '프로그램', for: '정기 멘토링 프로그램 운영 기관', feat: true,
    items: ['연간 여러 기수 운영', '기관 → 프로그램 → 건 설정, 업종 템플릿 6종', '기관 대시보드와 성과지표 4층 보고', '멘토 품질 피드백(회차별 평가)', '지원사업·TIPS 평가표 매핑', 'Google Sheets 기관 계정 연동'],
  },
  {
    name: '기관 전체', for: '여러 프로그램·지역을 운영하는 기관', feat: false,
    items: ['프로그램 전체 통합 운영', '기관 맞춤 진단 기준·관문값 보정', '여러 기관 간 이력 연계(기업 동의 기반)', '전문가 패널 운영 지원', '연 1회 방법론 기준 개정 워크숍'],
  },
];

const PROCESS = [
  { t: '진단 미팅', d: '현재 멘토링 운영 방식, 멘토 풀, 보고 양식을 확인합니다.' },
  { t: '프로그램 설정', d: '회차 수와 간격, 업종 템플릿, 보고 양식을 기관에 맞게 설정합니다.' },
  { t: '멘토 온보딩', d: '방법론과 도구 사용법, 사람이 먼저 쓰는 원칙을 멘토와 함께 연습합니다.' },
  { t: '운영과 보고', d: '기수를 운영하고, 증거등급 변화와 후속 성과를 담은 보고서를 냅니다.' },
];

const FAQ = [
  { q: '데이터는 어디에 저장되나요?', a: '기관의 Google Sheets에 저장합니다. 첨부 자료와 회의록 원문은 앱에 저장하지 않습니다. 멘토 개인 메모, 멘티와 공유하는 기록, 기관 보고용 요약으로 공개 범위를 나눕니다.' },
  { q: 'AI가 멘토링을 대신하나요?', a: '아닙니다. 앱은 AI를 직접 호출하지 않습니다. 멘토가 익명화된 데이터 패킷을 Claude 프로젝트에서 처리해 초안을 받아오고, 핵심 요약·단계 전환 근거·멘티의 이해 확인은 사람이 직접 씁니다.' },
  { q: '기존 멘토 풀과 멘토링 방식을 바꿔야 하나요?', a: '멘토는 그대로입니다. 진단 기준과 기록 형식만 통일합니다. 회차 수와 간격은 기관의 기존 운영 방식에 맞춰 설정합니다.' },
  { q: '어떤 근거로 만든 방법론인가요?', a: '고객 개발, 린 스타트업, JTBD, Y Combinator 방식, PMF 측정, 비즈니스 모델 캔버스, Scaling Up, TRL, PSST 사업계획서 구조, TIPS, GROW 코칭, Kirkpatrick 평가 모델에서 검증된 요소를 적용했습니다. 방법론 페이지에 적용한 곳을 모두 공개합니다.' },
  { q: '단계 관문 수치는 확정된 기준인가요?', a: '초기 기준입니다. 파일럿 기관의 예외 기록과 멘토 판정을 바탕으로 매년 개정하며, 기관 전체 패키지에서는 기관 맞춤 보정을 지원합니다.' },
];

export default function Solutions() {
  const me = useOptionalMe();
  const [f, setF] = useState({ org: '', name: '', email: '', type: '창업지원기관', size: '', msg: '' });
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const body = `기관: ${f.org}\n담당자: ${f.name}\n이메일: ${f.email}\n기관 유형: ${f.type}\n멘토링 규모: ${f.size}\n\n${f.msg}`;

  return (
    <div className="pub">
      <PubNav me={me} />
      <section className="ed-hero" style={{ backgroundImage: 'url(/images/program.jpg)', minHeight: 480 }}>
        <div className="pw">
          <div className="ed-kicker">Solutions</div>
          <h1 className="serif" style={{ marginTop: 18 }}>멘토링 프로그램에<br />방법론과 운영 도구를 함께.</h1>
          <p className="lead">파일럿 한 기수부터 기관 전체 운영까지. 진단 기준, 기록 양식, 운영 도구, 멘토 온보딩, 성과 보고를 하나의 패키지로 제공합니다.</p>
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw">
          <div className="ed-kicker">Packages</div>
          <h2 className="ed-h2 serif">도입 패키지</h2>
          <p className="ed-intro">기관의 규모와 운영 방식에 맞춰 견적을 드립니다. 모든 패키지에 같은 방법론과 운영 도구가 들어갑니다.</p>
          <div className="pkg">
            {PACKAGES.map((p) => (
              <div key={p.name} className={p.feat ? 'feat' : ''}>
                {p.feat && <span className="badge" style={{ alignSelf: 'flex-start', background: 'var(--dawn-soft)', color: '#8a5a00', borderColor: 'transparent' }}>가장 많이 선택</span>}
                <h3 className="serif" style={{ fontSize: 26, margin: 0 }}>{p.name}</h3>
                <div className="muted small">{p.for}</div>
                <hr className="ed-rule" style={{ margin: '8px 0' }} />
                <ul>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
                <div style={{ marginTop: 'auto', paddingTop: 16 }}>
                  <a href="#contact" className={`btn ${p.feat ? 'indigo' : ''}`} onClick={() => setF((x) => ({ ...x, msg: `${p.name} 패키지 도입을 검토하고 있습니다.` }))}>견적 문의</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-sec tint" id="process">
        <div className="pw ed-split">
          <div>
            <div className="ed-kicker">Process</div>
            <h2 className="ed-h2 serif">도입은 네 단계로 진행됩니다</h2>
            <ul className="ed-list">
              {PROCESS.map((p, i) => <li key={p.t}><span className="n">0{i + 1}</span><div><h4>{p.t}</h4><p>{p.d}</p></div></li>)}
            </ul>
          </div>
          <div className="photo" style={{ backgroundImage: 'url(/images/mentoring.jpg)' }} />
        </div>
      </section>

      <section className="ed-sec">
        <div className="pw">
          <div className="ed-kicker">Deliverables</div>
          <h2 className="ed-h2 serif">기관이 받는 결과물</h2>
          <div className="grid grid-4" style={{ marginTop: 28 }}>
            {[
              { i: 'target', t: '기업별 진단 리포트', d: '7축 레이더, 단계 판정, 병목, 레드플래그' },
              { i: 'flask', t: '실험 카드 기록', d: '가설 · 결과 · 배운 것 · 결정' },
              { i: 'map', t: '종합 리포트', d: '90일 로드맵, 1페이지 투자메모, 자금 트랙' },
              { i: 'chart', t: '기수 성과 보고서', d: '증거등급 상승, 이행률, 3·6개월 후속 성과' },
            ].map((x) => (
              <div key={x.t} style={{ borderTop: '2px solid var(--text)', paddingTop: 18 }}>
                <span className="ichip"><Icon name={x.i} /></span>
                <h4 style={{ margin: '12px 0 6px', fontSize: 17 }}>{x.t}</h4>
                <p className="muted small" style={{ margin: 0 }}>{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ed-sec tint" id="faq">
        <div className="pw" style={{ maxWidth: 900 }}>
          <div className="ed-kicker">FAQ</div>
          <h2 className="ed-h2 serif">자주 묻는 질문</h2>
          <div className="faq">
            {FAQ.map((x) => <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="ed-sec ink" id="contact">
        <div className="pw ed-split" style={{ alignItems: 'start' }}>
          <div>
            <div className="ed-kicker">Contact</div>
            <h2 className="ed-h2 serif" style={{ color: '#fff' }}>도입 문의</h2>
            <p className="ed-intro">기관 정보와 멘토링 규모를 알려 주시면 맞춤 도입안과 견적을 보내 드립니다.</p>
            <Link href="/" className="btn line-light">방법론 먼저 보기</Link>
          </div>
          <div className="card" style={{ margin: 0, color: 'var(--text)', borderRadius: 4 }}>
            {sent ? (
              <div className="alert ok">메일 앱에서 문의 메일이 열렸습니다. 전송을 완료해 주세요.</div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!CONTACT_EMAIL) return;
                window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[Keep Mentor 도입 문의] ${f.org}`)}&body=${encodeURIComponent(body)}`;
                setSent(true);
              }}>
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div><label>기관명</label><input required value={f.org} onChange={set('org')} /></div>
                  <div><label>담당자</label><input required value={f.name} onChange={set('name')} /></div>
                  <div><label>이메일</label><input required type="email" value={f.email} onChange={set('email')} /></div>
                  <div>
                    <label>기관 유형</label>
                    <select value={f.type} onChange={set('type')}>
                      <option>창업지원기관</option><option>액셀러레이터·투자사</option><option>공공기관·지자체</option><option>기업</option><option>개인 멘토</option>
                    </select>
                  </div>
                </div>
                <label>멘토링 규모 (기업 수 · 멘토 수)</label><input value={f.size} onChange={set('size')} placeholder="예: 연 40개사, 멘토 15명" />
                <label>문의 내용</label><textarea value={f.msg} onChange={set('msg')} />
                {!CONTACT_EMAIL && <div className="alert info small">문의 받을 이메일이 아직 설정되지 않았습니다. 운영자가 NEXT_PUBLIC_CONTACT_EMAIL 환경변수를 설정하면 활성화됩니다.</div>}
                <button className="primary" type="submit" disabled={!CONTACT_EMAIL} style={{ marginTop: 14 }}>문의 메일 작성</button>
              </form>
            )}
          </div>
        </div>
      </section>
      <PubFooter />
    </div>
  );
}
