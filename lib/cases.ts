'use client';

import { useEffect, useState } from 'react';

// public/data/cases.json — scripts/import_joyhouse_cases.py 가 만든다.
export interface CaseTask { task: string; success: string }
export interface CaseItem {
  id: string; category: string; title: string; founder_says: string; surface: string; root: string;
  diagnostic_questions?: string[];
  session_flow?: { goal?: string; reality?: string; options?: string[]; will?: string };
  prescription?: string; two_week_tasks?: CaseTask[]; success_signal?: string; mentor_pitfall?: string;
  resources?: string[]; dialogue?: { who: string; text: string }[]; applies_to?: string[];
  stage: string | null; km_stage: string | null; track: string | null;
}
export interface CaseStage {
  code: string; name: string; km_stage: string; question: string; exit: string; focus: string;
  traps: string[]; persona: string; exit_check: string[]; takeaways: string[];
}
export interface ShortSession { session: string; goal: string; prep?: string[]; flow?: string[]; closing?: string; report?: string[] }
export interface CaseTrack {
  code: string; name: string; summary: string; takeaways: string[];
  poc_playbook?: { before: string[]; during: string[]; after: string[] };
  proposal_outline?: string[];
  short_program?: ShortSession[];
  report_example?: Record<string, string>;
}
export interface CasesData {
  source: { name: string; edition: string; built: string; url: string; origin: string; note: string; oneLiner: string };
  stages: CaseStage[]; tracks: CaseTrack[]; cases: CaseItem[];
}

let cache: Promise<CasesData> | null = null;
export function loadCases(): Promise<CasesData> {
  cache ??= fetch('/data/cases.json').then((r) => {
    if (!r.ok) throw new Error('사례 데이터를 불러오지 못했습니다.');
    return r.json();
  });
  return cache;
}

export function useCases() {
  const [data, setData] = useState<CasesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { loadCases().then(setData).catch((e) => setError(e.message)); }, []);
  return { data, error };
}

export function trackName(d: CasesData, code: string | null) {
  return code ? d.tracks.find((t) => t.code === code)?.name ?? code : '';
}
export function stageName(d: CasesData, code: string | null) {
  return code ? d.stages.find((s) => s.code === code)?.name ?? code : '';
}
