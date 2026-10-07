# Netlify deployment

The public Sanity project is `i2tdfchw`, dataset `production`. All 82 pilot documents have been imported and verified. The deployed homepage can read published content without an API token.

## Connect and deploy

1. In Netlify, import the existing GitHub repository `higdonfrancis-luna/matador-pilot-chatgpt` and choose its `main` branch.
2. Use the repository root as the base directory. The committed `netlify.toml` supplies build command `npm run build`, publish directory `.next`, and Node.js 24. Leave automatic Next.js framework detection enabled; it supplies Netlify's current Next.js adapter.
3. Deploy. No Sanity token is needed for the published homepage. Do not add the import/write token to Netlify.
4. Open `/` and confirm the footer says **Sanity pilot**, the homepage renders, and `/studio` offers Sanity sign-in. The homepage must not say “Sanity is not connected yet.”
5. In Sanity project API settings, add this deployment's exact origin as a CORS origin with credentials so the embedded Studio can authenticate. Include any separate preview origin that will actually be used.

## Build and runtime settings

`netlify.toml` supplies the public project ID, dataset and `CONTENT_MODE=sanity` at build time. Netlify does not expose TOML variables directly to Functions. To keep the deployment deterministic, `next.config.ts` explicitly compiles only these nonsecret values into the Next.js build when `NETLIFY=true`.

`NEXT_PUBLIC_SITE_URL` uses an explicit value if supplied; otherwise it uses Netlify's `DEPLOY_PRIME_URL`, then `URL`. This makes Presentation target the current deploy's frontend rather than localhost. Changes to these settings require a rebuild. Local builds retain their normal `.env.local` settings and fixture default.

The homepage reads `data/home-template.html`, `data/style-head.html`, and `data/body-class.txt` at runtime. `outputFileTracingIncludes` explicitly includes those files in the homepage server trace, along with `data/pilot.ndjson` for fixture operation. Do not remove this tracing configuration when changing hosting settings.

Netlify normally derives the Functions Node.js version from the build version. If the project explicitly overrides `AWS_LAMBDA_JS_RUNTIME`, set that UI variable to `nodejs24.x`; this override belongs in Netlify settings, not TOML.

## Enable authenticated draft preview later

Published content works without this step. Draft preview additionally requires:

- A Sanity **Viewer-only** token set as `SANITY_API_READ_TOKEN` in Netlify environment settings, available to Functions (and Builds if the UI asks for a combined scope). Never prefix it with `NEXT_PUBLIC_`, add it to `next.config.env`, or commit it.
- The exact frontend/Studio CORS origin with credentials in Sanity.
- A new deployment after adding the variable.

Sign in at `/studio`, open Presentation, and edit a draft. Confirm an authenticated preview shows the draft while a separate signed-out window shows the published content. Publish and confirm the public page changes on its next request. Do not claim draft preview is connected until this round trip succeeds.

Forms remain test-only. Other-page links and some CSS/fonts/media still depend on the original WordPress website. This deployment does not change Matador's production domain or lead routing.

## References

- [Netlify Next.js overview](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
- [Netlify Functions environment variables](https://docs.netlify.com/build/functions/environment-variables/)
- [Netlify Functions configuration](https://docs.netlify.com/build/functions/configuration/)
- [Next.js output file tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
