import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Compile the actual shared business layer with its real imports for Node tests.
const output = mkdtempSync(join(tmpdir(), 'keepmentor-business-'));
execFileSync('node_modules/.bin/tsc', ['lib/actions.ts','lib/notes.ts','lib/maintenance.ts','--module','commonjs','--moduleResolution','node','--target','ES2020','--lib','ES2021,DOM','--outDir',output,'--skipLibCheck','--esModuleInterop']);
const require = createRequire(import.meta.url);
const { createActions } = require(join(output, 'actions.js'));
const { blocksWrite } = require(join(output, 'maintenance.js'));
const { notesToMarkdown, parseMeetingNotes } = require(join(output, 'notes.js'));
after(() => rmSync(output, { recursive: true, force: true }));
const mentor = { id: 'm', email: 'mentor@example.test', name: '멘토' };
const mentee = { id: 't', email: 'mentee@example.test', name: '멘티' };
const institution = { id: 'i', email: 'org@example.test', name: '기관' };
const admin = { id: 'a', email: 'admin@example.test', name: '관리자', is_admin: true };
function fixture() {
  const tables = {
    Users: [mentor,mentee,institution,admin], Programs: [{id:'p1',name:'내 프로그램'},{id:'p2',name:'다른 프로그램'}],
    Companies: [{id:'c1',name:'내 회사'},{id:'c2',name:'다른 회사'}],
    Engagements: [
      {id:'e1',program_id:'p1',company_id:'c1',mentor_email:mentor.email,mentee_emails:[mentee.email],institution_emails:[institution.email],status:'진행'},
      {id:'e2',program_id:'p2',company_id:'c2',mentor_email:mentee.email,mentee_emails:[institution.email],status:'진행'},
    ],
    Sessions: [{id:'s1',eng_id:'e1',round_no:1,date:'2026-11-08',private_note:'멘토 전용',meeting_notes_raw:'원본'}, {id:'s2',eng_id:'e2',round_no:1,date:'2026-11-08'}],
    Experiments: [{id:'x2',eng_id:'e2',hypothesis:'다른 건',status:'open'}],
    AIJobs: [], PanelRuns: [], Assessments: [], AuditLog: [],
    MentorMeetings: [{id:'mtg',owner_email:mentor.email,date:'2026-11-08',title:'개인 회의',share_emails:[]}],
  };
  const store = {
    async list(name) { return structuredClone(tables[name] ?? []); },
    async insert(name,row) { (tables[name] ??= []).push(structuredClone(row)); return structuredClone(row); },
    async update(name,id,patch) { const row=tables[name].find(row=>row.id===id); assert.ok(row); Object.assign(row,structuredClone(patch)); return structuredClone(row); },
  };
  return { tables, actions: (user) => createActions(store,user) };
}

test('home and direct reads are scoped per engagement, including system admins', async () => {
  const {actions}=fixture();
  assert.equal((await actions(mentor).home()).asMentor.length,1);
  assert.equal((await actions(mentee).home()).asMentor.length,1);
  assert.equal((await actions(mentee).home()).asMentee.length,1);
  assert.equal((await actions(institution).home()).asAdmin.length,1);
  assert.deepEqual(await actions(admin).home(),{asMentor:[],asMentee:[],asAdmin:[]});
  await assert.rejects(actions(mentor).bundle('e2'),/권한/);
  await assert.rejects(actions(admin).bundle('e1'),/권한/);
});

test('institution member can read only assigned mentoring and cannot edit sessions', async () => {
  const {actions}=fixture();
  assert.equal((await actions(institution).bundle('e1')).role,'admin');
  await assert.rejects(actions(institution).saveSession('e1',{id:'s1',meeting_notes:'변경'}),/권한/);
  await assert.rejects(actions(institution).updateEngagement('e1',{status:'완료'}),/권한/);
});

test('foreign session/experiment IDs cannot bypass engagement permissions', async () => {
  const {actions,tables}=fixture();
  await assert.rejects(actions(mentor).saveSession('e1',{id:'s2',advice_3lines:'침입'}),/이 멘토링/);
  await assert.rejects(actions(mentor).saveExperiment('e1',{id:'x2',hypothesis:'침입'}),/이 멘토링/);
  await assert.rejects(actions(mentor).saveExperiment('e1',{hypothesis:'새 실험',session_id:'s2'}),/이 멘토링/);
  await assert.rejects(actions(mentor).createJob('e1','J2','s2'),/이 멘토링/);
  assert.equal(tables.Sessions[1].advice_3lines,undefined);
});

