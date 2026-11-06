import { Icon } from './icons';
import { AXES, CORE_QUESTIONS, EVIDENCE_TYPES, GRADE_CAP, STAGES, gatesFor } from '@/lib/methodology';
import { FLOW, KPI_LAYERS, PANEL } from '@/lib/method-content';

const E_COLORS = ['var(--e0)', 'var(--e1)', 'var(--e2)', 'var(--e3)', 'var(--e4)'];

// 6단계 전체 흐름
export function FlowStrip({ linkBase }: { linkBase?: string }) {
  return (
    <div className="flow">
      {FLOW.map((s) => {
        const inner = (
          <>
            <div className="row between"><span className="no">STEP {s.no}</span><span className="ichip"><Icon name={s.icon} /></span></div>
            <h3>{s.title}</h3>
            <div className="when">{s.when}</div>
            <p>{s.short}</p>
          </>
        );
        const cls = `fstep${s.id === 'exp' || s.id === 'run' ? ' loop' : ''}`;
        return linkBase ? <a key={s.id} href={`${linkBase}#${s.id}`} className={cls}>{inner}</a> : <div key={s.id} className={cls}>{inner}</div>;
      })}
    </div>
  );
}

// 증거등급 계단
export function EvidenceLadder() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'end' }}>
        {EVIDENCE_TYPES.map((t, i) => (
          <div key={t.code} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="xsmall muted" style={{ minHeight: 54 }}>{t.label}</div>
            <div style={{ height: 36 + i * 30, background: E_COLORS[i], borderRadius: 10, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10, color: i >= 2 ? '#fff' : 'var(--text)' }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{t.grade}</div>
              <div className="xsmall" style={{ fontWeight: 600 }}>최대 {GRADE_CAP[t.grade as keyof typeof GRADE_CAP]}점</div>
            </div>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>대표가 4점이라고 적어도 근거가 지인 인터뷰뿐이면 2점으로 확정됩니다. 자가진단은 흔히 부풀려지기 때문에, 근거의 종류가 점수의 상한을 정합니다. 단, 대표 주당 가용시간(M0)처럼 사실을 입력하는 문항은 상한을 걸지 않습니다.</p>
    </div>
  );
}

// 단계와 관문
export function StageGates({ industry = 'saas' }: { industry?: string }) {
  const gates = gatesFor(industry);
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, auto)', alignItems: 'stretch', minWidth: 760, gap: 0 }}>
        {STAGES.map((s, i) => (
          <div key={s.code} style={{ display: 'contents' }}>
            <div className="card flat" style={{ margin: 0, padding: 14, minWidth: 120, background: i === 0 ? 'var(--surface)' : `color-mix(in srgb, var(--accent) ${8 + i * 6}%, var(--surface))` }}>
              <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>{s.code}</div>
              <div style={{ fontWeight: 700 }}>{s.name}</div>
              <div className="xsmall muted" style={{ marginTop: 4 }}>{s.question}</div>
            </div>
            {i < gates.length + 0 && i < 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 6px', width: 120 }}>
                <div style={{ width: 22, height: 22, transform: 'rotate(45deg)', background: 'var(--navy)', borderRadius: 4, marginBottom: 8 }} />
                <div className="xsmall" style={{ textAlign: 'center', color: 'var(--text-2)', lineHeight: 1.4 }}>{gates[i].evidence}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 7축 진단 지도 (PSST 매핑 포함)
const PSST: Record<string, string> = { A2: 'Solution', A3: 'Team', A4: 'Scale-up', A5: 'Solution', A6: 'Problem', A7: 'Scale-up' };
export function AxisMap() {
  return (
    <div className="grid grid-3">
      <div className="card flat" style={{ margin: 0, background: 'var(--navy)', color: '#fff', border: 'none' }}>
        <div className="row"><span className="ichip" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}><Icon name="stairs" /></span><strong>① 성장단계</strong></div>
        <p className="small" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>S0~S4. 업력이 아니라 관문 증거로 판정합니다. 나머지 6개 축의 기대 수준을 정합니다.</p>
      </div>
      {AXES.map((a, i) => (
        <div key={a.code} className="card flat" style={{ margin: 0 }}>
          <div className="row between">
            <strong>{['②', '③', '④', '⑤', '⑥', '⑦'][i]} {a.name}</strong>
            <span className="badge blue">PSST · {PSST[a.code]}</span>
          </div>
          <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {CORE_QUESTIONS.filter((q) => q.axis === a.code).map((q) => <li key={q.code}><strong style={{ color: 'var(--text)' }}>{q.code}</strong> {q.text}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

// 실험 순환
export function ExperimentLoop() {
  const cx = 220, cy = 150, r = 105;
  const nodes = [
    { t: '가설', d: '누가 왜 돈을 내는가', x: cx, y: cy - r },
    { t: '실행 2주', d: '인터뷰·LOI·가격 테스트', x: cx + r + 30, y: cy },
    { t: '결과', d: '수치 + 배운 것', x: cx, y: cy + r },
    { t: '결정', d: 'Pivot·Persevere·Kill', x: cx - r - 30, y: cy },
  ];
  const arc = (a0: number, a1: number) => {
    const p = (a: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r].map((v) => v.toFixed(1)).join(' ');
    return `M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}`;
  };
  const d = Math.PI / 180;
  return (
    <svg viewBox="0 0 440 300" width="100%" style={{ maxWidth: 460 }} role="img" aria-label="실험 카드 순환: 가설, 실행, 결과, 결정">
      <defs>
        <marker id="lp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--accent)" />
        </marker>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent-soft)" strokeWidth="18" />
      {[[-62, -28], [28, 62], [118, 152], [208, 242]].map(([a, b2]) => (
        <path key={a} d={arc(a * d, b2 * d)} fill="none" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#lp-arrow)" />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)">2주 단위</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11.5" fill="var(--text-2)">회차 = 실험 1순환</text>
      {nodes.map((n) => (
        <g key={n.t}>
          <rect x={n.x - 72} y={n.y - 25} width="144" height="50" rx="10" fill="var(--surface)" stroke="var(--border-strong)" />
          <text x={n.x} y={n.y - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)">{n.t}</text>
          <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize="10.5" fill="var(--text-2)">{n.d}</text>
        </g>
      ))}
    </svg>
  );
}

// 사람과 AI의 역할
export function HumanAiSplit() {
  return (
    <div className="side-by-side">
      <div className="panel human" style={{ padding: 18 }}>
        <div className="panel-label" style={{ color: 'var(--accent)' }}><Icon name="pen" size={16} /> 사람이 직접 쓰는 것 — 비어 있으면 다음 단계로 못 갑니다</div>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>멘티: 이슈 서술 3칸, 실험 결과와 배운 것</li>
          <li>멘토: AI 브리핑 전 "내가 보는 병목 1줄"</li>
          <li>멘토: 회차 직후 핵심 3줄, 다음에 확인할 것</li>
          <li>멘티: 회차마다 "내가 이해한 핵심"과 "이번 2주에 할 일"</li>
          <li>멘토: 단계 전환 근거, 패널 의견에 대한 결정</li>
        </ul>
      </div>
      <div className="panel ai" style={{ padding: 18 }}>
        <div className="panel-label" style={{ color: 'var(--ai)' }}><Icon name="sparkle" size={16} /> AI가 돕는 것 — 초안이며 멘토가 확정합니다</div>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
          <li>사전 브리핑, 회차 일지, 실험 카드 초안</li>
          <li>증거등급 판정 검토</li>
          <li>종합 리포트, 90일 로드맵, 투자메모 초안</li>
          <li>5인 전문가 패널 토론</li>
          <li>앱은 AI를 직접 호출하지 않습니다. 익명화된 패킷을 멘토가 Claude 프로젝트에서 처리합니다.</li>
        </ul>
      </div>
    </div>
  );
}

// 전문가 패널
export function PanelRing() {
  const cx = 200, cy = 150, r = 110;
  return (
    <svg viewBox="0 0 400 300" width="100%" style={{ maxWidth: 460 }} role="img" aria-label="전문가 5인 패널과 사회자">
      {PANEL.map((p, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / PANEL.length;
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        return (
          <g key={p.code}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border-strong)" strokeDasharray="3 4" />
            <circle cx={x} cy={y} r="30" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
            <text x={x} y={y - 2} textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--accent)">{p.code}</text>
            <text x={x} y={y + 12} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--text)">{p.name}</text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="34" fill="var(--navy)" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff">사회자</text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.75)">쟁점 · 종합</text>
    </svg>
  );
}

// 성과지표 4층
export function KpiStack() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {KPI_LAYERS.map((k, i) => (
        <div key={k.level} style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 16px', borderRadius: 12, background: i === 0 ? 'var(--accent)' : 'var(--surface)', color: i === 0 ? '#fff' : 'var(--text)', border: i === 0 ? 'none' : '1px solid var(--border)', marginLeft: i * 8, marginRight: i * 8 }}>
          <strong>{k.level}</strong>
          <div className="small"><div>{k.metric}</div><div style={{ opacity: 0.75 }}>{k.note}</div></div>
          <span className="badge" style={i === 0 ? { background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'transparent' } : undefined}>Kirkpatrick · {k.kirk}</span>
        </div>
      ))}
    </div>
  );
}

// 증거등급 분포 막대 (앱 내부용)
export function EvidenceBar({ grades }: { grades: string[] }) {
  const counts = ['E0', 'E1', 'E2', 'E3', 'E4'].map((g) => grades.filter((x) => x === g).length);
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return <div className="small faint">진단 응답이 없습니다.</div>;
  return (
    <div>
      <div className="ebar">
        {counts.map((c, i) => c > 0 && <span key={i} style={{ width: `${(c / total) * 100}%`, background: E_COLORS[i] }} title={`E${i}: ${c}`} />)}
      </div>
      <div className="row xsmall muted" style={{ marginTop: 6, gap: 10 }}>
        {counts.map((c, i) => <span key={i} className="row" style={{ gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: E_COLORS[i], display: 'inline-block' }} />E{i} {c}</span>)}
      </div>
    </div>
  );
}
