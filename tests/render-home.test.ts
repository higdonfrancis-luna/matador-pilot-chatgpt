import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'cheerio';
import {renderHome,safeUrl,youtubeId} from '../src/lib/render-home';
import type {HomePage} from '../src/lib/content-types';
const documents=readFileSync('data/pilot.ndjson','utf8').trim().split('\n').map(line=>JSON.parse(line));
const template=readFileSync('data/home-template.html','utf8');
function home(){const h=structuredClone(documents.find(d=>d._id==='homePage'));for(const key of ['heroTestimonials','footerTestimonials','memberVideos','caseStudies','resources','firmExperiences','clientLogos','pressLogos'])h[key]=h[key].map((r:{_ref:string})=>structuredClone(documents.find(d=>d._id===r._ref)));return h as HomePage}
test('CMS changes replace the rendered content and order while keeping card links',()=>{
 const h=home();h.heroTitle='CMS headline test';h.heroTestimonials.reverse();h.heroTestimonials[0].quote='Changed quote';h.caseStudies[0].metric='42%';h.resources[0].title='Changed resource';
 const $=load(renderHome(template,h));
 assert.equal($('.elementor-element-2cddf35 .elementor-heading-title').text(),'CMS headline test');
 assert.equal($('.elementor-element-5fe1ff36 .swiper-slide').first().find('[data-id="52e25d8"]').text().trim(),'Changed quote');
 assert.equal($('.elementor-element-a5c5f19 .swiper-slide').length,6);
 assert.equal($('.elementor-element-a5c5f19 .swiper-slide').first().find('[data-id="5bdb832"]').text().trim(),'42%');
 assert.equal($('.elementor-element-0633515 .swiper-slide').first().find('[data-id="46acc5d"] a').text(),'Changed resource');
 assert.equal($('.elementor-element-0633515 .swiper-slide').first().find('[data-id="46acc5d"] a').attr('href'),h.resources[0].sourceUrl);
 h.caseStudies=[];assert.equal(load(renderHome(template,h))('.elementor-element-a5c5f19 .swiper-slide').length,0);
});
test('imported public content renders complete carousels and preserves test-only forms',()=>{
 const h=home();const $=load(renderHome(template,h));
 for(const [id,count] of [['5fe1ff36',18],['4fe8a63',7],['a5c5f19',6],['5631cf8',11],['0633515',8],['77b7873',17],['3e35998',17],['04ad8bc',14]] as const)assert.equal($(`.elementor-element-${id} .swiper-slide`).length,count,id);
 assert.equal($('script,form [name],form [type=submit]').length,0);
 assert.equal($('.preview-form').length,2);
});
test('CMS text is escaped and unsafe link protocols are rejected',()=>{
 const h=home();h.heroTitle='<img src=x onerror=alert(1)>';h.heroTestimonials[0].quote='<script>alert(1)</script>';
 const $=load(renderHome(template,h));assert.equal($('.elementor-element-2cddf35 img').length,0);assert.equal($('script').length,0);
 for(const value of ['javascript:alert(1)','data:text/html,hi','//example.com','/\\example.com'])assert.equal(safeUrl(value),'');
 assert.equal(safeUrl('#preview-contact'),'#preview-contact');assert.equal(safeUrl('https://example.com'),'https://example.com');
});

test('draft rendering exposes editor field locations without credentials',()=>{const rendered=renderHome(template,home(),true);const $=load(rendered);assert.ok($('.elementor-element-2cddf35 [data-sanity]').length);assert.ok($('[data-content-key][data-sanity]').length>80);assert.ok(!rendered.includes('SANITY_API_READ_TOKEN'))});

test('supported YouTube links work and incomplete section drafts render',()=>{for(const url of ['https://m.youtube.com/watch?v=Jgm20na1sgs','https://youtu.be/Jgm20na1sgs','https://www.youtube-nocookie.com/embed/Jgm20na1sgs','https://youtube.com/shorts/Jgm20na1sgs'])assert.equal(youtubeId(url),'Jgm20na1sgs');assert.equal(youtubeId('https://example.com/watch?v=Jgm20na1sgs'),'');const h=home();delete (h as Partial<HomePage>).sections;assert.ok(renderHome(template,h).includes(h.heroTitle))});
