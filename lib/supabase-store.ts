import type { Row, SheetName } from './schema';
import type { Store } from './store';

// Server-only adapter: never import this module from a client component.
export const TABLES: Record<SheetName, string> = {
  Users: 'km_users', Programs: 'km_programs', Companies: 'km_companies',
  Engagements: 'km_engagements', Assessments: 'km_assessments', Sessions: 'km_sessions',
  Experiments: 'km_experiments', AIJobs: 'km_ai_jobs', PanelRuns: 'km_panel_runs',
  MentorMeetings: 'km_mentor_meetings', AuditLog: 'km_audit_log',
};

export function supabaseStore(url: string, key: string): Store & { check(): Promise<void> } {
  if (typeof window !== 'undefined') throw new Error('DB 연결은 서버에서만 사용할 수 있습니다.');
  const endpoint = new URL(url);
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !['', '/'].includes(endpoint.pathname)) {
    throw new Error('SUPABASE_URL은 HTTPS 프로젝트 기본 URL이어야 합니다.');
  }
  const base = `${endpoint.origin}/rest/v1`;
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${base}/${path}`, {
      ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
    });
    // Do not expose database responses: they may include record values or SQL details.
    if (!response.ok) throw new Error(`DB 요청 실패 (HTTP ${response.status}). 서버 연결 설정과 DB 마이그레이션을 확인하세요.`);
    return response.status === 204 || init.method === 'HEAD' ? null : response.json();
  }
  function table(sheet: SheetName) {
    const name = TABLES[sheet];
    if (!name) throw new Error('알 수 없는 테이블입니다.');
    return name;
  }
  const cache = new Map<SheetName, Row[]>();
  return {
    async check() {
      for (const name of Object.values(TABLES)) await request(`${name}?select=id&limit=0`, { method: 'HEAD' });
    },
    async list<T extends Row>(sheet: SheetName): Promise<T[]> {
      if (!cache.has(sheet)) {
        const rows: Row[] = [];
        let cursor = '0';
        // Cursor pagination also works when the project's API row limit is below 500.
        for (;;) {
          const query = new URLSearchParams({ select: 'seq,data', order: 'seq.asc', limit: '500', seq: `gt.${cursor}` });
          const page: { seq: number | string; data: Row }[] = await request(`${table(sheet)}?${query}`);
          if (!page.length) break;
          const next = String(page[page.length - 1].seq);
          if (BigInt(next) <= BigInt(cursor)) throw new Error('DB 페이지 순서가 올바르지 않습니다.');
          rows.push(...page.map((item) => item.data));
          cursor = next;
        }
        cache.set(sheet, rows);
      }
      return structuredClone(cache.get(sheet)) as T[];
    },
    async insert<T extends Row>(sheet: SheetName, row: T): Promise<T> {
      const result: { data: T }[] = await request(table(sheet), {
        method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ id: row.id, data: row }),
      });
      cache.delete(sheet);
      if (result.length !== 1) throw new Error('DB 저장 결과를 확인할 수 없습니다.');
      return result[0].data;
    },
    async update<T extends Row>(sheet: SheetName, id: string, patch: Partial<T>): Promise<T> {
      const result = await request('rpc/km_patch_row', {
        method: 'POST', body: JSON.stringify({ table_name: table(sheet), row_id: id, patch }),
      });
      cache.delete(sheet);
      if (!result) throw new Error(`${sheet}에서 기록을 찾을 수 없습니다.`);
      return result as T;
    },
  };
}
