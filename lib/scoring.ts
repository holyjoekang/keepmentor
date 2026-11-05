import {
  AXES, CORE_QUESTIONS, GRADE_CAP, RUNWAY_THRESHOLD_MONTHS, gradeOf, gatesFor,
  type AxisCode, type EvidenceGrade, type Stage,
} from './methodology';
import type { Assessment, Company, Engagement } from './schema';

// 입력 점수와 증거 상한 중 낮은 값으로 확정 (12.3절)
export function finalScore(scoreInput: number, evidenceType: string): { grade: EvidenceGrade; final: number } {
  const grade = gradeOf(evidenceType);
  return { grade, final: Math.min(scoreInput, GRADE_CAP[grade]) };
}

// 문항별 유효 점수: 멘토 보정이 있으면 멘토 값을 우선
export function effectiveScores(assessments: Assessment[]): Record<string, { self?: Assessment; mentor?: Assessment; final?: number }> {
  const out: Record<string, { self?: Assessment; mentor?: Assessment; final?: number }> = {};
  const latestRound = (rater: string, q: string) =>
    assessments
      .filter((a) => a.rater === rater && a.q_code === q)
      .sort((a, b) => Number(b.round) - Number(a.round))[0];
  for (const q of CORE_QUESTIONS) {
    const self = latestRound('self', q.code);
    const mentor = latestRound('mentor', q.code);
    out[q.code] = { self, mentor, final: mentor ? Number(mentor.score_final) : self ? Number(self.score_final) : undefined };
  }
  return out;
}

export function axisScores(assessments: Assessment[], rater?: 'self' | 'mentor'): Record<AxisCode, number | null> {
  const eff = effectiveScores(assessments);
  const res = {} as Record<AxisCode, number | null>;
  for (const ax of AXES) {
    const vals = CORE_QUESTIONS.filter((q) => q.axis === ax.code)
      .map((q) => {
        const e = eff[q.code];
        if (rater === 'self') return e.self ? Number(e.self.score_final) : undefined;
        if (rater === 'mentor') return e.mentor ? Number(e.mentor.score_final) : undefined;
        return e.final;
      })
      .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
    res[ax.code] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  }
  return res;
}

// 병목 후보: 점수가 가장 낮은 축 2개
export function bottleneckCandidates(assessments: Assessment[]): AxisCode[] {
  const s = axisScores(assessments);
  return AXES.filter((a) => s[a.code] !== null)
    .sort((a, b) => (s[a.code] as number) - (s[b.code] as number))
    .slice(0, 2)
    .map((a) => a.code);
}

// 자동 레드플래그: 런웨이 (나머지는 멘토 체크)
export function autoRedFlags(company: Company): string[] {
  const r = Number(company.runway_months);
  return company.runway_months !== undefined && company.runway_months !== null && String(company.runway_months) !== '' && r < RUNWAY_THRESHOLD_MONTHS
    ? ['runway']
    : [];
}

export function allRedFlags(eng: Engagement, company: Company): string[] {
  return Array.from(new Set([...(eng.red_flags ?? []), ...autoRedFlags(company)]));
}

// 관문 체크 결과로 제안 단계 산출
export function suggestedStage(eng: Engagement, company: Company): Stage {
  let stage: Stage = 'S0';
  for (const g of gatesFor(company.industry)) {
    if (eng.gates?.[g.to]?.met) stage = g.to;
    else break;
  }
  return stage;
}

// 목표 문항의 증거등급 상승 (성과 1순위 KPI, 12.6절)
export function gradeLift(assessments: Assessment[], qCodes: string[]): { q: string; from?: string; to?: string; lifted: boolean }[] {
  return qCodes.map((q) => {
    const rows = assessments.filter((a) => a.q_code === q).sort((a, b) => Number(a.round) - Number(b.round));
    const from = rows[0]?.evidence_grade;
    const to = rows[rows.length - 1]?.evidence_grade;
    return { q, from, to, lifted: !!from && !!to && to > from };
  });
}
