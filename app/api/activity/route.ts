import { after, NextRequest, NextResponse } from 'next/server';
import { activityCookies, context, record, sameOrigin } from '@/lib/activity-server';
import { safePath } from '@/lib/activity';
// Per-instance abuse guard, in addition to Vercel's edge protection. Never stores raw IPs.
import { createHash } from 'node:crypto';
export const maxDuration=60;
const buckets=new Map<string,{count:number;at:number}>();
export async function POST(req:NextRequest) {
 if(!sameOrigin(req))return NextResponse.json({ok:false},{status:403});
 const key=createHash('sha256').update(req.headers.get('x-forwarded-for')||'unknown').digest('hex');
 const now=Date.now();for(const [k,v] of buckets)if(now-v.at>60000)buckets.delete(k);
 const b=buckets.get(key)||{count:0,at:now};b.count++;buckets.set(key,b);
 if(b.count>120||buckets.size>10000)return NextResponse.json({ok:false},{status:429});
 try {
 const raw=await req.text();if(raw.length>2048)return NextResponse.json({ok:false},{status:413});
 const data=JSON.parse(raw);if(!['page_view','tab_view'].includes(data.event))return NextResponse.json({ok:false},{status:400});
 const c=context(req);const path=safePath(data.path);
 let source='direct';try{const u=new URL(String(data.referrer));source=u.origin===req.nextUrl.origin?'internal':u.hostname.slice(0,100);}catch{}
 const tab=typeof data.tab==='string'?data.tab.replace(/[^\p{L}\p{N} _·-]/gu,'').slice(0,60):'';
 after(()=>record(c,data.event,{path,tab,source,status:200}));
 return activityCookies(NextResponse.json({ok:true}),c);
 }catch{return NextResponse.json({ok:false},{status:400});}
}

import { serverStore } from '@/lib/server-store';
import type { User } from '@/lib/schema';
import { normalizeActivity } from '@/lib/activity';
export async function GET(req:NextRequest){
 try{
 const c=context(req);
 if(!c.user)return NextResponse.json({error:'로그인이 필요합니다.'},{status:401});
 const user=(await serverStore().list<User>('Users')).find(u=>u.email.toLowerCase()===c.user.toLowerCase());
 if(!user||String(user.is_admin)!=='true')return NextResponse.json({error:'관리자만 조회할 수 있습니다.'},{status:403});
 const from=req.nextUrl.searchParams.get('from')||'',to=req.nextUrl.searchParams.get('to')||'';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||to<from||Date.parse(to)-Date.parse(from)>30*86400000)return NextResponse.json({error:'조회 기간은 최대 31일입니다.'},{status:400});
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return NextResponse.json({error:'로그 DB 연결 설정이 필요합니다.'},{status:503});
 const initial=req.nextUrl.searchParams.get('cursor')||'0';
 if(!/^\d{1,20}$/.test(initial))return NextResponse.json({error:'잘못된 커서입니다.'},{status:400});
 const rows:ReturnType<typeof normalizeActivity>[]=[];let cursor=initial,truncated=false;
 while(true){
 const q=new URLSearchParams({select:'seq,data',order:'seq.asc',limit:'500',seq:`gt.${cursor}`,and:`(data->>ts.gte.${from}T00:00:00.000Z,data->>ts.lte.${to}T23:59:59.999Z)`});
 const r=await fetch(`${url}/rest/v1/km_audit_log?${q}`,{headers:{apikey:key,Authorization:`Bearer ${key}`},cache:'no-store',signal:AbortSignal.timeout(10000)});
 if(!r.ok)throw new Error('DB');
 const page:{seq:number|string;data:Record<string,unknown>}[]=await r.json();if(!page.length)break;
 if(rows.length+page.length>10000){truncated=true;break;}
 rows.push(...page.map(p=>normalizeActivity(p.data)));const next=String(page.at(-1)!.seq);if(BigInt(next)<=BigInt(cursor))throw new Error('cursor');cursor=next;
 }
 return NextResponse.json({rows:rows.sort((a,b)=>b.ts.localeCompare(a.ts)),truncated,nextCursor:truncated?cursor:null},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'로그를 불러오지 못했습니다. 잠시 후 다시 시도하세요.'},{status:500});}
}
