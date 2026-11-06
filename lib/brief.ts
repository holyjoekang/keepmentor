// 멘티용 진단 결과 설명지 — 진단 데이터를 1차 미팅 설명 순서(8단계)로 정리한다.
import { AXES, CAP_EXEMPT, CORE_QUESTIONS, GRADE_CAP, RED_FLAGS, STAGES, gatesFor, type AxisCode, type EvidenceGrade } from './methodology';
import { allRedFlags, axisScores, bottleneckCandidates, effectiveScores, scoreOf } from './scoring';
import type { Bundle } from './schema';

export interface QLine {
  code: string; text: string; axis: string; score?: number; self?: number; mentor?: number;
  grade?: string; evidence?: string; anchorNow?: string; anchorNext?: string; capNote?: string;
}

const axisName = (c: string) => AXES.find((a) => a.code === c)?.name ?? c;

function qLine(b: Bundle, code: string): QLine {
  const q = CORE_QUESTIONS.find((x) => x.code === code)!;
  const e = effectiveScores(b.assessments)[code];
  const main = e.mentor ?? e.self;
  const score = e.final;
  const grade = main?.evidence_grade as EvidenceGrade | undefined;
  let capNote: string | undefined;
  if (main && !CAP_EXEMPT.has(code) && grade && Number(main.score_input) > GRADE_CAP[grade]) {
    capNote = `${main.score_input}점을 골랐지만 근거가 ${grade}라서 ${GRADE_CAP[grade]}점으로 확정됐습니다.`;
  }
  return {
    code, text: q.text, axis: axisName(q.axis), score, self: scoreOf(e.self), mentor: scoreOf(e.mentor),
    grade, evidence: main?.evidence_note,
    anchorNow: score ? q.anchors[Math.round(score) - 1] : undefined,
    anchorNext: score && score < 5 ? q.anchors[Math.round(score)] : undefined,
    capNote,
  };
}

export function buildBrief(b: Bundle) {
  const e = b.engagement;
  const scores = axisScores(b.assessments);
  const scored = AXES.filter((a) => scores[a.code] !== null);
  const hasData = scored.length > 0;
  const hasMentor = b.assessments.some((a) => a.rater === 'mentor');
  const hasSelf = b.assessments.some((a) => a.rater === 'self');

  // 2. 단계
  const stageIdx = Math.max(0, STAGES.findIndex((s) => s.code === e.stage));
  const stage = STAGES[stageIdx];
  const gates = gatesFor(b.company.industry);
  const metGates = gates.filter((g) => e.gates?.[g.to]?.met).map((g) => ({ to: g.to, evidence: g.evidence, note: e.gates?.[g.to]?.note ?? '' }));
  const nextGate = gates.find((g) => STAGES.findIndex((s) => s.code === g.to) === stageIdx + 1);

  // 3. 강점: 점수 높은 축 2개, 그 축에서 가장 높은 문항
  const strengths = [...scored].sort((a, x) => (scores[x.code] as number) - (scores[a.code] as number)).slice(0, 2).map((a) => {
    const best = CORE_QUESTIONS.filter((q) => q.axis === a.code).map((q) => qLine(b, q.code)).filter((l) => l.score !== undefined)
      .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
    return { axis: a.name, score: scores[a.code] as number, q: best };
  });

  // 4. 자가 vs 멘토 차이 (1점 이상, 큰 순으로 3개)
  const gaps = CORE_QUESTIONS.map((q) => qLine(b, q.code))
    .filter((l) => l.self !== undefined && l.mentor !== undefined && Math.abs((l.self ?? 0) - (l.mentor ?? 0)) >= 1)
    .sort((x, y) => Math.abs((y.self ?? 0) - (y.mentor ?? 0)) - Math.abs((x.self ?? 0) - (x.mentor ?? 0)))
    .slice(0, 3);

  // 5. 레드플래그
  const flags = allRedFlags(e, b.company).map((f) => ({
    code: f, label: RED_FLAGS.find((r) => r.code === f)?.label ?? f,
    detail: f === 'runway' ? `현재 런웨이 ${b.company.runway_months}개월` : '',
  }));

  // 6. 병목: 점수 낮은 축 2개와 그 축의 가장 낮은 문항
  const bottlenecks = bottleneckCandidates(b.assessments).map((code: AxisCode) => {
    const lines = CORE_QUESTIONS.filter((q) => q.axis === code).map((q) => qLine(b, q.code)).filter((l) => l.score !== undefined)
      .sort((x, y) => (x.score ?? 0) - (y.score ?? 0));
    return { axis: axisName(code), score: scores[code] as number, q: lines[0] };
  });
  const lowCaps = CORE_QUESTIONS.map((q) => qLine(b, q.code)).filter((l) => l.capNote);

  // 7·8. 목표와 실험
  const goals = (e.goals ?? []).filter((g) => g.text?.trim());
  const experiments = b.experiments.filter((x) => x.status !== 'done');

  return {
    hasData, hasMentor, hasSelf,
    scores,
    stage, metGates, nextGate, stageReason: e.stage_transition_reason,
    strengths, gaps, flags, bottlenecks, lowCaps,
    request: { symptom: b.company.issue_symptom, wanted: b.company.issue_wanted },
    mentorView: e.mentor_own_bottleneck,
    goals, experiments,
  };
}
