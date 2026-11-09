'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Status, TopBar, useAsync, useMe } from '@/components/ui';
import { call } from '@/lib/client';
import { EngagementRoles } from '@/components/EngagementRoles';
import type { Program, User } from '@/lib/schema';

export default function AdminPage() {
  const me = useMe();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [p, setP] = useState({ org_name: '', name: '', year: new Date().getFullYear(), session_count: 3, interval_weeks: 2 });
  const [u, setU] = useState({ email: '', name: '', affiliation: '', access_code: '', is_admin: false });
  const prog = useAsync();
  const usr = useAsync();

  async function load() {
    setPrograms(await call('programs'));
    setUsers(await call('users'));
  }
  useEffect(() => { if (me?.is_admin) load().catch(() => undefined); }, [me]);

  if (!me) return <TopBar />;
  if (!me.is_admin) return (<><TopBar me={me} /><div className="wrap"><div className="card">관리자만 볼 수 있습니다.</div></div></>);

  return (
    <>
      <TopBar me={me} />
      <div className="wrap">
        <div className="row between" style={{marginBottom:24}}><h1>관리</h1><Link href="/admin/analytics" className="btn primary">방문·활동 분석 →</Link></div>
        <div className="grid grid-2">
          <div className="card">
            <h2>프로그램</h2>
            <p className="small muted">기관 → 프로그램 → 멘토링 건. 회차 수와 간격은 프로그램 단위로 정합니다.</p>
            <table>
              <thead><tr><th>기관</th><th>프로그램</th><th>회차·간격</th></tr></thead>
              <tbody>{programs.map((x) => <tr key={x.id}><td>{x.org_name}</td><td>{x.name} ({x.year})</td><td>{x.session_count}회 · {x.interval_weeks}주</td></tr>)}</tbody>
            </table>
            <label>기관명</label><input value={p.org_name} onChange={(e) => setP({ ...p, org_name: e.target.value })} placeholder="경기 창조경제혁신센터" />
            <label>프로그램명</label><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
            <div className="grid grid-2" style={{ gap: 8 }}>
              <div><label>회차 수</label><input type="number" value={p.session_count} onChange={(e) => setP({ ...p, session_count: Number(e.target.value) })} /></div>
              <div><label>간격 (주)</label><input type="number" value={p.interval_weeks} onChange={(e) => setP({ ...p, interval_weeks: Number(e.target.value) })} /></div>
            </div>
            <Status error={prog.error} ok={prog.ok} />
            <button className="primary" style={{ marginTop: 8 }} disabled={prog.busy} onClick={() => prog.run(async () => { await call('createProgram', p); await load(); }, '추가했습니다.')}>프로그램 추가</button>
          </div>
          <div className="card">
            <h2>사용자</h2>
            <p className="small muted">멘토·멘티 모두 여기서 등록하고 접근 코드를 전달합니다. 등록 후 아래 멘토링별 역할 배정에서 담당 건과 역할을 지정하세요.</p>
            <table>
              <thead><tr><th>이름</th><th>이메일</th><th>소속</th></tr></thead>
              <tbody>{users.map((x) => <tr key={x.id}><td>{x.name} {String(x.is_admin) === 'true' && <span className="badge">관리자</span>}</td><td className="small">{x.email}</td><td className="small">{x.affiliation}</td></tr>)}</tbody>
            </table>
            <label>이름</label><input value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} />
            <label>이메일</label><input value={u.email} onChange={(e) => setU({ ...u, email: e.target.value })} />
            <label>소속</label><input value={u.affiliation} onChange={(e) => setU({ ...u, affiliation: e.target.value })} />
            <label>접근 코드</label><input value={u.access_code} onChange={(e) => setU({ ...u, access_code: e.target.value })} />
            <div className="row" style={{ marginTop: 8 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={u.is_admin} onChange={(e) => setU({ ...u, is_admin: e.target.checked })} /> <span className="small">시스템 관리자 (사용자·프로그램·역할 배정 관리)</span>
            </div>
            <Status error={usr.error} ok={usr.ok} />
            <button className="primary" style={{ marginTop: 8 }} disabled={usr.busy} onClick={() => usr.run(async () => { await call('createUser', u); setU({ email: '', name: '', affiliation: '', access_code: '', is_admin: false }); await load(); }, '등록했습니다.')}>사용자 등록</button>
          </div>
        </div>
        <EngagementRoles users={users} />
      </div>
    </>
  );
}
