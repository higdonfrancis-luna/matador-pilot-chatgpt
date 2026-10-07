import type {Metadata} from 'next';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {getContent} from '@/lib/content';
import {renderHome} from '@/lib/render-home';
import {Website} from '@/components/Website';
export const dynamic='force-dynamic';
export async function generateMetadata():Promise<Metadata>{const {home}=await getContent();return {title:home.seoTitle,description:home.seoDescription,robots:{index:false,follow:false}}}
export default async function Page(){
 const {home,mode,draft}=await getContent();
 const template=await readFile(path.join(process.cwd(),'data/home-template.html'),'utf8');
 return <><Website html={renderHome(template,home,draft)} draft={draft}/><aside className="preview-review-bar" aria-label="Pilot status"><strong>{draft?'Sanity draft preview':mode==='sanity'?'Sanity pilot':'Content preview'}</strong><span>{mode==='fixture'?'Sanity is not connected yet. ':''}Homepage pilot · Forms are test-only · Other page links open the current site.</span><a href={draft?'/api/draft/disable':'/studio'} style={{color:'white',textDecoration:'underline'}}>{draft?'Exit draft preview':'Open editor'}</a></aside></>;
}
