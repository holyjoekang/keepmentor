// Pure helpers shared by collection, analysis and tests. No request bodies are stored.
export const EVENTS = ['page_view','tab_view','login_success','login_failure','logout','api_success','api_failure'] as const;
export type Activity = { id:string; ts:string; event:string; user:string; visitor:string; session:string; path:string; tab:string; device:string; browser:string; source:string; status:number; duration:number; action:string; target:string };
export function safePath(value: unknown) {
  const path = String(value ?? '').split(/[?#]/)[0];
  return /^\/(?:|home|meetings|admin(?:\/analytics)?|login|cases(?:\/[A-Za-z0-9_-]{1,100})?|about|solutions|method|guide|setup|eng\/[A-Za-z0-9_-]{1,100}(?:\/brief)?)$/.test(path) ? path : '/other';
}
export function normalizeActivity(row: Record<string, unknown>): Activity {
  let d: Record<string, unknown> = {};
  if(row.sheet === 'Activity') { try { d=JSON.parse(String(row.detail)); } catch {} }
  const text=(k:string)=>typeof d[k]==='string' ? String(d[k]).slice(0,200) : '';
  return { id:String(row.id), ts:String(row.ts ?? ''), event:row.sheet==='Activity'?String(row.action):'audit', user:String(row.user_email ?? ''), visitor:text('visitor'), session:text('session'), path:text('path'), tab:text('tab'), device:text('device'), browser:text('browser'), source:text('source'), status:Number(d.status)||0, duration:Number(d.duration)||0, action:row.sheet==='Activity'?text('action'):String(row.action ?? ''), target:row.sheet==='Activity'?text('target'):`${row.sheet ?? ''}/${row.row_id ?? ''}` };
}
export function summarize(rows: Activity[]) {
  const counts=(key: keyof Activity)=>Object.entries(rows.reduce<Record<string,number>>((a,r)=>{const k=String(r[key]||'(없음)');a[k]=(a[k]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]);
  return { events:rows.length, views:rows.filter(r=>r.event==='page_view').length, visitors:new Set(rows.map(r=>r.visitor||r.user).filter(Boolean)).size, sessions:new Set(rows.map(r=>r.session).filter(Boolean)).size, failures:rows.filter(r=>r.event==='login_failure'||r.event==='api_failure').length, days:Object.entries(rows.reduce<Record<string,number>>((a,r)=>{const k=r.ts.slice(0,10);a[k]=(a[k]||0)+1;return a;},{})).sort(), paths:counts('path'), types:counts('event'), users:counts('user'), devices:counts('device'), sources:counts('source') };
}
export function csvCell(value:unknown) { let s=String(value??''); if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'; }
