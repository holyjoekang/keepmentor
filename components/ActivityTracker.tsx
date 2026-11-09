'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
export function ActivityTracker(){
 const pathname=usePathname();const last=useRef('');const queue=useRef(Promise.resolve());
 useEffect(()=>{
  if(process.env.NEXT_PUBLIC_MODE!=='live')return;
  const send=(event:string,tab='')=>{queue.current=queue.current.then(async()=>{try{await fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,path:pathname,tab,referrer:document.referrer}),keepalive:true});}catch{}});};
  if(last.current!==pathname){last.current=pathname;send('page_view');const tab=window.location.hash.slice(1);if(['overview','company','diagnosis','sessions','experiments','timeline','report','ai'].includes(tab))send('tab_view',tab);}
  const click=(e:MouseEvent)=>{const button=(e.target as Element)?.closest?.('.tabs button');if(button)send('tab_view',button.textContent?.trim()||'');};
  document.addEventListener('click',click);return()=>document.removeEventListener('click',click);
 },[pathname]);return null;
}
