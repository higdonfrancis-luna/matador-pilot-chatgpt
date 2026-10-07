import 'server-only';
import {createClient} from 'next-sanity';
export function sanityClient(){
 const projectId=process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
 if(!projectId)throw new Error('Set NEXT_PUBLIC_SANITY_PROJECT_ID to connect the existing Matador Pilot project.');
 return createClient({projectId,dataset:process.env.NEXT_PUBLIC_SANITY_DATASET||'production',apiVersion:'2025-02-19',useCdn:false,token:process.env.SANITY_API_READ_TOKEN||undefined});
}
