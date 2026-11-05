'use client';

import { useState } from 'react';
import { Status, useAsync } from '@/components/ui';
import { Icon } from '@/components/icons';
import { call } from '@/lib/client';
import { INDUSTRY_TEMPLATES } from '@/lib/methodology';
import type { Company } from '@/lib/schema';
import type { TabProps } from './types';

export function CompanyTab({ b, reload }: TabProps) {
  const [c, setC] = useState<Company>(b.company);
  const editable = b.role === 'mentor' || b.role === 'mentee';
  const { busy, error, ok, run } = useAsync();
  const set = (k: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setC({ ...c, [k]: e.target.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value });

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-title"><span className="ichip blue"><Icon name="building" /></span><h2>기업 프로필</h2></div>
        <label>기업명</label><input value={c.name ?? ''} onChange={set('name')} disabled={!editable} />
        <label>한 줄 소개</label><input value={c.summary ?? ''} onChange={set('summary')} disabled={!editable} />
        <div className="grid grid-2" style={{ gap: 8 }}>
          <div><label>사업자등록번호 (예비창업은 비움)</label><input value={c.biz_reg_no ?? ''} onChange={set('biz_reg_no')} disabled={!editable} /></div>
          <div><label>설립일</label><input type="date" value={c.founded_date ?? ''} onChange={set('founded_date')} disabled={!editable} /></div>
          <div>
            <label>업종 템플릿</label>
            <select value={c.industry ?? 'saas'} onChange={set('industry')} disabled={!editable}>
              {INDUSTRY_TEMPLATES.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label>팀 구성</label>
            <select value={c.team_type ?? ''} onChange={set('team_type')} disabled={!editable}>
              <option value="">선택</option><option>1인</option><option>공동창업</option>
            </select>
          </div>
          <div><label>인원 (명)</label><input type="number" value={c.headcount ?? ''} onChange={set('headcount')} disabled={!editable} /></div>
          <div><label>대표 주당 가용시간 (시간)</label><input type="number" value={c.ceo_weekly_hours ?? ''} onChange={set('ceo_weekly_hours')} disabled={!editable} /></div>
          <div><label>런웨이 (개월)</label><input type="number" value={c.runway_months ?? ''} onChange={set('runway_months')} disabled={!editable} /></div>
          <div><label>웹사이트</label><input value={c.website ?? ''} onChange={set('website')} disabled={!editable} /></div>
        </div>
        <label>기술 태그</label><input value={c.tech_tags ?? ''} onChange={set('tech_tags')} disabled={!editable} placeholder="AI, IoT ..." />
      </div>

      <div className="card">
        <div className="card-title"><span className="ichip "><Icon name="pen" /></span><h2>멘토링에서 다루고 싶은 이슈</h2></div>
        <p className="small muted">멘티가 직접 씁니다. AI 사전 브리핑은 이 세 칸이 채워져야 만들 수 있습니다.</p>
        <label className="human">현상 — 지금 무슨 일이 일어나고 있나</label>
        <textarea value={c.issue_symptom ?? ''} onChange={set('issue_symptom')} disabled={!editable} />
        <label className="human">시도해본 것</label>
        <textarea value={c.issue_tried ?? ''} onChange={set('issue_tried')} disabled={!editable} />
        <label className="human">원하는 결과</label>
        <textarea value={c.issue_wanted ?? ''} onChange={set('issue_wanted')} disabled={!editable} />
        <div className="row" style={{ marginTop: 12 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={String(c.consent_ai) !== 'false'}
            onChange={(e) => setC({ ...c, consent_ai: e.target.checked })} disabled={!editable} />
          <span className="small">AI 처리 동의 — 익명화된 데이터를 멘토가 Claude 프로젝트에서 처리하는 데 동의합니다.</span>
        </div>
        <Status error={error} ok={ok} />
        {editable && (
          <div style={{ marginTop: 12 }}>
            <button className="primary" disabled={busy} onClick={() => run(async () => { await call('saveCompany', b.engagement.id, c); await reload(); }, '저장했습니다.')}>저장</button>
          </div>
        )}
      </div>
    </div>
  );
}
