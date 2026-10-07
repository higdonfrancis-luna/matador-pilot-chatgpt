import {defineEnableDraftMode} from 'next-sanity/draft-mode';
import {sanityClient} from '@/lib/sanity-client';
export async function GET(request:Request){
 if(!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||!process.env.SANITY_API_READ_TOKEN)return new Response('Draft preview is not configured.',{status:503});
 return defineEnableDraftMode({client:sanityClient()}).GET(request);
}
