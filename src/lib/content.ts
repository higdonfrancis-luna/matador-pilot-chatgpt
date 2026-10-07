import 'server-only';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {cache} from 'react';
import {draftMode} from 'next/headers';
import {sanityClient} from './sanity-client';
import type {HomePage,ContentDocument} from './content-types';
const arrays=['heroTestimonials','footerTestimonials','memberVideos','caseStudies','resources','firmExperiences','clientLogos','pressLogos'] as const;
export const homeQuery=`*[_type == "homePage" && _id == "homePage"][0]{...,${arrays.map(field=>`${field}[]->{...,"imageAssetUrl":image.asset->url,"logoAssetUrl":logo.asset->url,"photoAssetUrl":photo.asset->url,"thumbnailAssetUrl":thumbnail.asset->url}`).join(',')}}`;
export const getContent=cache(async()=>{
 const mode=process.env.CONTENT_MODE||'fixture';
 const draft=(await draftMode()).isEnabled;
 if(mode==='fixture'){
  const rows=(await readFile(path.join(process.cwd(),'data/pilot.ndjson'),'utf8')).trim().split('\n').map(line=>JSON.parse(line));
  const home=structuredClone(rows.find(doc=>doc._id==='homePage'));
  if(!home)throw new Error('Missing homePage fixture');
  const byId=new Map<string,ContentDocument>(rows.map(doc=>[doc._id,doc]));
  for(const field of arrays)home[field]=(home[field]||[]).map((ref:{_ref:string})=>{const doc=byId.get(ref._ref);if(!doc)throw new Error(`Missing fixture reference ${ref._ref}`);return doc});
  return {home:home as HomePage,mode:'fixture' as const,draft:false};
 }
 if(mode!=='sanity')throw new Error('CONTENT_MODE must be fixture or sanity.');
 if(draft&&!process.env.SANITY_API_READ_TOKEN)throw new Error('A Viewer token is required for draft preview.');
 const home=await sanityClient().fetch<HomePage|null>(homeQuery,{}, {perspective:draft?'drafts':'published',cache:'no-store'});
 if(!home)throw new Error('Sanity is connected but homePage has not been imported or published. Run the documented content import.');
 for(const field of arrays)if((home[field]||[]).some(doc=>!doc))throw new Error(`Resolve the missing ${field} references in Sanity.`);
 return {home,mode:'sanity' as const,draft};
});
