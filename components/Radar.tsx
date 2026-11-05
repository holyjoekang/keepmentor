import { AXES, type AxisCode } from '@/lib/methodology';

type Scores = Record<AxisCode, number | null>;

// 축 6개 레이더 차트: 멘티 자가진단 vs 멘토 보정
export function Radar({ self, mentor }: { self: Scores; mentor: Scores }) {
  const size = 300, c = size / 2, r = 105;
  const n = AXES.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [c + Math.cos(a) * (r * v) / 5, c + Math.sin(a) * (r * v) / 5];
  };
  const poly = (s: Scores) => AXES.map((ax, i) => pt(i, s[ax.code] ?? 0).join(',')).join(' ');
  const hasMentor = AXES.some((a) => mentor[a.code] !== null);
  const hasSelf = AXES.some((a) => self[a.code] !== null);
  return (
    <div>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 340 }} role="img" aria-label="축별 진단 점수">
        {[1, 2, 3, 4, 5].map((lv) => (
          <polygon key={lv} points={AXES.map((_, i) => pt(i, lv).join(',')).join(' ')} fill="none" stroke="var(--border)" />
        ))}
        {AXES.map((ax, i) => {
          const [x, y] = pt(i, 5.9);
          const [lx, ly] = pt(i, 5);
          return (
            <g key={ax.code}>
              <line x1={c} y1={c} x2={lx} y2={ly} stroke="var(--border)" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11.5" fill="var(--text-2)">{ax.name}</text>
            </g>
          );
        })}
        {hasSelf && <polygon points={poly(self)} fill="var(--warn)" fillOpacity="0.12" stroke="var(--warn)" strokeWidth="1.5" strokeDasharray="4 3" />}
        {hasMentor && <polygon points={poly(mentor)} fill="var(--accent)" fillOpacity="0.18" stroke="var(--accent)" strokeWidth="2" />}
      </svg>
      <div className="row small">
        <span className="badge warn">점선: 멘티 자가진단</span>
        <span className="badge accent">실선: 멘토 보정</span>
      </div>
    </div>
  );
}
