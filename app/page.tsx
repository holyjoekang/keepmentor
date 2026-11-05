'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { TopBar } from '@/components/ui';
import { EvidenceLadder, ExperimentLoop, FlowStrip, HumanAiSplit, KpiStack } from '@/components/visuals';
import { currentUser, type Me } from '@/lib/client';
import { FOUNDATIONS, PRINCIPLES } from '@/lib/method-content';

export default function Landing() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { currentUser().then(setMe).catch(() => undefined); }, []);

  return (
    <>
      <TopBar me={me} variant="public" />

      <section className="landing-hero">
        <div className="wrap" style={{ padding: 0 }}>
          <div className="eyebrow">스타트업 멘토링 방법론</div>
          <h1>감이 아니라 증거로,<br />조언이 아니라 실험으로.</h1>
          <p className="lead">
            Keep Mentor는 모든 멘토링을 같은 기준으로 진단하고, 2주 단위 실험으로 실행하며, 그 변화를 증거등급으로 측정합니다.
            검증된 창업 방법론과 국내 창업지원 제도의 평가 구조를 바탕으로 설계했습니다.
          </p>
          <div className="row" style={{ marginTop: 26, gap: 10 }}>
            <Link href="/method" className="btn primary lg">방법론 자세히 보기 <Icon name="arrow" size={16} /></Link>
            <Link href={me ? '/home' : '/login'} className="btn ghost-light lg">{me ? '내 멘토링으로' : '멘토링 시작하기'}</Link>
          </div>
          <div className="pill-row">
            <span>7축 · 12문항 표준 진단</span><span>증거등급 E0–E4</span><span>단계 관문 S0–S4</span><span>2주 실험 카드</span><span>사람 우선 기록</span>
          </div>
        </div>
      </section>

      <section className="section" id="flow">
        <div className="wrap" style={{ padding: 0 }}>
          <div className="section-head">
            <div className="eyebrow">진행 절차</div>
            <h2>6단계로 진행되고, 매 단계마다 남는 결과물이 정해져 있습니다</h2>
            <p>사전진단부터 사후 추적까지 약 6~8주가 걸립니다. 어느 기관의 어느 멘토가 맡아도 같은 순서와 같은 형식으로 기록됩니다. 단계를 누르면 상세 설명으로 이동합니다.</p>
          </div>
          <FlowStrip linkBase="/method" />
          <div className="row small muted" style={{ marginTop: 14 }}>
            <span className="badge accent">강조 테두리</span> 3·4단계는 회차마다 반복되는 실험 순환입니다.
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap" style={{ padding: 0 }}>
          <div className="section-head">
            <div className="eyebrow">네 가지 원칙</div>
            <h2>멘토 개인의 경험에만 기대지 않습니다</h2>
          </div>
          <div className="grid grid-4">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card flat" style={{ margin: 0 }}>
                <span className="ichip lg"><Icon name={p.icon} size={22} /></span>
                <h3 style={{ marginTop: 14 }}>{p.title}</h3>
                <p className="small muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid grid-2" style={{ padding: 0, alignItems: 'center', gap: 40 }}>
          <div>
            <div className="eyebrow">증거등급</div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>점수는 근거의 종류만큼만 올라갑니다</h2>
            <p className="muted">"고객이 좋다고 했다"와 "고객이 돈을 냈다"는 다른 증거입니다. 모든 문항에 근거를 붙이고, 근거의 등급이 점수 상한을 정합니다. 기관과 업종이 달라도 비교할 수 있는 공통 기준입니다.</p>
          </div>
          <div className="card" style={{ margin: 0 }}><EvidenceLadder /></div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap grid grid-2" style={{ padding: 0, alignItems: 'center', gap: 40 }}>
          <div className="card flat" style={{ margin: 0, display: 'flex', justifyContent: 'center' }}><ExperimentLoop /></div>
          <div>
            <div className="eyebrow">실험 카드</div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>매 회차는 다음 2주의 실험으로 끝납니다</h2>
            <p className="muted">조언은 기록해도 성과를 잴 수 없습니다. 실험은 실행률, 성공률, 학습 속도로 잴 수 있습니다. 다음 회차는 실험 결과 점검으로 시작하고, 대표가 직접 적은 결과를 보고 Pivot · Persevere · Kill을 결정합니다.</p>
            <p className="small faint">근거: 고객 개발(Steve Blank), 린 스타트업(Eric Ries), Jobs To Be Done(Clayton Christensen)</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap" style={{ padding: 0 }}>
          <div className="section-head">
            <div className="eyebrow">근거</div>
            <h2>검증된 방법론과 국내 제도의 평가 구조를 따랐습니다</h2>
            <p>새로 만든 이론이 아닙니다. 실리콘밸리 창업 방법론, 스케일업 경영 프레임워크, 정부 창업지원사업의 평가 구조, 코칭·교육 평가 모델에서 검증된 요소를 골라 하나의 절차로 엮었습니다.</p>
          </div>
          <div className="grid grid-3">
            {FOUNDATIONS.slice(0, 6).map((f) => (
              <div key={f.id} className="fw-card">
                <strong>{f.name}</strong>
                <div className="src">{f.source}</div>
                <div className="small">{f.idea}</div>
                <div className="use"><strong>적용</strong> · {f.use}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <Link href="/method#foundations" className="btn">근거 12가지 모두 보기 <Icon name="arrow" size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="wrap" style={{ padding: 0 }}>
          <div className="section-head">
            <div className="eyebrow">사람과 AI</div>
            <h2>AI가 대신 멘토링하지 않도록 설계했습니다</h2>
            <p>AI가 처음부터 끝까지 자동으로 돌면 회의에서 무엇을 논의했는지, 왜 다음 단계로 넘어가는지 같은 사고 과정이 빠집니다. 그래서 핵심 기록은 사람이 먼저 쓰고, 그 칸이 비어 있으면 다음 단계로 넘어갈 수 없습니다.</p>
          </div>
          <HumanAiSplit />
        </div>
      </section>

      <section className="section">
        <div className="wrap grid grid-2" style={{ padding: 0, gap: 40, alignItems: 'center' }}>
          <div>
            <div className="eyebrow">결과 측정</div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>멘토링 횟수가 아니라 변화를 보고합니다</h2>
            <p className="muted">성과지표는 Kirkpatrick 교육 평가 모델의 네 수준에 맞춰 나눴습니다. 만족도는 멘토 품질 관리에만 쓰고, 성과는 증거등급이 실제로 올랐는지와 3·6개월 뒤의 후속 성과로 봅니다.</p>
          </div>
          <KpiStack />
        </div>
      </section>

      <section className="landing-hero" style={{ padding: '56px 16px' }}>
        <div className="wrap row between" style={{ padding: 0 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800 }}>방법론을 끝까지 읽어 보세요</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0 }}>단계별로 누가 무엇을 쓰고, 어떤 결과물이 남는지 모두 공개합니다.</p>
          </div>
          <div className="row">
            <Link href="/method" className="btn primary lg">방법론 상세</Link>
            <Link href={me ? '/home' : '/login'} className="btn ghost-light lg">{me ? '내 멘토링' : '로그인'}</Link>
          </div>
        </div>
      </section>
      <footer className="footer"><div className="wrap" style={{ padding: 0 }}>Keep Mentor · Keep 브랜드의 멘토링 프로토타입. 소개한 저자·기관과 제휴 관계는 없으며, 각 방법론에서 검증된 요소를 참고해 설계했습니다.</div></footer>
    </>
  );
}
