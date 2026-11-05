import { SHEETS, type Row, type SheetName } from './schema';

// 저장소 어댑터: live 모드는 Apps Script(Google Sheets), demo 모드는 localStorage.
export interface Store {
  list<T extends Row = Row>(sheet: SheetName): Promise<T[]>;
  insert<T extends Row>(sheet: SheetName, row: T): Promise<T>;
  update<T extends Row = Row>(sheet: SheetName, id: string, patch: Partial<T>): Promise<T>;
}

// ---- Apps Script 어댑터 (서버 전용) ----
export function gasStore(url: string, secret: string): Store {
  const cache = new Map<SheetName, Row[]>();
  async function call(body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, secret }),
      redirect: 'follow',
      cache: 'no-store',
    });
    const text = await res.text();
    let data: { ok: boolean; error?: string; result?: unknown };
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Apps Script 응답을 읽을 수 없습니다 (HTTP ${res.status}). 배포 URL과 접근 권한을 확인하세요.`);
    }
    if (!data.ok) throw new Error(data.error || 'Apps Script 오류');
    return data.result;
  }
  return {
    async list<T extends Row>(sheet: SheetName) {
      if (!cache.has(sheet)) cache.set(sheet, (await call({ op: 'list', sheet })) as Row[]);
      return cache.get(sheet) as T[];
    },
    async insert<T extends Row>(sheet: SheetName, row: T) {
      cache.delete(sheet);
      return (await call({ op: 'insert', sheet, row, headers: SHEETS[sheet] })) as T;
    },
    async update<T extends Row>(sheet: SheetName, id: string, patch: Partial<T>) {
      cache.delete(sheet);
      return (await call({ op: 'update', sheet, id, patch, headers: SHEETS[sheet] })) as T;
    },
  };
}

export async function gasSetup(url: string, secret: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ op: 'setup', secret, sheets: SHEETS }),
    redirect: 'follow',
  });
  return res.json();
}

// ---- localStorage 어댑터 (데모) ----
const LS_KEY = 'keepmentor-demo-v1';

type DB = Partial<Record<SheetName, Row[]>>;

function readDb(): DB {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as DB) : {};
  } catch {
    return {};
  }
}
function writeDb(db: DB) {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    /* 저장 불가(사생활 보호 모드 등) — 메모리에서만 유지 */
  }
}

let memDb: DB | null = null;
function db(): DB {
  if (!memDb) memDb = readDb();
  return memDb;
}

export function localStore(): Store {
  return {
    async list<T extends Row>(sheet: SheetName) {
      return ((db()[sheet] ?? []) as T[]).map((r) => ({ ...r }));
    },
    async insert<T extends Row>(sheet: SheetName, row: T) {
      const d = db();
      d[sheet] = [...(d[sheet] ?? []), row];
      writeDb(d);
      return row;
    },
    async update<T extends Row>(sheet: SheetName, id: string, patch: Partial<T>) {
      const d = db();
      const rows = d[sheet] ?? [];
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw new Error(`${sheet}에서 ${id}를 찾을 수 없습니다`);
      rows[i] = { ...rows[i], ...patch };
      writeDb(d);
      return rows[i] as T;
    },
  };
}

export function localIsEmpty() {
  return !(db().Users ?? []).length;
}
export function localReset() {
  memDb = {};
  writeDb({});
}
