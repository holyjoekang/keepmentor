import { STAGES } from '@/lib/methodology';

export function StageBar({ stage }: { stage?: string }) {
  const idx = STAGES.findIndex((s) => s.code === stage);
  return (
    <div>
      <div className="stagebar">{STAGES.map((s, i) => <span key={s.code} className={i <= idx ? 'on' : ''} />)}</div>
      <div className="stagebar-labels">{STAGES.map((s) => <span key={s.code} style={s.code === stage ? { color: 'var(--accent)', fontWeight: 700 } : undefined}>{s.code}</span>)}</div>
    </div>
  );
}

