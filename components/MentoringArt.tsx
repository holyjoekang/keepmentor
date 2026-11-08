const works = [
  { file: 'composition-8', title: 'Composition VIII', year: '1923' },
  { file: 'several-circles', title: 'Several Circles', year: '1926' },
  { file: 'composition-7', title: 'Composition VII', year: '1913' },
];

export function MentoringArt({ variant = 0, compact = false }: { variant?: number; compact?: boolean }) {
  const work = works[variant % works.length];
  return <figure className={`mentoring-art${compact ? ' compact' : ''}`}>
    <img src={`/images/art/kandinsky-${work.file}.webp`} alt={`바실리 칸딘스키, ${work.title}, ${work.year}`} loading={compact ? 'lazy' : 'eager'} />
    <figcaption>Wassily Kandinsky · {work.title}, {work.year}</figcaption>
  </figure>;
}