test('mentee acknowledgement cannot overwrite session ownership or mentor data', async () => {
  const {actions,tables}=fixture();
  await actions(mentee).ackSession('s1',{mentee_own_summary:'이해',mentee_own_tasks:'실행',eng_id:'e2',private_note:'침입'});
  assert.equal(tables.Sessions[0].eng_id,'e1');
  assert.equal(tables.Sessions[0].private_note,'멘토 전용');
});

test('Markdown and original source survive saving and editing; private notes remain restricted', async () => {
  const {actions}=fixture();
  const parsed=parseMeetingNotes('2026-11-08 2차 회의\n요약\n사업 범위 검토\n다음 단계\n- 인터뷰 3건\n상세정보\n가격 검증');
  const md=notesToMarkdown(parsed);
  assert.match(md,/# 2026-11-08 2차 회의/);assert.match(md,/## 요약\n\n사업 범위 검토/);assert.match(md,/- 인터뷰 3건/);
  await actions(mentor).saveSession('e1',{id:'s1',meeting_notes:md});
  const edited=md+'\n## 결정\n\n시장 검증부터 진행\n';
  await actions(mentor).saveSession('e1',{id:'s1',meeting_notes:edited});
  assert.equal((await actions(mentor).bundle('e1')).sessions[0].meeting_notes,edited);
  const publicSession=(await actions(mentee).bundle('e1')).sessions[0];
  assert.equal(publicSession.private_note,undefined);assert.equal(publicSession.meeting_notes_raw,undefined);
  assert.equal(publicSession.meeting_notes,edited);
});

test('only system admins assign roles, validating users and avoiding overlapping roles', async () => {
  const {actions,tables}=fixture();
  const members={mentor_email:mentor.email,mentee_emails:[mentee.email],institution_emails:[admin.email]};
  await assert.rejects(actions(mentor).assignEngagementRoles('e1',members),/관리자/);
  await assert.rejects(actions(admin).assignEngagementRoles('e1',{...members,institution_emails:[mentor.email]}),/하나의 역할/);
  await assert.rejects(actions(admin).assignEngagementRoles('e1',{...members,institution_emails:['unknown@example.test']}),/등록/);
  await actions(admin).assignEngagementRoles('e1',members);
  assert.equal((await actions(admin).bundle('e1')).role,'admin');
  await assert.rejects(actions(institution).bundle('e1'),/권한/);
  assert.ok(tables.AuditLog.some(log=>log.action==='assign_roles'));
});

test('normal editing cannot reassign roles or change relationship ownership', async () => {
  const {actions,tables}=fixture();
  await actions(mentor).updateEngagement('e1',{institution_emails:[admin.email],program_id:'p2',kind:'received',recorder_email:admin.email});
  assert.deepEqual(tables.Engagements[0].institution_emails,[institution.email]);
  assert.equal(tables.Engagements[0].program_id,'p1');
  assert.equal(tables.Engagements[0].recorder_email,undefined);
});

test('system admins cannot read or modify private mentor meetings without sharing', async () => {
  const {actions}=fixture();
  assert.deepEqual(await actions(admin).meetings(),[]);
  await assert.rejects(actions(admin).saveMeeting({id:'mtg',title:'침입',date:'2026-11-08'}),/작성자/);
});

test('received mentoring keeps actual mentee role with explicit recording capability', async () => {
  const {actions,tables}=fixture();
  Object.assign(tables.Engagements[0],{kind:'received',recorder_email:mentee.email});
  const b=await actions(mentee).bundle('e1');assert.equal(b.role,'mentee');assert.equal(b.can_record,true);
  await actions(mentee).saveSession('e1',{id:'s1',meeting_notes:'# 내가 받은 멘토링'});
  await actions(mentee).saveExperiment('e1',{hypothesis:'검증'});
});

test('cutover read-only mode blocks writes while preserving read access', () => {
  assert.equal(blocksWrite('saveSession','1'),true);
  assert.equal(blocksWrite('assignEngagementRoles','1'),true);
  assert.equal(blocksWrite('bundle','1'),false);
  assert.equal(blocksWrite('saveSession',undefined),false);
});
