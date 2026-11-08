#!/usr/bin/env node
// Node.js 24: built-in TypeScript stripping; no extra dependencies.
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { SHEETS } from '../lib/schema.ts';
import { supabaseStore } from '../lib/supabase-store.ts';

const names = Object.keys(SHEETS);
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const verifyOnly = args.includes('--verify');
const backupIndex = args.indexOf('--backup');
const backupPath = backupIndex >= 0 ? args[backupIndex + 1] : undefined;
const known = new Set(['--apply', '--verify', '--backup']);
for (let i = 0; i < args.length; i++) {
  if (!known.has(args[i])) throw new Error('사용법: node scripts/migrate-sheets-to-supabase.mjs [--apply --backup /private/path.json | --verify]');
  if (args[i] === '--backup') i++;
}
if (apply && verifyOnly) throw new Error('--apply와 --verify는 함께 사용할 수 없습니다.');
if (backupIndex >= 0 && (!backupPath || backupPath.startsWith('--'))) throw new Error('--backup 파일 경로가 필요합니다.');
if (apply && !backupPath) throw new Error('--apply에는 --backup 파일 경로가 필요합니다.');
if (backupPath && !apply) throw new Error('--backup은 --apply와 함께 사용하세요.');

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} 환경변수가 필요합니다. 비밀값은 채팅/명령 인수가 아닌 보안 환경변수로 전달하세요.`);
  return value;
}
try {
const gasUrl = required('GAS_URL');
const gasSecret = required('GAS_SECRET');
const store = supabaseStore(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));
if (new URL(gasUrl).protocol !== 'https:') throw new Error('GAS_URL은 HTTPS여야 합니다.');

async function readSource() {
  const source = {};
  for (const sheet of names) {
    const response = await fetch(gasUrl, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ op: 'list', sheet, secret: gasSecret }),
      redirect: 'follow', signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) throw new Error(`${sheet}: Sheets 읽기 실패 (HTTP ${response.status})`);
    let body;
    try { body = await response.json(); } catch { throw new Error(`${sheet}: Sheets 응답 형식 오류`); }
    // Old installations may predate MentorMeetings. Treat only the exact missing
    // sheet error as empty, matching the existing app's adapter.
    if (!body.ok && String(body.error).startsWith('시트 없음:')) body = { ok: true, result: [] };
    if (!body.ok || !Array.isArray(body.result)) throw new Error(`${sheet}: Sheets 읽기 실패. URL, 권한 및 SECRET을 확인하세요.`);
    const seen = new Set();
    for (const row of body.result) {
      if (!row || typeof row.id !== 'string' || !row.id || seen.has(row.id)) throw new Error(`${sheet}: 비어 있거나 중복된 ID가 있습니다. 원본을 확인하세요.`);
      seen.add(row.id);
    }
    source[sheet] = body.result;
  }
  return source;
}
async function readTarget() {
  const result = {};
  for (const sheet of names) result[sheet] = await store.list(sheet);
  return result;
}
function compare(source, target, exact) {
  for (const sheet of names) {
    const sourceRows = new Map(source[sheet].map(row => [row.id, row]));
    const targetRows = new Map(target[sheet].map(row => [row.id, row]));
    // Never overwrite or silently accept unrelated target data.
    for (const [id, row] of targetRows) {
      if (!sourceRows.has(id) || !isDeepStrictEqual(row, sourceRows.get(id))) throw new Error(`${sheet}: 대상 데이터 충돌. 덮어쓰지 않고 중단했습니다.`);
    }
    if (exact && sourceRows.size !== targetRows.size) throw new Error(`${sheet}: 원본/대상 건수가 다릅니다.`);
  }
}

  const source = await readSource();
  const target = await readTarget();
  compare(source, target, verifyOnly);
  for (const sheet of names) console.log(`${sheet}: source=${source[sheet].length}, target=${target[sheet].length}, pending=${source[sheet].length - target[sheet].length}`);
  if (!apply) {
    console.log(verifyOnly ? 'PASS: 모든 ID와 필드 값이 일치합니다.' : 'DRY RUN: 충돌 없음. 아직 데이터를 쓰지 않았습니다. 원본 쓰기를 중단하고 --apply --backup으로 실행하세요.');
  } else {
    // A backup contains personal data and access codes: never commit or print it.
    // Exclusive creation protects an existing backup from accidental replacement.
    await writeFile(resolve(backupPath), JSON.stringify({ exportedAt: new Date().toISOString(), tables: source }), { flag: 'wx', mode: 0o600 });
    for (const sheet of names) {
      const existing = new Set(target[sheet].map(row => row.id));
      for (const row of source[sheet]) if (!existing.has(row.id)) await store.insert(sheet, row);
    }
    // Re-read both sides using a fresh request-scoped cache and detect source writes.
    const freshSource = await readSource();
    compare(source, freshSource, true);
    const freshStore = supabaseStore(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'));
    const finalTarget = {};
    for (const sheet of names) finalTarget[sheet] = await freshStore.list(sheet);
    compare(freshSource, finalTarget, true);
    console.log('PASS: 복사 완료. 모든 ID와 필드 값 검증 완료. 운영 환경의 STORAGE_PROVIDER를 전환하기 전에 쓰기 중단을 유지하세요.');
  }
} catch (error) {
  // Never print HTTP bodies, credentials, or source rows.
  console.error(error instanceof Error ? error.message : '이전 실패');
  process.exitCode = 1;
}
