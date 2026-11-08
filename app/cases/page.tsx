'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { PubFooter, PubNav, useOptionalMe } from '@/components/Public';
import { CasesLock } from '@/components/CasesLock';
import { stageName, trackName, useCases, type CaseTrack } from '@/lib/cases';

export default function CasesPage() {
  const me = useOptionalMe();
  const { data, error, locked, reload } = useCases();
  const [stage, setStage] = useState<string>('all');
  const [track, setTrack] = useState<string>('all');
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('stage')) setStage(p.get('stage')!);
    if (p.get('track')) setTrack(p.get('track')!);
  }, []);

  const cats = useMemo(() => (data ? Array.from(new Set(data.cases.map((c) => c.category))) : []), [data]);
  const list = useMemo(() => {
    if (!data) return [];
    const k = q.trim().toLowerCase();
    return data.cases.filter((c) =>
      (stage === 'all' || c.stage === stage || (c.applies_to ?? []).includes(stage)) &&
      (track === 'all' || (track === 'stage' ? !c.track : c.track === track)) &&
      (cat === 'all' || c.category === cat) &&
      (!k || [c.title, c.founder_says, c.root, c.prescription].join(' ').toLowerCase().includes(k)));
  }, [data, stage, track, cat, q]);
  const curStage = data?.stages.find((s) => s.code === stage);

  return (
    <div className="pub">
      <PubNav me={me} />
      <section className="ed-hero" style={{ backgroundImage: 'url(/images/experiment.jpg)', minHeight: 520 }}>
        <div className="pw">
          <div className="ed-kicker">Case Library</div>
          <h1 className="serif" style={{ marginTop: 18 }}>대표가 가져오는 질문,<br />멘토가 풀어 가는 과정.</h1>
          <p className="lead">고객 검증부터 AI 품질, 결제, 개발·운영까지 멘티들이 반복해서 겪는 문제를 다룹니다. 공개 자료와 기존 방법론을 바탕으로 원인 가설, 진단 질문, 2주 실행 과제와 확인할 증거를 정리했습니다. 사례는 교육용 재구성이며 각 사례의 출처를 함께 확인하세요.</p>
          <div className="ed-facts">
            <div><strong>{data ? data.cases.length : '–'}건</strong><span>멘토링 사례</span></div>
            <div><strong>{data ? data.stages.length : '–'}단계</strong><span>문제 탐색부터 확장까지</span></div>
            <div><strong>{data ? data.tracks.length : '–'}개 트랙</strong><span>B2B·PoC, 멘토링 운영</span></div>
            <div><strong>{data ? data.cases.filter((c) => c.dialogue?.length).length : '–'}건</strong><span>세션 대화 재연 포함</span></div>
          </div>
        </div>
      </section>

      {locked && <CasesLock codeEnabled={locked.codeEnabled} onUnlocked={reload} />}
      {!locked && <section className="ed-sec" style={{ paddingTop: 48 }}>
        <div className="pw">
          <div className="alert info" style={{ marginBottom: 28 }}>
            <Icon name="shield" size={18} />
            <div className="small">
              에이전트 시뮬레이션으로 만든 대표 사례입니다. 국내외 멘토링 베스트 프랙티스와 공공 스케일업 멘토링 의뢰 조건을 바탕으로 했으며, 실제 기업의 기록이 아닙니다.
              {data?.source.note && <> {data.source.note}</>} 출처: <a href={data?.source.url ?? '#'} target="_blank" rel="noopener">{data?.source.name ?? 'Joyhouse 스타트업 멘토링'}</a>{data?.source.edition && ` (${data.source.edition})`}
            </div>
          </div>

          {error && <div className="alert error">{error}</div>}
          {data && (
            <>
              <div className="row" style={{ gap: 6, marginBottom: 10 }}>
                <span className="small" style={{ fontWeight: 700, width: 48 }}>단계</span>
                <Chip on={stage === 'all'} onClick={() => setStage('all')}>전체</Chip>
                {data.stages.map((s) => <Chip key={s.code} on={stage === s.code} onClick={() => setStage(s.code)}>{s.code} {s.name}</Chip>)}
              </div>
              <div className="row" style={{ gap: 6, marginBottom: 10 }}>
                <span className="small" style={{ fontWeight: 700, width: 48 }}>트랙</span>
                <Chip on={track === 'all'} onClick={() => setTrack('all')}>전체</Chip>
                <Chip on={track === 'stage'} onClick={() => setTrack('stage')}>단계별 사례</Chip>
                {data.tracks.map((t) => <Chip key={t.code} on={track === t.code} onClick={() => setTrack(t.code)}>{t.name}</Chip>)}
              </div>
              <div className="row" style={{ gap: 10, marginBottom: 24 }}>
                <span className="small" style={{ fontWeight: 700, width: 48 }}>분류</span>
                <select value={cat} onChange={(e) => setCat(e.target.value)} style={{ width: 'auto' }}>
                  <option value="all">전체 분류</option>
                  {cats.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="검색: 지인 인터뷰, PoC, 지분 …" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
                <span className="small muted">{list.length}건</span>
              </div>

              {curStage && (
                <div className="card flat" style={{ borderRadius: 4, borderLeft: '4px solid var(--accent)', marginBottom: 24 }}>
                  <div className="row between">
                    <h3 className="serif" style={{ fontSize: 22, margin: 0 }}>{curStage.code} {curStage.name}</h3>
                    <span className="badge blue">Keep Mentor 단계 {curStage.km_stage}</span>
                  </div>
                  <p style={{ margin: '8px 0', fontWeight: 600 }}>{curStage.question}</p>
                  <div className="grid grid-3" style={{ gap: 16 }}>
                    <div><div className="xsmall muted" style={{ fontWeight: 700 }}>이 단계의 대표</div><p className="small">{curStage.persona}</p></div>
                    <div><div className="xsmall muted" style={{ fontWeight: 700 }}>졸업 증거</div><p className="small">{curStage.exit}</p></div>
                    <div><div className="xsmall muted" style={{ fontWeight: 700 }}>핵심 교훈</div><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{curStage.takeaways.map((t) => <li key={t}>{t}</li>)}</ul></div>
                  </div>
                </div>
              )}

              <div className="grid grid-3" style={{ gap: 20 }}>
                {list.map((c) => (
                  <Link key={c.id} href={`/cases/${encodeURIComponent(c.id)}`} className="card link" style={{ margin: 0, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="row between">
                      <span className="xsmall faint" style={{ fontWeight: 700 }}>{c.id}</span>
                      <span className="row" style={{ gap: 4 }}>
                        {c.track && <span className="badge ai">{trackName(data, c.track)}</span>}
                        {c.stage && <span className="badge blue">{c.stage}</span>}
                      </span>
                    </div>
                    <span className="badge" style={{ alignSelf: 'flex-start' }}>{c.category}</span>
                    <h3 className="serif" style={{ fontSize: 18, lineHeight: 1.4, margin: 0 }}>{c.title}</h3>
                    <p className="small muted" style={{ margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{c.founder_says}”</p>
                    <div className="row xsmall muted" style={{ marginTop: 'auto', paddingTop: 8 }}>
                      {c.stage && <span>{stageName(data, c.stage)}</span>}
                      {!!c.dialogue?.length && <span className="badge accent">대화 재연</span>}
                    </div>
                  </Link>
                ))}
              </div>
              {!list.length && <div className="card muted">조건에 맞는 사례가 없습니다.</div>}
            </>
          )}
        </div>
      </section>}

      {data && data.tracks.map((t) => <TrackSection key={t.code} t={t} />)}
      <PubFooter />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, background: on ? 'var(--accent)' : 'var(--surface)', color: on ? '#fff' : 'var(--text)', borderColor: on ? 'var(--accent)' : 'var(--border-strong)' }}>
      {children}
    </button>
  );
}

function TrackSection({ t }: { t: CaseTrack }) {
  const pb = t.poc_playbook;
  return (
    <section className="ed-sec tint" id={`track-${t.code}`}>
      <div className="pw">
        <div className="ed-kicker">Playbook</div>
        <h2 className="ed-h2 serif">{t.name}</h2>
        <p className="ed-intro">{t.summary}</p>
        {pb && (
          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            {(['before', 'during', 'after'] as const).map((k) => (
              <div key={k} style={{ borderTop: '2px solid var(--text)', paddingTop: 16 }}>
                <h4 style={{ fontSize: 17, margin: '0 0 10px' }}>PoC {k === 'before' ? '시작 전' : k === 'during' ? '진행 중' : '종료 후'}</h4>
                <ul className="small" style={{ paddingLeft: 18, margin: 0 }}>{pb[k].map((x) => <li key={x} style={{ margin: '6px 0' }}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        )}
        {t.proposal_outline && (
          <div className="card flat" style={{ borderRadius: 4, marginBottom: 32 }}>
            <h4 style={{ fontSize: 17, margin: '0 0 10px' }}>PoC 제안서 1장 구성</h4>
            <ol className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>{t.proposal_outline.map((x) => <li key={x} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>{x}</li>)}</ol>
          </div>
        )}
        {t.short_program && (
          <div className="grid grid-3" style={{ marginBottom: 32 }}>
            {t.short_program.map((s) => (
              <div key={s.session} className="card flat" style={{ margin: 0, borderRadius: 4, borderTop: '4px solid var(--accent)' }}>
                <h4 className="serif" style={{ fontSize: 20, margin: '0 0 6px' }}>{s.session}</h4>
                <p className="small" style={{ fontWeight: 600 }}>{s.goal}</p>
                {s.flow && <ul className="small muted" style={{ paddingLeft: 18, margin: 0 }}>{s.flow.map((x) => <li key={x} style={{ margin: '5px 0' }}>{x}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}
        {t.report_example && (
          <div className="card flat" style={{ borderRadius: 4, marginBottom: 32 }}>
            <h4 style={{ fontSize: 17, margin: '0 0 6px' }}>수행보고서 예시 (가상 기업 A사)</h4>
            <table className="small"><tbody>{Object.entries(t.report_example).map(([k, v]) => <tr key={k}><th style={{ width: 180, textTransform: 'none', letterSpacing: 0 }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
          </div>
        )}
        <ul className="ed-list">{t.takeaways.map((x, i) => <li key={x}><span className="n">0{i + 1}</span><div><p style={{ color: 'var(--text)' }}>{x}</p></div></li>)}</ul>
        <div style={{ marginTop: 20 }}><a href={`/cases?track=${t.code}`} className="textlink" onClick={(e) => { e.preventDefault(); window.location.href = `/cases?track=${t.code}`; }}>이 트랙의 사례 보기 <Icon name="arrow" size={15} /></a></div>
      </div>
    </section>
  );
}
