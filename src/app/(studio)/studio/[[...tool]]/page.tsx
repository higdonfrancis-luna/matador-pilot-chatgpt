import {Studio} from '@/components/Studio';
export const dynamic='force-static';
export const metadata={title:'Matador Pilot · Sanity Studio',robots:{index:false,follow:false}};
export default function StudioPage(){
 if(!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)return <main style={{fontFamily:'system-ui',maxWidth:720,margin:'80px auto',padding:24}}><h1>Connect Matador Pilot</h1><p>The editor is built. Set the existing Sanity project ID and dataset, import the pilot content, then restart the app.</p><p>Use the setup instructions in the repository README. Project IDs are public identifiers; API tokens belong in your environment settings.</p><a href="/">Return to homepage preview</a></main>;
 return <Studio/>;
}
