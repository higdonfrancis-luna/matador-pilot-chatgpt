import type {NextConfig} from 'next';

const onNetlify=process.env.NETLIFY==='true';
const config:NextConfig={
 allowedDevOrigins:['terminal.local'],
 poweredByHeader:false,
 // Netlify TOML variables exist during builds, not inside deployed Functions.
 // Inline only these NONSECRET settings into the Next.js build. Local runs keep
 // their existing environment behavior and default to fixture content.
 ...(onNetlify?{env:{
  CONTENT_MODE:process.env.CONTENT_MODE||'sanity',
  NEXT_PUBLIC_SANITY_PROJECT_ID:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'i2tdfchw',
  NEXT_PUBLIC_SANITY_DATASET:process.env.NEXT_PUBLIC_SANITY_DATASET||'production',
  NEXT_PUBLIC_SITE_URL:process.env.NEXT_PUBLIC_SITE_URL||process.env.DEPLOY_PRIME_URL||process.env.URL||'http://localhost:4173',
 }}:{}),
 outputFileTracingIncludes:{
  '/':['./data/home-template.html','./data/style-head.html','./data/body-class.txt','./data/pilot.ndjson'],
 },
};
export default config;
