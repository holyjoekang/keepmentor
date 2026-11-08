import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { supabaseStore } from '../lib/supabase-store.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const row = { id: 'USR-test', email: 'mentor@example.test', is_admin: false, nested: { flags: ['a'] } };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

test('pages through server-limited responses, preserves values, caches isolated copies', async () => {
  const requests = [];
  globalThis.fetch = async (url, init) => {
    requests.push(String(url));
    assert.equal(init.cache, 'no-store');
    assert.equal(init.headers.apikey, 'test-key');
    assert.equal(init.headers.Authorization, 'Bearer test-key');
    const cursor = new URL(url).searchParams.get('seq');
    return json(cursor === 'gt.0' ? [{ seq: 1, data: row }] : cursor === 'gt.1' ? [{ seq: 3, data: { id: 'USR-2' } }] : []);
  };
  const store = supabaseStore('https://project.supabase.co', 'test-key');
  const rows = await store.list('Users');
  assert.equal(rows.length, 2);
  rows[0].nested.flags.push('mutation');
  assert.deepEqual((await store.list('Users'))[0], row);
  assert.equal(requests.length, 3);
});

test('insert invalidates cached list and preserves complex JSON values', async () => {
  let saved = false;
  globalThis.fetch = async (url, init) => {
    if (init.method === 'POST') {
      assert.deepEqual(JSON.parse(init.body), { id: row.id, data: row });
      assert.equal(init.headers.Prefer, 'return=representation');
      saved = true; return json([{ data: row }], 201);
    }
    return json(saved && new URL(url).searchParams.get('seq') === 'gt.0' ? [{ seq: 1, data: row }] : []);
  };
  const store = supabaseStore('https://project.supabase.co', 'test-key');
  assert.deepEqual(await store.list('Users'), []);
  assert.deepEqual(await store.insert('Users', row), row);
  assert.deepEqual(await store.list('Users'), [row]);
});

test('update sends atomic patch, encoded safely, invalidates cache', async () => {
  let lists = 0;
  const id = 'USR-&?"';
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/rpc/km_patch_row')) {
      assert.deepEqual(JSON.parse(init.body), { table_name: 'km_users', row_id: id, patch: { name: '수정' } });
      return json({ ...row, id, name: '수정' });
    }
    lists++; return json([]);
  };
  const store = supabaseStore('https://project.supabase.co', 'test-key');
  await store.list('Users');
  assert.equal((await store.update('Users', id, { name: '수정' })).name, '수정');
  await store.list('Users');
  assert.equal(lists, 2);
});

test('missing row and HTTP errors fail without leaking server response data', async () => {
  const store = supabaseStore('https://project.supabase.co', 'test-key');
  globalThis.fetch = async () => json(null);
  await assert.rejects(store.update('Users', 'missing', {}), /찾을 수 없습니다/);
  globalThis.fetch = async () => json({ error: 'private-row-value' }, 403);
  await assert.rejects(store.list('Users'), error => /403/.test(error.message) && !error.message.includes('private-row-value'));
});

test('rejects unsafe endpoints', () => {
  for (const url of ['http://project.supabase.co', 'https://user:password@project.supabase.co', 'https://project.supabase.co/path']) {
    assert.throws(() => supabaseStore(url, 'key'), /HTTPS/);
  }
});
