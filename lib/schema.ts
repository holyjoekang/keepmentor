// 시트(테이블) 정의. 첫 컬럼은 항상 id.
// Apps Script의 setup 작업이 이 정의대로 시트와 헤더를 만든다.
// 객체·배열 값은 JSON 문자열로 저장된다.

export const SHEETS = {
  Users: ['id', 'email', 'name', 'affiliation', 'access_code', 'is_admin', 'consent_ai', 'conflict_disclosure', 'created_at'],
  Programs: ['id', 'org_name', 'name', 'year', 'session_count', 'interval_weeks', 'created_at'],
  Companies: [
    'id', 'name', 'biz_reg_no', 'founded_date', 'industry', 'tech_tags', 'team_type', 'headcount',
    'ceo_weekly_hours', 'runway_months', 'website', 'summary',
    'issue_symptom', 'issue_tried', 'issue_wanted', 'consent_ai', 'updated_at',
  ],
  Engagements: [
    'id', 'program_id', 'company_id', 'mentor_email', 'mentee_emails', 'status',
    'stage', 'stage_transition_reason', 'gates', 'red_flags', 'issue_codes',
    'goals', 'bottlenecks', 'mentor_own_bottleneck', 'ai_briefing', 'briefing_choice_reason',
    'mentor_biggest_change', 'mentee_biggest_change', 'final_report',
    'start_date', 'created_at', 'updated_at',
  ],
  Assessments: [
    'id', 'eng_id', 'round', 'rater', 'q_code', 'score_input', 'evidence_type', 'evidence_note',
    'evidence_grade', 'score_final', 'override_reason', 'origin', 'updated_at',
  ],
  Sessions: [
    'id', 'eng_id', 'round_no', 'date', 'issue_codes',
    'mentor_own_summary', 'mentor_next_check',
    'advice_3lines', 'decisions', 'mentor_confidence', 'next_date', 'private_note',
    'content_origin', 'mentee_own_summary', 'mentee_own_tasks', 'mentee_ack', 'mentee_comment', 'mentee_rating',
    'created_at', 'updated_at',
  ],
  Experiments: [
    'id', 'eng_id', 'session_id', 'hypothesis', 'method', 'success_metric', 'target_value', 'due_date',
    'result_value', 'learning', 'decision', 'status', 'origin', 'created_at', 'updated_at',
  ],
  AIJobs: [
    'id', 'eng_id', 'task_type', 'schema_version', 'ref_id', 'packet_text', 'exported_by', 'exported_at',
    'status', 'result_json', 'reject_reason', 'imported_at', 'confirmed_by',
  ],
  PanelRuns: ['id', 'job_id', 'eng_id', 'result_json', 'mentor_decision', 'created_at'],
  AuditLog: ['id', 'ts', 'user_email', 'action', 'sheet', 'row_id', 'detail'],
} as const;

export type SheetName = keyof typeof SHEETS;
export type Row = Record<string, unknown> & { id: string };

export interface User extends Row {
  email: string; name: string; affiliation?: string; access_code?: string; is_admin?: boolean;
}
export interface Program extends Row {
  org_name: string; name: string; year?: number; session_count?: number; interval_weeks?: number;
}
export interface Company extends Row {
  name: string; biz_reg_no?: string; founded_date?: string; industry?: string; tech_tags?: string;
  team_type?: string; headcount?: number; ceo_weekly_hours?: number; runway_months?: number;
  website?: string; summary?: string; issue_symptom?: string; issue_tried?: string; issue_wanted?: string;
  consent_ai?: boolean;
}
export interface Goal { text: string; success: string; q_codes: string[] }
export interface Engagement extends Row {
  program_id?: string; company_id: string; mentor_email: string; mentee_emails: string[]; status: string;
  stage?: string; stage_transition_reason?: string; gates?: Record<string, { met: boolean; note: string }>;
  red_flags?: string[]; issue_codes?: string[]; goals?: Goal[]; bottlenecks?: string[];
  mentor_own_bottleneck?: string; ai_briefing?: Record<string, unknown> | null; briefing_choice_reason?: string;
  mentor_biggest_change?: string; mentee_biggest_change?: string; final_report?: Record<string, unknown> | null;
  start_date?: string; created_at?: string; updated_at?: string;
}
export interface Assessment extends Row {
  eng_id: string; round: number; rater: 'self' | 'mentor'; q_code: string; score_input: number;
  evidence_type: string; evidence_note?: string; evidence_grade: string; score_final: number;
  override_reason?: string; origin?: string;
}
export interface Session extends Row {
  eng_id: string; round_no: number; date: string; issue_codes?: string[];
  mentor_own_summary?: string; mentor_next_check?: string;
  advice_3lines?: string; decisions?: string; mentor_confidence?: number; next_date?: string; private_note?: string;
  content_origin?: string; mentee_own_summary?: string; mentee_own_tasks?: string; mentee_ack?: boolean;
  mentee_comment?: string; mentee_rating?: number; created_at?: string; updated_at?: string;
}
export interface Experiment extends Row {
  eng_id: string; session_id?: string; hypothesis: string; method?: string; success_metric?: string;
  target_value?: string; due_date?: string; result_value?: string; learning?: string; decision?: string;
  status: 'open' | 'done'; origin?: string; created_at?: string; updated_at?: string;
}
export interface AIJob extends Row {
  eng_id: string; task_type: string; schema_version: string; ref_id?: string; packet_text: string;
  exported_by: string; exported_at: string; status: 'exported' | 'imported' | 'rejected';
  result_json?: Record<string, unknown> | null; reject_reason?: string; imported_at?: string; confirmed_by?: string;
}
export interface PanelRun extends Row {
  job_id: string; eng_id: string; result_json: Record<string, unknown>; mentor_decision?: string; created_at: string;
}

export interface Bundle {
  engagement: Engagement;
  company: Company;
  program?: Program;
  role: 'mentor' | 'mentee' | 'admin';
  assessments: Assessment[];
  sessions: Session[];
  experiments: Experiment[];
  jobs: AIJob[];
  panels: PanelRun[];
}

export function newId(prefix: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(16).slice(2, 6);
  return `${prefix}-${ymd}-${rand}`;
}

export const nowIso = () => new Date().toISOString();
