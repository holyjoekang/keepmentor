// Google Meet·Gemini 회의록(복사해 붙여 넣은 텍스트)을 회차 기록으로 나눈다.
// 형식: "요약" / "다음 단계" / "상세정보" 제목 아래 내용. 제목 앞의 #, 공백은 무시한다.

export interface ParsedNotes {
  title: string;
  date: string;
  summary: string;
  nextSteps: string[];
  details: string[];
}

const HEADS: Record<string, keyof Pick<ParsedNotes, 'summary' | 'nextSteps' | 'details'>> = {
  '요약': 'summary', 'summary': 'summary',
  '다음 단계': 'nextSteps', '다음단계': 'nextSteps', 'next steps': 'nextSteps', '추천 다음 단계': 'nextSteps',
  '상세정보': 'details', '상세 정보': 'details', 'details': 'details',
};
const NOISE = [/Gemini가 작성한 회의록이 정확한지/, /이 특정 메모의 품질은/, /^회의 기록\s*$/, /^스크립트\s*$/];

export function parseMeetingNotes(text: string): ParsedNotes {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim());
  const out: ParsedNotes = { title: '', date: '', summary: '', nextSteps: [], details: [] };
  let cur: keyof typeof HEADS | null = null;
  const summary: string[] = [];
  for (const raw of lines) {
    if (!raw) continue;
    const line = raw.replace(/^#+\s*/, '');
    if (NOISE.some((r) => r.test(line))) continue;
    const head = HEADS[line.toLowerCase()];
    if (head) { cur = line.toLowerCase(); continue; }
    if (!cur) {
      if (!out.title) out.title = line;
      continue;
    }
    const key = HEADS[cur];
    const item = line.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '');
    if (key === 'summary') summary.push(item);
    else if (key === 'nextSteps') out.nextSteps.push(item);
    else out.details.push(item);
  }
  out.summary = summary.join('\n');
  // 제목의 날짜: 26.11.7 / 2026/11/07 / 2026-11-07
  const m = text.match(/(20\d{2})[./-](\d{1,2})[./-](\d{1,2})/) ?? text.match(/\b(\d{2})\.(\d{1,2})\.(\d{1,2})\b/);
  if (m) {
    const y = m[1].length === 2 ? `20${m[1]}` : m[1];
    out.date = `${y}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  return out;
}

export function roundFromTitle(title: string): number | undefined {
  const m = title.match(/(\d+)\s*차/);
  return m ? Number(m[1]) : undefined;
}

/** Markdown document for a structured meeting note; preserves multiline content. */
export function notesToMarkdown(notes: ParsedNotes): string {
  const title = notes.title.replace(/[\r\n]+/g, ' ').trim() || '회의록';
  const sections = [`# ${title}`];
  if (notes.date) sections.push(`일시: ${notes.date}`);
  sections.push(`## 요약\n\n${notes.summary}`);
  sections.push(`## 다음 단계\n\n${notes.nextSteps.map((s) => `- ${s}`).join('\n')}`);
  sections.push(`## 상세정보\n\n${notes.details.map((s) => `- ${s}`).join('\n')}`);
  return `${sections.join('\n\n')}\n`;
}
