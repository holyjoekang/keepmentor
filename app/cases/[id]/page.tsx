'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Icon } from '@/components/icons';
import { PubFooter, PubNav, useOptionalMe } from '@/components/Public';
import { CasesLock } from '@/components/CasesLock';
import { stageName, trackName, useCases } from '@/lib/cases';

const GROW = [
  { k: 'goal', t: 'Goal', d: '세션 목표' },
  { k: 'reality', t: 'Reality', d: '현실 확인' },
  { k: 'options', t: 'Options', d: '선택지' },
  { k: 'will', t: 'Will', d: '대표의 결정' },
] as const;

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const me = useOptionalMe();
  const { data, error, locked, reload } = useCases();
  const cid = decodeURIComponent(id);
  const idx = data?.cases.findIndex((c) => c.id === cid) ?? -1;
  const c = data && idx >= 0 ? data.cases[idx] : null;
  const prev = data && idx > 0 ? data.cases[idx - 1] : null;
  const next = data && idx >= 0 && idx < data.cases.length - 1 ? data.cases[idx + 1] : null;
  const sf = c?.session_flow;

  return (
    <div className="pub">
      <PubNav me={me} />
      {locked && <CasesLock codeEnabled={locked.codeEnabled} onUnlocked={reload} />}
      {error && <div className="pw"><div className="alert error">{error}</div></div>}
      {data && !c && <div className="pw" style={{ padding: 48 }}><div className="card">사례를 찾을 수 없습니다. <Link href="/cases">사례집으로</Link></div></div>}
      {data && c && (
        <>
          <section className="ed-sec ink" style={{ paddingTop: 56, paddingBottom: 56 }}>
            <div className="pw" style={{ maxWidth: 980 }}>
              <div className="xsmall" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>
                <Link href="/cases" style={{ color: 'rgba(255,255,255,0.75)' }}>사례집</Link> / {c.id}
              </div>
              <div className="row" style={{ gap: 6 }}>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'transparent' }}>{c.category}</span>
                {c.stage && <span className="badge" style={{ background: 'var(--dawn)', color: '#241800', borderColor: 'transparent' }}>{c.stage} {stageName(data, c.stage)}</span>}
                {c.track && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'transparent' }}>{trackName(data, c.track)}</span>}
                {c.km_stage && <span className="badge" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'transparent' }}>Keep Mentor 단계 {c.km_stage}</span>}
              </div>
              <h1 className="serif" style={{ fontSize: 'clamp(26px, 3.6vw, 40px)', color: '#fff', margin: '16px 0 22px' }}>{c.title}</h1>
              <blockquote className="serif" style={{ margin: 0, padding: '4px 0 4px 20px', borderLeft: '3px solid var(--dawn)', fontSize: 19, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
                “{c.founder_says}”
                <div className="small" style={{ fontFamily: 'inherit', color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>— 대표의 말</div>
              </blockquote>
            </div>
          </section>

          <section className="ed-sec" style={{ paddingTop: 56 }}>
            <div className="pw" style={{ maxWidth: 980 }}>
              <div className="side-by-side" style={{ gap: 20 }}>
                <div className="panel" style={{ padding: 20, borderRadius: 4 }}>
                  <div className="panel-label"><Icon name="search" size={15} /> 겉으로 보이는 문제</div>
                  <p style={{ margin: 0 }}>{c.surface}</p>
                </div>
                <div className="panel" style={{ padding: 20, borderRadius: 4, background: 'var(--dawn-soft)' }}>
                  <div className="panel-label" style={{ color: '#8a5a00' }}><Icon name="target" size={15} /> 근본 원인</div>
                  <p style={{ margin: 0 }}>{c.root}</p>
                </div>
              </div>

              {!!c.diagnostic_questions?.length && (
                <Block kicker="Diagnose" title="진단 질문">
                  <ol className="ed-list" style={{ borderTop: 'none' }}>
                    {c.diagnostic_questions.map((q, i) => <li key={q}><span className="n">Q{i + 1}</span><div><p style={{ color: 'var(--text)', fontSize: 16 }}>{q}</p></div></li>)}
                  </ol>
                </Block>
              )}

              {sf && (
                <Block kicker="Session · GROW" title="세션 진행">
                  <div className="grid grid-4" style={{ gap: 14 }}>
                    {GROW.map((g, i) => {
                      const v = sf[g.k];
                      return (
                        <div key={g.k} style={{ borderTop: `3px solid ${i === 3 ? 'var(--dawn)' : 'var(--accent)'}`, paddingTop: 14 }}>
                          <div className="xsmall" style={{ fontWeight: 800, color: i === 3 ? '#8a5a00' : 'var(--accent)', letterSpacing: '0.08em' }}>{g.t.toUpperCase()}</div>
                          <div style={{ fontWeight: 700, margin: '2px 0 8px' }}>{g.d}</div>
                          {Array.isArray(v)
                            ? <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{v.map((x) => <li key={x} style={{ margin: '4px 0' }}>{x}</li>)}</ul>
                            : <p className="small" style={{ margin: 0 }}>{v}</p>}
                        </div>
                      );
                    })}
                  </div>
                </Block>
              )}

              {c.prescription && (
                <Block kicker="Prescription" title="처방">
                  <p style={{ fontSize: 16.5, lineHeight: 1.75 }}>{c.prescription}</p>
                </Block>
              )}

              {!!c.two_week_tasks?.length && (
                <Block kicker="2-week experiment" title="2주 과제">
                  <table>
                    <thead><tr><th style={{ width: 40 }}>#</th><th>과제</th><th>성공 기준</th></tr></thead>
                    <tbody>{c.two_week_tasks.map((t, i) => <tr key={t.task}><td><strong>{i + 1}</strong></td><td>{t.task}</td><td className="muted">{t.success}</td></tr>)}</tbody>
                  </table>
                </Block>
              )}

              <div className="side-by-side" style={{ gap: 20, marginTop: 40 }}>
                {c.success_signal && (
                  <div className="panel human" style={{ padding: 20, borderRadius: 4 }}>
                    <div className="panel-label" style={{ color: 'var(--green)' }}><Icon name="check" size={15} /> 성공 신호</div>
                    <p style={{ margin: 0 }}>{c.success_signal}</p>
                  </div>
                )}
                {c.mentor_pitfall && (
                  <div className="panel" style={{ padding: 20, borderRadius: 4, background: 'var(--danger-soft)' }}>
                    <div className="panel-label" style={{ color: 'var(--danger)' }}><Icon name="flag" size={15} /> 멘토가 빠지기 쉬운 함정</div>
                    <p style={{ margin: 0 }}>{c.mentor_pitfall}</p>
                  </div>
                )}
              </div>

              {!!c.dialogue?.length && (
                <Block kicker="Dialogue" title="세션 대화 재연">
                  <p className="small muted">에이전트 시뮬레이션으로 재연한 대화입니다.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {c.dialogue.map((d, i) => {
                      const mentor = d.who === '멘토';
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: mentor ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '78%', padding: '12px 16px', borderRadius: 14, background: mentor ? 'var(--accent)' : 'var(--surface-2)', color: mentor ? '#fff' : 'var(--text)', borderTopLeftRadius: mentor ? 14 : 4, borderTopRightRadius: mentor ? 4 : 14 }}>
                            <div className="xsmall" style={{ fontWeight: 700, opacity: 0.75, marginBottom: 4 }}>{d.who || '—'}</div>
                            <div style={{ fontSize: 15 }}>{d.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Block>
              )}

              {!!c.resources?.length && (
                <Block kicker="Resources" title="참고 자료">
                  <ul className="small" style={{ paddingLeft: 18 }}>{c.resources.map((r) => <li key={r} style={{ margin: '5px 0' }}>{r.split(/(https:\/\/[^\s]+)/g).map((part, i) => part.startsWith('https://') ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part)}</li>)}</ul>
                </Block>
              )}

              <div className="card flat" style={{ marginTop: 48, borderRadius: 4, borderLeft: '4px solid var(--accent)' }}>
                <div className="row between">
                  <div>
                    <strong>Keep Mentor에서는 이렇게 이어집니다</strong>
                    <p className="small muted" style={{ margin: '4px 0 0' }}>근본 원인은 진단 리포트의 병목으로, 2주 과제는 실험 카드로, 성공 신호는 증거등급 상승으로 기록합니다.</p>
                  </div>
                  <Link href="/#exp" className="btn">실험 카드 보기</Link>
                </div>
              </div>

              <div className="row between" style={{ marginTop: 32, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                {prev ? <Link href={`/cases/${encodeURIComponent(prev.id)}`} className="small">← {prev.id} {prev.title}</Link> : <span />}
                {next ? <Link href={`/cases/${encodeURIComponent(next.id)}`} className="small" style={{ textAlign: 'right' }}>{next.id} {next.title} →</Link> : <span />}
              </div>
              <p className="xsmall faint" style={{ marginTop: 24 }}>{c.id.startsWith('WEB-') ? '공개 자료를 바탕으로 재구성한 교육용 사례입니다. 실제 기업 기록이나 성과가 아니며, 개별 근거는 위 참고 자료에서 확인하세요. 기존 사례집: ' : '에이전트 시뮬레이션 사례이며 실제 기업의 기록이 아닙니다. 출처: '} <a href={data.source.url} target="_blank" rel="noopener">{data.source.name}</a></p>
            </div>
          </section>
        </>
      )}
      <PubFooter />
    </div>
  );
}

function Block({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 48 }}>
      <div className="ed-kicker">{kicker}</div>
      <h2 className="serif" style={{ fontSize: 26, margin: '10px 0 18px' }}>{title}</h2>
      {children}
    </div>
  );
}
