// 앱의 모든 비즈니스 규칙과 권한 검사. live 모드는 서버(API 라우트)에서,
// demo 모드는 브라우저에서 같은 코드가 실행된다.

import { CORE_QUESTIONS, RED_FLAGS } from './methodology';
import { TASKS, buildPacket, missingHumanInputs, type TaskType } from './packets';
import { finalScore } from './scoring';
import {
  newId, nowIso,
  type AIJob, type Assessment, type Bundle, type Company, type Engagement, type Experiment,
  type PanelRun, type Program, type Session, type User,
} from './schema';
import type { Store } from './store';

export class ActionError extends Error {}
const fail = (msg: string): never => {
  throw new ActionError(msg);
};
const req = (v: unknown, label: string) => {
  if (v === undefined || v === null || String(v).trim() === '') fail(`${label}을(를) 입력하세요.`);
};

export interface HomeItem {
  eng_id: string; company: string; stage?: string; status: string; program?: string;
  next_date?: string; open_experiments: number; red_flags: number; mentor_email: string; mentee_emails: string[];
  sessions_done: number; session_total: number; pending_acks: number; industry?: string;
}

export function createActions(store: Store, me: User) {
  const email = me.email.toLowerCase();
  const isAdmin = String(me.is_admin) === 'true';

  async function audit(action: string, sheet: string, rowId: string, detail = '') {
    await store.insert('AuditLog', { id: newId('LOG'), ts: nowIso(), user_email: email, action, sheet, row_id: rowId, detail });
  }

  function roleIn(e: Engagement): 'mentor' | 'mentee' | 'admin' | null {
    if (e.mentor_email?.toLowerCase() === email) return 'mentor';
    if ((e.mentee_emails ?? []).map((x) => x.toLowerCase()).includes(email)) return 'mentee';
    if (isAdmin) return 'admin';
    return null;
  }

  async function loadEng(engId: string, allowed: ('mentor' | 'mentee' | 'admin')[]) {
    const e = (await store.list<Engagement>('Engagements')).find((x) => x.id === engId);
    if (!e) fail('멘토링 건을 찾을 수 없습니다.');
    const role = roleIn(e!);
    if (!role || !allowed.includes(role)) fail('이 작업을 할 권한이 없습니다.');
    return { e: e!, role: role! };
  }

  async function bundle(engId: string): Promise<Bundle> {
    const { e, role } = await loadEng(engId, ['mentor', 'mentee', 'admin']);
    const [companies, programs, assessments, sessions, experiments, jobs, panels] = await Promise.all([
      store.list<Company>('Companies'), store.list<Program>('Programs'), store.list<Assessment>('Assessments'),
      store.list<Session>('Sessions'), store.list<Experiment>('Experiments'), store.list<AIJob>('AIJobs'),
      store.list<PanelRun>('PanelRuns'),
    ]);
    const company = companies.find((c) => c.id === e.company_id);
    if (!company) fail('기업 정보를 찾을 수 없습니다.');
    const isMentor = role === 'mentor';
    return {
      engagement: e,
      company: company!,
      program: programs.find((p) => p.id === e.program_id),
      role,
      assessments: assessments.filter((a) => a.eng_id === engId),
      sessions: sessions
        .filter((s) => s.eng_id === engId)
        .map((s) => (isMentor ? s : { ...s, private_note: undefined }))
        .sort((a, b) => Number(a.round_no) - Number(b.round_no)),
      experiments: experiments.filter((x) => x.eng_id === engId),
      // AI 작업과 패널 원문은 멘토만 본다. 멘티는 확정본만 본다.
      jobs: isMentor ? jobs.filter((j) => j.eng_id === engId) : [],
      panels: isMentor ? panels.filter((p) => p.eng_id === engId) : [],
    };
  }

  return {
    async me() {
      return { email: me.email, name: me.name, is_admin: isAdmin };
    },

    async home(): Promise<{ asMentor: HomeItem[]; asMentee: HomeItem[]; asAdmin: HomeItem[] }> {
      const [engs, companies, sessions, exps, programs] = await Promise.all([
        store.list<Engagement>('Engagements'), store.list<Company>('Companies'), store.list<Session>('Sessions'),
        store.list<Experiment>('Experiments'), store.list<Program>('Programs'),
      ]);
      const item = (e: Engagement): HomeItem => {
        const ss = sessions.filter((s) => s.eng_id === e.id).sort((a, b) => Number(b.round_no) - Number(a.round_no));
        return {
          eng_id: e.id,
          company: companies.find((c) => c.id === e.company_id)?.name ?? '(기업 미상)',
          stage: e.stage, status: e.status,
          program: programs.find((p) => p.id === e.program_id)?.name,
          next_date: ss[0]?.next_date,
          open_experiments: exps.filter((x) => x.eng_id === e.id && x.status !== 'done').length,
          sessions_done: ss.length,
          session_total: Number(programs.find((p) => p.id === e.program_id)?.session_count ?? 3),
          pending_acks: ss.filter((s) => String(s.mentee_ack) !== 'true').length,
          industry: companies.find((c) => c.id === e.company_id)?.industry,
          red_flags: (e.red_flags ?? []).length,
          mentor_email: e.mentor_email, mentee_emails: e.mentee_emails ?? [],
        };
      };
      const asMentor: HomeItem[] = [], asMentee: HomeItem[] = [], asAdmin: HomeItem[] = [];
      for (const e of engs) {
        const r = roleIn(e);
        if (r === 'mentor') asMentor.push(item(e));
        else if (r === 'mentee') asMentee.push(item(e));
        else if (r === 'admin') asAdmin.push(item(e));
      }
      return { asMentor, asMentee, asAdmin };
    },

    bundle,

    async createEngagement(p: { program_id?: string; company_name: string; industry?: string; mentor_email: string; mentee_email: string }) {
      req(p.company_name, '기업명'); req(p.mentor_email, '멘토 이메일'); req(p.mentee_email, '멘티 이메일');
      if (!isAdmin && p.mentor_email.toLowerCase() !== email) fail('본인이 멘토인 건만 만들 수 있습니다.');
      const company: Company = { id: newId('COM'), name: p.company_name.trim(), industry: p.industry || 'saas', consent_ai: true, updated_at: nowIso() };
      await store.insert('Companies', company);
      const e: Engagement = {
        id: newId('ENG'), program_id: p.program_id, company_id: company.id,
        mentor_email: p.mentor_email.trim().toLowerCase(), mentee_emails: [p.mentee_email.trim().toLowerCase()],
        status: '진행', stage: 'S0', gates: {}, red_flags: [], issue_codes: [], goals: [], bottlenecks: [],
        start_date: nowIso().slice(0, 10), created_at: nowIso(), updated_at: nowIso(),
      };
      await store.insert('Engagements', e);
      await audit('create', 'Engagements', e.id);
      return e;
    },

    async saveCompany(engId: string, patch: Partial<Company>) {
      const { e } = await loadEng(engId, ['mentor', 'mentee']);
      const { id: _ignore, ...rest } = patch;
      void _ignore;
      const c = await store.update<Company>('Companies', e.company_id, { ...rest, updated_at: nowIso() });
      await audit('update', 'Companies', e.company_id);
      return c;
    },

    async saveAssessments(engId: string, round: number, rater: 'self' | 'mentor',
      items: { q_code: string; score_input: number; evidence_type: string; evidence_note?: string; override_reason?: string }[]) {
      const { role } = await loadEng(engId, ['mentor', 'mentee']);
      if (rater === 'self' && role !== 'mentee') fail('자가진단은 멘티만 입력합니다.');
      if (rater === 'mentor' && role !== 'mentor') fail('보정 점수는 멘토만 입력합니다.');
      const existing = (await store.list<Assessment>('Assessments')).filter((a) => a.eng_id === engId && Number(a.round) === round && a.rater === rater);
      for (const it of items) {
        if (!CORE_QUESTIONS.some((q) => q.code === it.q_code)) continue;
        const s = Number(it.score_input);
        if (!(s >= 1 && s <= 5)) continue;
        const { grade, final } = finalScore(s, it.evidence_type);
        const row = {
          q_code: it.q_code, score_input: s, evidence_type: it.evidence_type, evidence_note: it.evidence_note ?? '',
          evidence_grade: grade, score_final: final, override_reason: it.override_reason ?? '', updated_at: nowIso(),
        };
        const prev = existing.find((a) => a.q_code === it.q_code);
        if (prev) await store.update<Assessment>('Assessments', prev.id, { ...row, origin: prev.origin === 'ai_raw' ? 'ai_edited' : prev.origin ?? 'human' });
        else await store.insert<Assessment>('Assessments', { id: newId('ASM'), eng_id: engId, round, rater, origin: 'human', ...row });
      }
      await audit('save', 'Assessments', engId, `${rater} round ${round}`);
      return true;
    },

    async updateEngagement(engId: string, patch: Partial<Engagement>) {
      const { e, role } = await loadEng(engId, ['mentor', 'mentee']);
      if (role === 'mentee') {
        // 멘티는 자신의 "가장 크게 바뀐 점"만 쓴다
        return store.update<Engagement>('Engagements', engId, { mentee_biggest_change: patch.mentee_biggest_change, updated_at: nowIso() });
      }
      const p: Partial<Engagement> = { ...patch };
      delete p.id; delete p.mentor_email; delete p.mentee_emails; delete p.company_id; delete p.mentee_biggest_change;
      if (p.stage && p.stage !== e.stage) {
        // 사람 점검 지점: 단계 전환 근거는 멘토가 직접 쓴다
        req(p.stage_transition_reason, '단계 전환 근거');
        if (p.stage_transition_reason === e.stage_transition_reason) fail('이번 단계 전환의 근거를 새로 적어 주세요.');
      }
      if (p.red_flags) p.red_flags = p.red_flags.filter((f) => RED_FLAGS.some((r) => r.code === f));
      const out = await store.update<Engagement>('Engagements', engId, { ...p, updated_at: nowIso() });
      await audit('update', 'Engagements', engId, Object.keys(p).join(','));
      return out;
    },

    async saveSession(engId: string, s: Partial<Session>) {
      await loadEng(engId, ['mentor']);
      if (s.id) {
        const prev = (await store.list<Session>('Sessions')).find((x) => x.id === s.id);
        if (!prev) fail('회차를 찾을 수 없습니다.');
        let origin = prev!.content_origin ?? 'human';
        if (origin === 'ai_raw' && (s.advice_3lines !== prev!.advice_3lines || s.decisions !== prev!.decisions)) origin = 'ai_edited';
        const { id, eng_id: _e, ...rest } = s;
        void _e;
        return store.update<Session>('Sessions', id!, { ...rest, content_origin: origin, updated_at: nowIso() });
      }
      req(s.date, '일시');
      const all = (await store.list<Session>('Sessions')).filter((x) => x.eng_id === engId);
      const row: Session = {
        id: newId('SES'), eng_id: engId, round_no: all.length + 1, date: String(s.date),
        issue_codes: s.issue_codes ?? [], mentor_own_summary: s.mentor_own_summary ?? '', mentor_next_check: s.mentor_next_check ?? '',
        advice_3lines: s.advice_3lines ?? '', decisions: s.decisions ?? '', mentor_confidence: s.mentor_confidence ?? 3,
        next_date: s.next_date ?? '', private_note: s.private_note ?? '', content_origin: 'human', mentee_ack: false,
        created_at: nowIso(), updated_at: nowIso(),
      };
      await store.insert('Sessions', row);
      await audit('create', 'Sessions', row.id);
      return row;
    },

    async ackSession(sessionId: string, p: { mentee_own_summary: string; mentee_own_tasks: string; mentee_comment?: string; mentee_rating?: number }) {
      const s = (await store.list<Session>('Sessions')).find((x) => x.id === sessionId);
      if (!s) fail('회차를 찾을 수 없습니다.');
      await loadEng(s!.eng_id, ['mentee']);
      // 사람 점검 지점: 멘티가 이해한 내용을 직접 쓴다
      req(p.mentee_own_summary, '내가 이해한 핵심 3줄');
      req(p.mentee_own_tasks, '이번 2주에 내가 할 일');
      return store.update<Session>('Sessions', sessionId, { ...p, mentee_ack: true, updated_at: nowIso() });
    },

    async saveExperiment(engId: string, x: Partial<Experiment>) {
      const { role } = await loadEng(engId, ['mentor', 'mentee']);
      if (x.status === 'done') {
        req(x.result_value, '결과 수치');
        req(x.learning, '배운 것');
      }
      if (x.id) {
        const prev = (await store.list<Experiment>('Experiments')).find((r) => r.id === x.id);
        if (!prev) fail('실험 카드를 찾을 수 없습니다.');
        const { id, eng_id: _e, ...rest } = x;
        void _e;
        if (role === 'mentee') delete rest.decision; // 결정은 멘토가 기록
        const origin = prev!.origin === 'ai_raw' && (rest.hypothesis !== undefined && rest.hypothesis !== prev!.hypothesis) ? 'ai_edited' : prev!.origin;
        return store.update<Experiment>('Experiments', id!, { ...rest, origin, updated_at: nowIso() });
      }
      if (role !== 'mentor') fail('실험 카드는 멘토가 만듭니다.');
      req(x.hypothesis, '가설');
      const row: Experiment = {
        id: newId('EXP'), eng_id: engId, session_id: x.session_id ?? '', hypothesis: String(x.hypothesis),
        method: x.method ?? '', success_metric: x.success_metric ?? '', target_value: x.target_value ?? '',
        due_date: x.due_date ?? '', status: 'open', origin: x.origin ?? 'human', created_at: nowIso(), updated_at: nowIso(),
      };
      await store.insert('Experiments', row);
      return row;
    },

    // ---- AI 연계 ----
    async createJob(engId: string, type: TaskType, refId?: string) {
      await loadEng(engId, ['mentor']);
      if (!TASKS[type]) fail('알 수 없는 작업 유형입니다.');
      const b = await bundle(engId);
      const missing = missingHumanInputs(type, b, refId);
      if (missing.length) fail(`먼저 사람이 써야 할 항목이 있습니다: ${missing.join(' / ')}`);
      const id = newId('JOB');
      const job: AIJob = {
        id, eng_id: engId, task_type: type, schema_version: TASKS[type].schema, ref_id: refId ?? '',
        packet_text: buildPacket(type, id, b, refId), exported_by: email, exported_at: nowIso(), status: 'exported', result_json: null,
      };
      await store.insert('AIJobs', job);
      await audit('export', 'AIJobs', id, type);
      return job;
    },

    async rejectJob(jobId: string, reason: string) {
      const j = (await store.list<AIJob>('AIJobs')).find((x) => x.id === jobId);
      if (!j) fail('작업을 찾을 수 없습니다.');
      await loadEng(j!.eng_id, ['mentor']);
      return store.update<AIJob>('AIJobs', jobId, { status: 'rejected', reject_reason: reason });
    },

    // 미리보기에서 멘토가 확정한 결과를 시트에 반영한다
    async applyJob(jobId: string, data: Record<string, unknown>, extra: { choice_reason?: string; mentor_decision?: string; accepted?: string[]; mentor_own_bottleneck?: string }) {
      const j = (await store.list<AIJob>('AIJobs')).find((x) => x.id === jobId);
      if (!j) fail('작업을 찾을 수 없습니다.');
      const { e } = await loadEng(j!.eng_id, ['mentor']);
      if (data.job_id !== jobId) fail('job_id가 일치하지 않습니다.');
      // 익명화 이름("A사")을 실제 기업명으로 되돌려 저장한다
      const companyName = (await store.list<Company>('Companies')).find((c) => c.id === e.company_id)?.name ?? 'A사';
      data = JSON.parse(JSON.stringify(data).replaceAll('A사', companyName.replace(/["\\]/g, '')));
      const type = j!.task_type as TaskType;

      if (type === 'J1') {
        // 사람 점검 지점: AI 브리핑을 받기 전에 멘토가 본 병목을 먼저 적는다
        const own = extra.mentor_own_bottleneck ?? e.mentor_own_bottleneck;
        req(own, '내가 보는 병목 1줄');
        req(extra.choice_reason, '어느 쪽을 택했는지와 이유');
        await store.update<Engagement>('Engagements', e.id, {
          mentor_own_bottleneck: own, ai_briefing: data, briefing_choice_reason: extra.choice_reason,
          issue_codes: Array.isArray(data.issue_codes) ? (data.issue_codes as string[]) : e.issue_codes, updated_at: nowIso(),
        });
      }
      if (type === 'J2') {
        const advice = Array.isArray(data.advice_3lines) ? (data.advice_3lines as string[]).join('\n') : String(data.advice_3lines ?? '');
        await store.update<Session>('Sessions', j!.ref_id!, {
          advice_3lines: advice, decisions: String(data.decisions ?? ''),
          issue_codes: Array.isArray(data.issue_codes) ? (data.issue_codes as string[]) : [], content_origin: 'ai_raw', updated_at: nowIso(),
        });
        const exps = Array.isArray(data.experiments) ? (data.experiments as Record<string, unknown>[]) : [];
        const accepted = extra.accepted ?? exps.map((_, i) => String(i));
        for (const [i, x] of exps.entries()) {
          if (!accepted.includes(String(i))) continue;
          const due = new Date(Date.now() + (Number(x.due_days) || 14) * 864e5).toISOString().slice(0, 10);
          await store.insert<Experiment>('Experiments', {
            id: newId('EXP'), eng_id: e.id, session_id: j!.ref_id, hypothesis: String(x.hypothesis ?? ''), method: String(x.method ?? ''),
            success_metric: String(x.success_metric ?? ''), target_value: String(x.target_value ?? ''), due_date: due,
            status: 'open', origin: 'ai_raw', created_at: nowIso(), updated_at: nowIso(),
          });
        }
      }
      if (type === 'J3') {
        const grades = Array.isArray(data.grades) ? (data.grades as { q_code: string; suggested_type: string }[]) : [];
        const accepted = extra.accepted ?? [];
        const rows = (await store.list<Assessment>('Assessments')).filter((a) => a.eng_id === e.id && a.rater === 'mentor');
        for (const g of grades) {
          if (!accepted.includes(g.q_code)) continue;
          const row = rows.filter((r) => r.q_code === g.q_code).sort((a, b) => Number(b.round) - Number(a.round))[0];
          if (!row) continue;
          const { grade, final } = finalScore(Number(row.score_input), g.suggested_type);
          await store.update<Assessment>('Assessments', row.id, { evidence_type: g.suggested_type, evidence_grade: grade, score_final: final, origin: 'ai_edited', updated_at: nowIso() });
        }
      }
      if (type === 'J4') {
        await store.update<Engagement>('Engagements', e.id, { final_report: data, updated_at: nowIso() });
      }
      if (type === 'J5') {
        req(extra.mentor_decision, '패널 의견에 대한 멘토 결정');
        await store.insert<PanelRun>('PanelRuns', { id: newId('PNL'), job_id: jobId, eng_id: e.id, result_json: data, mentor_decision: extra.mentor_decision, created_at: nowIso() });
      }
      await store.update<AIJob>('AIJobs', jobId, { status: 'imported', result_json: data, imported_at: nowIso(), confirmed_by: email });
      await audit('import', 'AIJobs', jobId, type);
      return true;
    },

    // ---- 관리 ----
    async programs() {
      return store.list<Program>('Programs');
    },
    async createProgram(p: Partial<Program>) {
      if (!isAdmin) fail('관리자만 프로그램을 만들 수 있습니다.');
      req(p.org_name, '기관명'); req(p.name, '프로그램명');
      const row: Program = { id: newId('PRG'), org_name: String(p.org_name), name: String(p.name), year: Number(p.year) || new Date().getFullYear(), session_count: Number(p.session_count) || 3, interval_weeks: Number(p.interval_weeks) || 2, created_at: nowIso() };
      return store.insert('Programs', row);
    },
    async users() {
      if (!isAdmin) fail('관리자만 사용자 목록을 볼 수 있습니다.');
      return (await store.list<User>('Users')).map((u) => ({ ...u, access_code: u.access_code ? '••••' : '' }));
    },
    async createUser(p: Partial<User>) {
      if (!isAdmin) fail('관리자만 사용자를 등록할 수 있습니다.');
      req(p.email, '이메일'); req(p.name, '이름'); req(p.access_code, '접근 코드');
      const exists = (await store.list<User>('Users')).some((u) => u.email.toLowerCase() === String(p.email).toLowerCase());
      if (exists) fail('이미 등록된 이메일입니다.');
      const row: User = { id: newId('USR'), email: String(p.email).toLowerCase(), name: String(p.name), affiliation: p.affiliation ?? '', access_code: String(p.access_code), is_admin: !!p.is_admin, created_at: nowIso() };
      await store.insert('Users', row);
      return { ...row, access_code: '••••' };
    },
  };
}

export type Actions = ReturnType<typeof createActions>;
export type ActionName = keyof Actions;
