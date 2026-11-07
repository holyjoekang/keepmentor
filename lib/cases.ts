'use client';

import { useEffect, useState } from 'react';

// data/cases.json (서버 전용, /api/cases 가 인증 후 내려준다) — scripts/import_joyhouse_cases.py 가 만든다.
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

export class LockedError extends Error {
  constructor(public codeEnabled: boolean) { super('locked'); }
}

let cache: Promise<CasesData> | null = null;
export function loadCases(): Promise<CasesData> {
  cache ??= fetch('/api/cases', { cache: 'no-store' }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) { cache = null; throw new LockedError(!!j.codeEnabled); }
    if (!r.ok || !j.ok) { cache = null; throw new Error('사례 데이터를 불러오지 못했습니다.'); }
    return j.data as CasesData;
  });
  return cache;
}

export function useCases() {
  const [data, setData] = useState<CasesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ codeEnabled: boolean } | null>(null);
  const load = () => loadCases().then((d) => { setData(d); setLocked(null); }).catch((e) => {
    if (e instanceof LockedError) setLocked({ codeEnabled: e.codeEnabled }); else setError(e.message);
  });
  useEffect(() => { load(); }, []);
  return { data, error, locked, reload: load };
}

export function trackName(d: CasesData, code: string | null) {
  return code ? d.tracks.find((t) => t.code === code)?.name ?? code : '';
}
export function stageName(d: CasesData, code: string | null) {
  return code ? d.stages.find((s) => s.code === code)?.name ?? code : '';
}
