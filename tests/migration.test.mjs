import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Exercise the real CLI with HTTP fixtures, including partial migration recovery.
async function run(scenario, flags = []) {
  const dir = await mkdtemp(join(tmpdir(), 'keepmentor-migration-test-'));
  const backup = join(dir, 'backup.json');
  const preload = join(dir, 'http.mjs');
  await writeFile(preload, `
    const scenario = ${JSON.stringify(scenario)};
    const row = {id:'user-1',email:'test@example.test',is_admin:false,nested:{a:[1,'한글']}};
    let inserted = false, reads = 0;
    const json = value => new Response(JSON.stringify(value));
    globalThis.fetch = async (url, init) => {
      if (String(url).startsWith('https://script.google.com/')) {
        const {sheet} = JSON.parse(init.body);
        if (sheet === 'Users') reads++;
        let result = sheet === 'Users' ? [row] : [];
        if (scenario === 'duplicate' && sheet === 'Users') result = [row,row];
        if (scenario === 'changed' && sheet === 'Users' && reads > 1) result = [{...row,name:'new write'}];
        return json({ok:true,result});
      }
      if (init.method === 'POST') {
        if (!['apply','changed'].includes(scenario)) throw Error('Unexpected write during dry-run/conflict/verify');
        inserted = true;
        return json([{data:JSON.parse(init.body).data}]);
      }
      const u = new URL(url);
      if (!u.pathname.endsWith('/km_users') || u.searchParams.get('seq') !== 'gt.0') return json([]);
      if (scenario === 'conflict') return json([{seq:1,data:{...row,email:'different@example.test'}}]);
      if (inserted || scenario === 'resume' || scenario === 'verified') return json([{seq:1,data:row}]);
      return json([]);
    };
  `);
  const args = flags.map(flag => flag === 'BACKUP' ? backup : flag);
  const result = spawnSync(process.execPath, ['--import', preload, 'scripts/migrate-sheets-to-supabase.mjs', ...args], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8',
    env: { ...process.env, GAS_URL: 'https://script.google.com/macros/s/test/exec', GAS_SECRET: 'fixture', SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'fixture' },
  });
  let exported, mode;
  try { exported = JSON.parse(await readFile(backup, 'utf8')); mode = (await stat(backup)).mode & 0o777; } catch {}
  await rm(dir, { recursive: true, force: true });
  return { ...result, exported, mode };
}

test('dry-run checks data without writing', async () => {
  const r = await run('dry'); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /DRY RUN/); assert.equal(r.exported, undefined);
});
test('copy creates private backup and verifies every field', async () => {
  const r = await run('apply', ['--apply','--backup','BACKUP']); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /PASS/); assert.equal(r.mode, 0o600); assert.equal(r.exported.tables.Users[0].nested.a[1], '한글');
});
test('verified equal target succeeds, incomplete target fails', async () => {
  const good = await run('verified',['--verify']); assert.equal(good.status,0,good.stderr);
  const bad = await run('dry',['--verify']); assert.equal(bad.status,1); assert.match(bad.stderr,/건수가 다릅니다/);
});
test('conflicting data and duplicate source IDs fail before writing', async () => {
  const conflict = await run('conflict',['--apply','--backup','BACKUP']); assert.equal(conflict.status,1); assert.match(conflict.stderr,/충돌/); assert.equal(conflict.exported,undefined);
  const duplicate = await run('duplicate'); assert.equal(duplicate.status,1); assert.match(duplicate.stderr,/중복/);
});
test('source writes during copying prevent a successful migration result', async () => {
  const r = await run('changed',['--apply','--backup','BACKUP']); assert.equal(r.status,1); assert.match(r.stderr,/충돌/);
});
test('a partially copied target can be resumed without overwriting', async () => {
  const r = await run('resume',['--apply','--backup','BACKUP']); assert.equal(r.status,0,r.stderr);
});
