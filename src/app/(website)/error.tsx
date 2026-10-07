'use client';
export default function ContentError({reset}:{reset:()=>void}){return <main style={{maxWidth:720,margin:'80px auto',padding:24,fontFamily:'Arial'}}><h1>The pilot could not load its content.</h1><p>Check the Sanity project settings and content import. The site has not substituted a saved copy for live content.</p><button onClick={reset}>Try again</button></main>}
