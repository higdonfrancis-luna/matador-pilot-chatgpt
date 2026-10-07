import {load,type CheerioAPI,type Cheerio} from 'cheerio';
import type {AnyNode} from 'domhandler';
import {toHTML} from '@portabletext/to-html';
import type {PortableTextBlock} from '@portabletext/types';
import {createDataAttribute} from 'next-sanity';
import {createImageUrlBuilder} from '@sanity/image-url';
import type {HomePage,ContentDocument,RichBlock} from './content-types';
export function safeUrl(raw:unknown):string{
 if(typeof raw!=='string')return '';
 const value=raw.trim();
 if(value.startsWith('#')||(value.startsWith('/')&&!value.startsWith('//')&&!value.includes('\\')))return value;
 try{const url=new URL(value);return ['https:','http:','mailto:','tel:'].includes(url.protocol)?value:''}catch{return ''}
}
export function richHtml(value:RichBlock[]|undefined){return toHTML((value||[]) as unknown as PortableTextBlock[],{components:{marks:{link:({children,value})=>{const href=safeUrl(value?.href);return href?`<a href="${escapeHtml(href)}">${children}</a>`:children}}}})}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))}
export function youtubeId(raw:string|undefined){
 try{const u=new URL(raw||'');if(!['www.youtube.com','youtube.com','m.youtube.com','youtu.be','www.youtube-nocookie.com','youtube-nocookie.com'].includes(u.hostname))return '';const id=u.hostname==='youtu.be'?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]||'';return /^[\w-]{11}$/.test(id)?id:''}catch{return ''}
}
function imageUrl(doc:ContentDocument,field:'image'|'logo'|'photo'|'thumbnail'){
 const image=doc[field];
 if(image?.asset?._ref&&process.env.NEXT_PUBLIC_SANITY_PROJECT_ID){
  let builder=createImageUrlBuilder({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production'}).image(image).auto('format');
  if(field==='thumbnail')builder=builder.width(1200).height(675).fit('crop');
  else if(field==='photo')builder=builder.width(240).height(240).fit('crop');
  else builder=builder.width(field==='logo'?600:1200).fit('max');
  return builder.url();
 }
 return doc[`${field}AssetUrl`]||doc[`${field}Url`];
}
export function renderHome(template:string,home:HomePage,editing=false){
 const $=load(template,null,false);
 const annotate=(node:Cheerio<AnyNode>,doc:ContentDocument,field:string)=>{if(editing)node.attr('data-sanity',createDataAttribute({id:doc._id,type:doc._type,path:field,baseUrl:'/studio',projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production'}).toString())};
 const setText=(node:Cheerio<AnyNode>,value:string|undefined,doc:ContentDocument,field:string)=>{node.text(value||'');annotate(node,doc,field)};
 const setImage=(node:Cheerio<AnyNode>,url:string|undefined,alt:string,doc:ContentDocument,field:string)=>{if(!safeUrl(url)){node.remove();return}node.attr('src',safeUrl(url)).attr('alt',alt).removeAttr('srcset sizes width height');annotate(node,doc,field)};
 const title=$('.elementor-element-2cddf35 .elementor-heading-title');setText(title,home.heroTitle,home,'heroTitle');
 const body=$('.elementor-element-8699402 .elementor-widget-container');body.html(richHtml(home.heroBody));annotate(body,home,'heroBody');
 const bindings=new Map((home.sections??[]).flatMap(section=>(section.blocks??[]).map(block=>[block.key,{block,field:`sections[_key=="${section._key}"].blocks[_key=="${block._key}"]`} ] as const)));
 $('[data-content-key]').each((_,el)=>{
  const node=$(el),entry=bindings.get(node.attr('data-content-key')||'');if(!entry)return;
  const {block,field}=entry;
  if(block.kind==='richText'){node.html(richHtml(block.body));annotate(node,home,`${field}.body`)}
  else if(block.kind==='link'){node.attr('href',safeUrl(block.href));const text=node.find('.elementor-button-text');setText(text.length?text:node,block.text,home,`${field}.text`)}
  else setText(node,block.text,home,`${field}.text`);
 });
 function carousel(id:string,documents:ContentDocument[],fill:(slide:Cheerio<AnyNode>,doc:ContentDocument)=>void){
  const track=$(`.elementor-element-${id} .swiper-wrapper`).first(),prototype=track.children('.swiper-slide').first().clone();
  track.empty();documents.forEach(doc=>{const slide=prototype.clone();slide.removeAttr('aria-hidden inert');slide.find('[id]').removeAttr('id');fill(slide,doc);track.append(slide)});
 }
 for(const [id,docs] of [['5fe1ff36',home.heroTestimonials],['77b7873',home.footerTestimonials]] as const){
  carousel(id,docs||[],(slide,doc)=>{
   setImage(slide.find('[data-id="e95a399"] img'),imageUrl(doc,'logo'),doc.logo?.alt||doc.firm||doc.name||'',doc,doc.logoAssetUrl?'logo':'logoUrl');
   setText(slide.find('[data-id="52e25d8"] .elementor-widget-container'),doc.quote,doc,'quote');
   if(id==='5fe1ff36'){
    setImage(slide.find('[data-id="c5f1796"] img'),imageUrl(doc,'photo'),doc.photo?.alt||doc.name||'',doc,doc.photoAssetUrl?'photo':'photoUrl');
    setText(slide.find('[data-id="3da8b7e"] .elementor-heading-title'),doc.name,doc,'name');
   }else{
    setImage(slide.find('[data-id="fa3c5e7"] img'),imageUrl(doc,'photo'),doc.photo?.alt||doc.name||'',doc,doc.photoAssetUrl?'photo':'photoUrl');
    setText(slide.find('.elementor-image-box-title'),doc.name,doc,'name');
   }
  });
 }
 carousel('4fe8a63',home.memberVideos||[],(slide,doc)=>{
  const videoId=youtubeId(doc.youtubeUrl);
  const video=slide.find('.preview-video');video.attr('data-video',/^[\w-]{11}$/.test(videoId)?videoId:'');annotate(video,doc,'youtubeUrl');
  setImage(video.find('img'),imageUrl(doc,'thumbnail'),doc.firmName||'Member video',doc,doc.thumbnailAssetUrl?'thumbnail':'thumbnailUrl');
  setText(slide.find('[data-id="cd7bdd4"] .elementor-button-text'),doc.firmName,doc,'firmName');
  slide.find('[data-id="cd7bdd4"] a').attr('href',safeUrl(doc.sourceUrl));
  for(const [id,field] of [['84181ed','practiceArea'],['135848f','quote'],['0d2423e','reviewer']] as const)setText(slide.find(`[data-id="${id}"] .elementor-icon-list-text`),doc[field],doc,field);
 });
 carousel('a5c5f19',home.caseStudies||[],(slide,doc)=>{
  setImage(slide.find('[data-id="edc28f8"] img'),imageUrl(doc,'image'),doc.image?.alt||doc.title||'',doc,doc.imageAssetUrl?'image':'imageUrl');
  setText(slide.find('[data-id="5bdb832"] .elementor-icon-list-text'),doc.metric,doc,'metric');
  setText(slide.find('[data-id="ddbed22"] .elementor-widget-container'),doc.summary,doc,'summary');
  setText(slide.find('[data-id="93be69a"] .elementor-icon-list-text'),doc.services?.join(', '),doc,'services');
  slide.find('a').attr('href',safeUrl(doc.sourceUrl));
 });
 carousel('0633515',home.resources||[],(slide,doc)=>{
  setImage(slide.find('[data-id="5945f31"] img'),imageUrl(doc,'image'),doc.image?.alt||doc.title||'',doc,doc.imageAssetUrl?'image':'imageUrl');
  setText(slide.find('[data-id="46acc5d"] .elementor-heading-title a'),doc.title,doc,'title');
  slide.find('a').attr('href',safeUrl(doc.sourceUrl));
 });
 carousel('5631cf8',home.firmExperiences||[],(slide,doc)=>{
  setText(slide.find('.elementor-testimonial__text'),doc.quote,doc,'quote');
  setText(slide.find('.elementor-testimonial__name'),doc.name,doc,'name');
  setText(slide.find('.elementor-testimonial__title'),doc.firm,doc,'firm');
 });
 for(const [id,docs] of [['04ad8bc',home.pressLogos],['3e35998',home.clientLogos],['889c979',home.pressLogos]] as const)carousel(id,docs||[],(slide,doc)=>setImage(slide.find('img'),imageUrl(doc,'image'),doc.image?.alt||doc.alt||doc.title||'',doc,doc.imageAssetUrl?'image':'imageUrl'));
 return $.html();
}
