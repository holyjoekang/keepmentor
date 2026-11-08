'use client';

import { useEffect, useState } from 'react';
import { call } from '@/lib/client';
import { Status, useAsync } from './ui';
import type { Actions } from '@/lib/actions';
import type { User } from '@/lib/schema';

type Assignment = Awaited<ReturnType<Actions['engagementAssignments']>>[number];
type Role = '' | 'mentor' | 'mentee' | 'institution';

export function EngagementRoles({ users }: { users: User[] }) {
  const [list, setList] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState('');
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const { busy, error, ok, run } = useAsync();
  const [loadError, setLoadError] = useState('');
  useEffect(() => { call('engagementAssignments').then(setList).catch((e) => setLoadError((e as Error).message)); }, []);
  function choose(id: string, assignments = list) {
    setSelected(id);
    const e = assignments.find((item) => item.id === id);
    const next: Record<string, Role> = {};
    if (e) {
      if (e.mentor_email) next[e.mentor_email.toLowerCase()] = 'mentor';
      for (const email of e.mentee_emails) next[email.toLowerCase()] = 'mentee';
      for (const email of e.institution_emails) next[email.toLowerCase()] = 'institution';
    }
    setRoles(next);
  }
  return (
    <div className="card">
      <h2>멘토링별 역할 배정</h2>
      <p className="small muted">각 건에 멘토·멘티·기관 담당자를 지정합니다. 배정된 건만 조회할 수 있으며, 기관 담당자는 조회만 가능합니다. 시스템 관리 권한만으로 다른 건의 내용이 공개되지는 않습니다.</p>
      <label htmlFor="role-engagement">멘토링 선택</label>
      <select id="role-engagement" value={selected} onChange={(e) => choose(e.target.value)}>
        <option value="">선택하세요</option>
        {list.map((e) => <option key={e.id} value={e.id}>{e.company} · {e.id}</option>)}
      </select>
      {selected && <>
        <table><thead><tr><th>사용자</th><th>이 건의 역할</th></tr></thead><tbody>
          {users.map((u) => <tr key={u.id}><td>{u.name}<div className="small muted">{u.email}</div></td><td>
            <select aria-label={`${u.name}의 역할`} value={roles[u.email.toLowerCase()] ?? ''} onChange={(event) => {
              const role = event.target.value as Role;
              const next = { ...roles };
              if (role === 'mentor') for (const address of Object.keys(next)) if (next[address] === 'mentor') next[address] = '';
              next[u.email.toLowerCase()] = role;
              setRoles(next);
            }}>
              <option value="">배정 안 함</option><option value="mentor">멘토</option><option value="mentee">멘티</option><option value="institution">기관 담당자</option>
            </select>
          </td></tr>)}
        </tbody></table>
        <button className="primary" disabled={busy} onClick={() => run(async () => {
          const addresses = (role: Role) => Object.keys(roles).filter((email) => roles[email] === role);
          await call('assignEngagementRoles', selected, { mentor_email: addresses('mentor')[0] ?? '', mentee_emails: addresses('mentee'), institution_emails: addresses('institution') });
          const updated = await call('engagementAssignments');
          setList(updated); choose(selected, updated);
        }, '역할을 저장했습니다.')}>역할 저장</button>
      </>}
      <Status error={error || loadError} ok={ok} />
    </div>
  );
}
