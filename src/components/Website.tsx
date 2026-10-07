'use client';
import {useEffect,useRef} from 'react';
import {useRouter} from 'next/navigation';
import {VisualEditing} from 'next-sanity/visual-editing';
import {initializePreview} from '@/lib/preview-interactions';
export function Website({html,draft}:{html:string;draft:boolean}){
 const root=useRef<HTMLDivElement>(null);const router=useRouter();
 useEffect(()=>{const node=root.current;if(!node)return;node.innerHTML=html;const cleanup=initializePreview(node);return()=>{cleanup();node.replaceChildren()}},[html]);
 useEffect(()=>{if(!draft)return;const timer=setInterval(()=>{if(!document.hidden)router.refresh()},2000);return()=>clearInterval(timer)},[draft,router]);
 return <><div ref={root} dangerouslySetInnerHTML={{__html:html}}/>{draft&&<VisualEditing/>}</>;
}
