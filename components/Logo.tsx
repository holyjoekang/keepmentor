// Keep Mentor 로고: Keep121의 아치(지켜 주는 문)와 앰버 점을 잇고,
// 그 위에 성장을 이끄는 상승 화살표(멘토의 안내)를 더했다.
export const KEEP = { indigo: '#23306B', ink: '#141A2E', dawn: '#F2A541', pasture: '#3E8E6E', mint: '#8FD3B6' };

export function LogoMark({ size = 30, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {tile && <rect width="48" height="48" rx="12" fill={KEEP.indigo} />}
      <path d="M13 39V23a11 11 0 0 1 22 0v16" fill="none" stroke={tile ? '#fff' : 'currentColor'} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.5 24.5L24 20l4.5 4.5" fill="none" stroke={KEEP.mint} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="32" r="4" fill={KEEP.dawn} />
    </svg>
  );
}

export function Logo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <LogoMark size={size} />
      <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: size * 0.58, color: light ? '#fff' : 'var(--text)' }}>
        Keep <span style={{ fontWeight: 500 }}>Mentor</span>
      </span>
    </span>
  );
}
