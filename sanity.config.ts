'use client';
import {defineConfig} from 'sanity';
import {structureTool} from 'sanity/structure';
import {presentationTool,defineLocations} from 'sanity/presentation';
import {schemaTypes} from './src/sanity/schemaTypes';
import {structure,singletonTypes} from './src/sanity/structure';
const locate=defineLocations({select:{title:'title',name:'name',firmName:'firmName'},resolve:doc=>({locations:[{title:doc?.title||doc?.name||doc?.firmName||'Homepage',href:'/'}]})});
export default defineConfig({
 name:'matador-pilot',title:'Matador Pilot',basePath:'/studio',
 // The placeholder only lets the unconfigured shell compile; Studio is gated until configured.
 projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'unconfigured',dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production',
 plugins:[structureTool({structure}),presentationTool({previewUrl:{origin:process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:4173',previewMode:{enable:'/api/draft/enable',disable:'/api/draft/disable'}},resolve:{locations:{homePage:locate,testimonial:locate,memberVideo:locate,caseStudy:locate,resource:locate,logo:locate}}})],
 schema:{types:schemaTypes,templates:templates=>templates.filter(t=>!singletonTypes.has(t.schemaType))},
 document:{actions:(actions,context)=>singletonTypes.has(context.schemaType)?actions.filter(item=>!['delete','duplicate','unpublish'].includes(item.action||'')):actions}
});
