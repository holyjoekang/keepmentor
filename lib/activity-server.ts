import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE, sign, verify } from './session';
import { safePath } from './activity';

export function context(req:NextRequest) {
 const identity=(name:string)=>{const id=verify(req.cookies.get(`km_${name}`)?.value);return id?.startsWith(`activity:${name}:`)?id:`activity:${name}:${randomUUID()}`;};
 const ua=req.headers.get('user-agent')||'';
 return { visitor:identity('visitor'),session:identity('visit'),user:verify(req.cookies.get(COOKIE)?.value)||'',device:/bot|crawler|spider/i.test(ua)?'bot':/Mobile|Android|iPhone/i.test(ua)?'mobile':/iPad|Tablet/i.test(ua)?'tablet':'desktop',browser:/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'other' };
}
export function activityCookies(res:NextResponse,c:ReturnType<typeof context>) {
 for(const [name,value,maxAge] of [['visitor',c.visitor,604800],['visit',c.session,1800]] as const) res.cookies.set(`km_${name}`,sign(value),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge});
 return res;
}
export async function record(c:ReturnType<typeof context>,event:string,extra:{path?:string;tab?:string;source?:string;status?:number;duration?:number;action?:string;target?:string}={}) {
 try {
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return;
 const id=`ACT-${randomUUID()}`;
 const {user,...identity}=c;
 const row={id,ts:new Date().toISOString(),user_email:user,action:event,sheet:'Activity',row_id:'',detail:JSON.stringify({...identity,...extra,path:safePath(extra.path)})};
 const r=await fetch(`${url}/rest/v1/km_audit_log`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({id,data:row}),signal:AbortSignal.timeout(3000),cache:'no-store'});
 if(!r.ok) console.warn('Activity write failed',r.status);
 } catch { console.warn('Activity write unavailable'); }
}
export function sameOrigin(req:NextRequest) { const origin=req.headers.get('origin');return !origin || origin===req.nextUrl.origin; }
