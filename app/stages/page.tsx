'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { PubFooter, PubNav, useOptionalMe } from '@/components/Public';
import { StageGates } from '@/components/visuals';
import { STAGES } from '@/lib/methodology';
import { FURTHER_READING, JOURNEYS, STAGE_GUIDE, type Journey } from '@/lib/journeys';

const stageOf = (code: string) => STAGES.find((s) => s.code === code);

export default function StagesPage() {
  const me = useOptionalMe();
  return (
    <div className="pub">
      <PubNav me={me} />

      <section className="ed-hero" style={{ backgroundImage: 'url(/images/city.jpg)', minHeight: 520 }}>
        <div className="pw">
          <div className="ed-kicker">For Mentees</div>
          <h1 className="serif" style={{ marginTop: 18 }}>우리 회사는 지금<br />어느 단계에 있을까.</h1>
          <p className="lead">스타트업의 단계는 업력이 아니라 증거로 정해집니다. 단계마다 답해야 할 질문과 다음 관문을 확인하고, 먼저 그 길을 지나간 기업의 선택을 단계별로 살펴보세요. 멘토링 1차 미팅 전에 읽어 오면 좋습니다.</p>
          <div className="ed-facts">
            <div><strong>5단계</strong><span>아이디어부터 스케일업까지</span></div>
            <div><strong>4개</strong><span>다음 단계로 가는 관문</span></div>
            <div><strong>{JOURNEYS.length}곳</strong><span>선배 기업의 단계별 여정</span></div>
            <div><strong>{JOURNEYS.reduce((n, j) => n + j.sources.length, 0)}건</strong><span>공개 출처</span></div>
          </div>
        </div>
      </section>

      <section className="ed-sec" id="map">
        <div className="pw">
          <div className="ed-kicker">Stage map</div>
          <h2 className="ed-h2 serif">단계마다 답해야 할 질문이 다릅니다</h2>
          <p className="ed-intro">창업 5년차라도 반복 매출이 없으면 S2입니다. 다음 단계로 넘어가려면 마름모(관문)에 적힌 외부 증거가 있어야 합니다. 아래 기준은 SaaS 기준이며, 딥테크·바이오·B2G는 매출 대신 PoC·실증 선정 등을 증거로 봅니다.</p>
          <div className="card" style={{ borderRadius: 4 }}><StageGates industry="saas" /></div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 32 }}>
            {STAGE_GUIDE.map((g) => {
              const s = stageOf(g.code);
              return (
                <div key={g.code} id={`stage-${g.code}`} style={{ borderTop: '3px solid var(--accent)', paddingTop: 14, scrollMarginTop: 90 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong style={{ fontSize: 22, color: 'var(--accent)' }}>{g.code}</strong>
                    <strong style={{ fontSize: 17 }}>{s?.name}</strong>
                  </div>
                  <p className="small" style={{ fontWeight: 600, margin: '6px 0 10px' }}>{s?.question}</p>
                  <div className="xsmall muted" style={{ fontWeight: 700 }}>집중할 일</div>
                  <ul className="small" style={{ paddingLeft: 18, margin: '4px 0 10px' }}>{g.doNow.map((x) => <li key={x} style={{ margin: '3px 0' }}>{x}</li>)}</ul>
                  <div className="xsmall muted" style={{ fontWeight: 700 }}>흔한 함정</div>
                  <ul className="small muted" style={{ paddingLeft: 18, margin: '4px 0 10px' }}>{g.traps.map((x) => <li key={x} style={{ margin: '3px 0' }}>{x}</li>)}</ul>
                  <div className="card flat small" style={{ margin: 0, padding: 12, borderRadius: 4, background: 'var(--blue-soft)' }}>
                    <Icon name="compass" size={14} /> {g.selfCheck}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {JOURNEYS.map((j) => <JourneySection key={j.id} j={j} />)}

      <section className="ed-sec">
        <div className="pw">
          <div className="ed-kicker">How to use</div>
          <h2 className="ed-h2 serif">멘토링에 이렇게 가져오세요</h2>
          <ul className="ed-list">
            <li><span className="n">01</span><div><h4>내 단계를 먼저 표시합니다</h4><p>위 단계 지도에서 지금 단계와 그 근거(증거) 한 줄을 적습니다. 근거가 대표 의견뿐이라면 한 단계 아래로 봅니다.</p></div></li>
            <li><span className="n">02</span><div><h4>선배 기업의 같은 단계를 읽습니다</h4><p>내 단계와 같은 구간에서 그 회사가 무엇을 결정했고 무엇을 포기했는지 봅니다. 정답이 아니라 비교 대상입니다.</p></div></li>
            <li><span className="n">03</span><div><h4>질문 하나를 골라 옵니다</h4><p>사례 끝의 "우리 회사에 던질 질문" 중 하나를 골라 사전진단 이슈 칸에 적어 오면, 1차 미팅을 그 질문으로 시작합니다.</p></div></li>
          </ul>
          <div className="row" style={{ marginTop: 28, gap: 12 }}>
            <Link href="/#stages" className="btn">단계 판정 기준 자세히 <Icon name="arrow" size={15} /></Link>
            <Link href="/cases" className="btn">멘토링 사례집</Link>
          </div>
        </div>
      </section>

      <PubFooter />
    </div>
  );
}

function JourneySection({ j }: { j: Journey }) {
  const [only, setOnly] = useState<string>('all');
  const steps = j.steps.filter((s) => only === 'all' || s.stage === only);
  const stagesInJourney = Array.from(new Set(j.steps.map((s) => s.stage)));
  const more = FURTHER_READING[j.id] ?? [];
  return (
    <section className="ed-sec tint" id={`journey-${j.id}`}>
      <div className="pw">
        <div className="ed-kicker">Founder journey</div>
        <h2 className="ed-h2 serif">{j.company} · {j.product}</h2>
        <div className="row" style={{ gap: 8, marginBottom: 12 }}><span className="badge blue">{j.industry}</span><span className="badge">단계별 여정</span></div>
        <p className="ed-intro" style={{ marginBottom: 24 }}>{j.oneLiner}</p>

        <div className="grid grid-4" style={{ marginBottom: 32 }}>
          {j.facts.map((f) => (
            <div key={f.label} style={{ borderTop: '2px solid var(--text)', paddingTop: 10 }}>
              <div className="xsmall muted" style={{ fontWeight: 700 }}>{f.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 20 }}>
          <span className="small" style={{ fontWeight: 700 }}>단계</span>
          <Chip on={only === 'all'} onClick={() => setOnly('all')}>전체</Chip>
          {stagesInJourney.map((c) => <Chip key={c} on={only === c} onClick={() => setOnly(c)}>{c} {stageOf(c)?.name}</Chip>)}
        </div>

        <div className="timeline">
          {steps.map((s) => (
            <div key={s.period + s.title} className="item">
              <div className="card" style={{ margin: 0, borderRadius: 4 }}>
                <div className="row between" style={{ gap: 8 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="badge solid">{s.stage} {stageOf(s.stage)?.name}</span>
                    <span className="small muted" style={{ fontWeight: 700 }}>{s.period}</span>
                  </div>
                </div>
                <h3 className="serif" style={{ fontSize: 21, margin: '10px 0 8px' }}>{s.title}</h3>
                <ul className="small" style={{ paddingLeft: 18, margin: '0 0 14px' }}>{s.happened.map((x) => <li key={x} style={{ margin: '5px 0' }}>{x}</li>)}</ul>
                <div className="grid grid-2" style={{ gap: 12 }}>
                  <div className="card flat" style={{ margin: 0, padding: 12, borderRadius: 4 }}>
                    <div className="xsmall" style={{ fontWeight: 700, color: 'var(--accent)' }}>핵심 의사결정</div>
                    <p className="small" style={{ margin: '4px 0 0' }}>{s.decision}</p>
                  </div>
                  <div className="card flat" style={{ margin: 0, padding: 12, borderRadius: 4, background: 'var(--blue-soft)' }}>
                    <div className="xsmall" style={{ fontWeight: 700, color: 'var(--blue)' }}>멘티가 가져갈 교훈</div>
                    <p className="small" style={{ margin: '4px 0 0' }}>{s.lesson}</p>
                  </div>
                </div>
                {s.evidence && <p className="xsmall muted" style={{ margin: '10px 0 0' }}><Icon name="shield" size={12} /> 증거 관점: {s.evidence}</p>}
                <p className="xsmall faint" style={{ margin: '6px 0 0' }}>출처: {s.sources.map((i) => <a key={i} href={`#src-${j.id}-${i + 1}`} style={{ marginRight: 6 }}>[{i + 1}]</a>)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="card flat" style={{ borderRadius: 4, borderLeft: '4px solid var(--dawn)', marginTop: 12 }}>
          <h4 style={{ fontSize: 17, margin: '0 0 8px' }}>우리 회사에 던질 질문</h4>
          <ol className="small" style={{ margin: 0, paddingLeft: 20 }}>{j.menteeQuestions.map((q) => <li key={q} style={{ margin: '6px 0' }}>{q}</li>)}</ol>
        </div>

        <details style={{ marginTop: 20 }}>
          <summary className="small" style={{ cursor: 'pointer', fontWeight: 700 }}>출처 {j.sources.length}건{more.length ? ` · 추가 읽을거리 ${more.length}건` : ''}</summary>
          <ol className="xsmall" style={{ paddingLeft: 22, marginTop: 10 }}>
            {j.sources.map((s, i) => (
              <li key={i} id={`src-${j.id}-${i + 1}`} style={{ margin: '4px 0', scrollMarginTop: 90 }}>
                <a href={s.url} target="_blank" rel="noopener">{s.title}</a> <span className="muted">— {s.outlet}{s.date !== '-' ? `, ${s.date}` : ''}</span>
              </li>
            ))}
          </ol>
          {!!more.length && (
            <ul className="xsmall" style={{ paddingLeft: 22 }}>{more.map((m) => <li key={m.url}><a href={m.url} target="_blank" rel="noopener">{m.title}</a></li>)}</ul>
          )}
        </details>
        <p className="xsmall muted" style={{ marginTop: 12 }}>{j.note}</p>
      </div>
    </section>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--text)', borderColor: on ? 'var(--accent)' : 'var(--border-strong)' }}>
      {children}
    </button>
  );
}
