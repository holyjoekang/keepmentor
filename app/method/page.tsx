'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { TopBar } from '@/components/ui';
import { AxisMap, EvidenceLadder, ExperimentLoop, FlowStrip, HumanAiSplit, KpiStack, PanelRing, StageGates } from '@/components/visuals';
import { currentUser, type Me } from '@/lib/client';
import { FLOW, FOUNDATIONS, PANEL } from '@/lib/method-content';
import { RED_FLAGS } from '@/lib/methodology';

const GROUP_LABEL = { global: '글로벌 창업·성장 방법론', korea: '국내 창업지원 제도', coach: '코칭·교육 평가' } as const;

export default function MethodPage() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => { currentUser().then(setMe).catch(() => undefined); }, []);
  const fw = (id: string) => FOUNDATIONS.find((f) => f.id === id);

  return (
    <>
      <TopBar me={me} variant="public" />
      <section className="landing-hero" style={{ padding: '56px 16px 64px' }}>
        <div className="wrap" style={{ padding: 0 }}>
          <div className="eyebrow">방법론 상세</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>Keep Mentor 멘토링은 이렇게 진행됩니다</h1>
          <p className="lead">진단 기준, 단계 판정, 회차 운영, 사람과 AI의 역할, 성과 측정까지 모두 공개합니다. 멘토와 멘티는 같은 절차를 보고 같은 결과물을 남깁니다.</p>
        </div>
      </section>

      <nav className="sticky-nav">
        <div className="wrap row" style={{ padding: '0 16px' }}>
          <a href="#flow">전체 흐름</a>
          {FLOW.map((s) => <a key={s.id} href={`#${s.id}`}>{s.no} {s.title}</a>)}
          <a href="#diagnosis">진단 기준</a>
          <a href="#stages">단계·관문</a>
          <a href="#human">사람과 AI</a>
          <a href="#panel">전문가 패널</a>
          <a href="#kpi">성과 측정</a>
          <a href="#foundations">근거</a>
        </div>
      </nav>

      <div className="wrap">
        <section id="flow" style={{ padding: '32px 0', scrollMarginTop: 110 }}>
          <h2 style={{ fontSize: 24 }}>전체 흐름</h2>
          <p className="muted">표준 패키지는 사전진단 + 3회차(2주 간격) + 사후 추적입니다. 회차 수와 간격은 프로그램에 따라 1회(단회 자문)에서 최대 6회까지 바뀌지만, 단계와 기록 형식은 같습니다.</p>
          <FlowStrip />
        </section>

        <section>
          {FLOW.map((s) => (
            <div key={s.id} id={s.id} className="step-detail">
              <div className="side">
                <div className="big">{s.no}</div>
                <h2 style={{ marginTop: 8 }}>{s.title}</h2>
                <div className="row small muted"><Icon name="clock" size={14} /> {s.when}</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {s.basis.map((b) => <span key={b} className="badge blue" style={{ alignSelf: 'flex-start' }}><Icon name="book" size={12} /> {fw(b)?.name}</span>)}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 16 }}>{s.purpose}</p>
                <div className="who">
                  <div className="panel" style={{ background: 'var(--blue-soft)' }}>
                    <div className="panel-label" style={{ color: 'var(--blue)' }}><Icon name="user" size={15} /> 멘티(대표)</div>
                    <ul>{s.mentee.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div className="panel human">
                    <div className="panel-label" style={{ color: 'var(--accent)' }}><Icon name="pen" size={15} /> 멘토</div>
                    <ul>{s.mentor.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                  <div className="panel ai">
                    <div className="panel-label" style={{ color: 'var(--ai)' }}><Icon name="sparkle" size={15} /> AI 초안 (선택)</div>
                    <ul>{s.ai.map((x) => <li key={x}>{x}</li>)}</ul>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 14 }}>
                  <span className="small" style={{ fontWeight: 700 }}>결과물</span>
                  {s.outputs.map((o) => <span key={o} className="badge accent"><Icon name="file" size={12} /> {o}</span>)}
                </div>
                {s.id === 'exp' && <div className="card flat" style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}><ExperimentLoop /></div>}
              </div>
            </div>
          ))}
        </section>

        <section id="diagnosis" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="eyebrow">진단 기준</div>
          <h2 style={{ fontSize: 24 }}>7개 축, 코어 12문항</h2>
          <p className="muted">모든 기업에 같은 12문항을 묻습니다. 문항마다 1~5점의 행동 기준이 정해져 있어 멘토가 달라도 점수가 크게 흔들리지 않습니다. 축은 정부 창업지원사업의 PSST 평가 구조(문제인식·실현가능성·성장전략·팀 구성)와 연결됩니다. 성장 단계가 높아지면 자금조달 준비도, GTM 엔진, 조직 스케일 모듈이 추가로 켜집니다.</p>
          <AxisMap />
          <div className="grid grid-2" style={{ marginTop: 24 }}>
            <div className="card" style={{ margin: 0 }}>
              <h3>증거등급과 점수 상한</h3>
              <EvidenceLadder />
            </div>
            <div className="card" style={{ margin: 0 }}>
              <h3>레드플래그 — 점수보다 우선합니다</h3>
              <p className="small muted">하나라도 켜지면 다른 점수와 상관없이 우선 개입 영역이 됩니다. 평균 점수는 치명적인 약점을 가리기 때문입니다.</p>
              {RED_FLAGS.map((f) => (
                <div key={f.code} className="row" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="ichip danger" style={{ width: 28, height: 28 }}><Icon name="flag" size={15} /></span>
                  <span className="small">{f.label}{f.code === 'runway' && ' (기본 6개월)'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="stages" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="eyebrow">단계와 관문</div>
          <h2 style={{ fontSize: 24 }}>업력이 아니라 증거로 단계를 판정합니다</h2>
          <p className="muted">창업 5년차라도 반복 매출이 없으면 S2로 봅니다. 다음 단계로 가려면 외부 검증 증거가 1건 이상 있어야 합니다. 딥테크·바이오·B2G는 매출 대신 PoC, 공동연구, 인허가 단계, 실증사업 선정을 증거로 인정합니다. 아래 수치는 초기 기준이며 파일럿 결과로 매년 개정합니다.</p>
          <div className="card"><StageGates /></div>
          <div className="alert info small"><Icon name="shield" size={16} /> 관문 통과 전에는 IR 자료를 만들지 않습니다. 지원사업 마감이 8주 이내이거나 런웨이가 6개월 미만일 때만 서류 대응 회차를 허용하고, 이때도 실험 카드 1개는 유지합니다.</div>
        </section>

        <section id="human" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="eyebrow">사람과 AI</div>
          <h2 style={{ fontSize: 24 }}>사람이 먼저 쓰고, AI는 보완합니다</h2>
          <p className="muted">AI만으로 자동화하면 최종 결과물만 남고 중간의 사고 과정이 빠집니다. 멘토링에서는 멘토와 멘티가 상황을 직접 파악해야 합니다. 그래서 핵심 칸은 사람만 쓸 수 있고, AI 결과를 가져올 때는 사람이 쓴 내용과 나란히 비교해 멘토가 확정합니다. 모든 기록에는 "사람 작성 / AI 초안 수정 / AI 초안 그대로"가 표시됩니다.</p>
          <HumanAiSplit />
        </section>

        <section id="panel" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="grid grid-2" style={{ alignItems: 'center', gap: 32 }}>
            <div>
              <div className="eyebrow">전문가 패널</div>
              <h2 style={{ fontSize: 24 }}>다섯 관점이 두 번 부딪힌 뒤에 멘토에게 갑니다</h2>
              <p className="muted">한 관점의 조언은 편향되기 쉽습니다. 종합 단계에서는 관점이 다른 다섯 전문가 페르소나가 독립 의견 → 쟁점 추출 → 교차 반론 → 종합 순서로 토론하고, 합의 수준(5/5, 3:2)과 남은 이견을 함께 남깁니다. 결정은 멘토가 하며, 멘티에게는 확정한 내용만 보입니다.</p>
              <p className="small faint">이 방법론의 표준화 v2도 같은 다섯 관점의 AI 패널 토론으로 검토했습니다. 실제 현장 파일럿을 통해 기준을 보정할 예정입니다.</p>
            </div>
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><PanelRing /></div>
              <table className="small">
                <tbody>{PANEL.map((p) => <tr key={p.code}><td><strong>{p.code}</strong> {p.name}</td><td className="muted">{p.view}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="kpi" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="eyebrow">성과 측정</div>
          <h2 style={{ fontSize: 24 }}>네 층위로 나눠 측정합니다</h2>
          <p className="muted">보고서는 성과 → 후속 성과 → 실행 → 품질 순서로 씁니다. 후속 성과만 보면 이미 잘 되는 기업만 골라 받는 왜곡이 생기므로, 처음 진단 대비 변화량으로 봅니다.</p>
          <KpiStack />
        </section>

        <section id="foundations" style={{ padding: '40px 0', scrollMarginTop: 110 }}>
          <div className="eyebrow">근거</div>
          <h2 style={{ fontSize: 24 }}>참고한 방법론 12가지와 적용한 곳</h2>
          <p className="muted">각 방법론에서 검증된 요소를 골라 Keep Mentor의 절차에 적용했습니다. 소개한 저자·기관과 제휴 관계는 없습니다.</p>
          {(['global', 'korea', 'coach'] as const).map((g) => (
            <div key={g} style={{ marginTop: 20 }}>
              <h3 className="row"><span className={`ichip ${g === 'korea' ? 'blue' : g === 'coach' ? 'warn' : ''}`} style={{ width: 28, height: 28 }}><Icon name={g === 'korea' ? 'building' : g === 'coach' ? 'users' : 'compass'} size={15} /></span>{GROUP_LABEL[g]}</h3>
              <div className="grid grid-3">
                {FOUNDATIONS.filter((f) => f.group === g).map((f) => (
                  <div key={f.id} className="fw-card">
                    <strong>{f.name}</strong>
                    <div className="src">{f.source}</div>
                    <div className="small">{f.idea}</div>
                    <div className="use"><strong>적용</strong> · {f.use}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="card row between" style={{ marginTop: 24 }}>
          <div><h3 style={{ margin: 0 }}>이 절차대로 멘토링을 시작하세요</h3><div className="small muted">멘토와 멘티 모두 같은 화면에서 진행 상황을 봅니다.</div></div>
          <Link href={me ? '/home' : '/login'} className="btn primary lg">{me ? '내 멘토링으로' : '로그인'} <Icon name="arrow" size={16} /></Link>
        </div>
      </div>
      <footer className="footer"><div className="wrap" style={{ padding: 0 }}>Keep Mentor · 방법론 표준화 v2 · 수치 기준은 초기안이며 파일럿 후 개정합니다.</div></footer>
    </>
  );
}
