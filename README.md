# Matador Pilot · ChatGPT + Sanity

A Sanity-powered homepage pilot for comparison with Claude’s Storyblok implementation. It uses the same Matador content and the approved homepage design, including corrected dropdowns, carousel buttons, and continuous logo strips.

## Current state

The code, schema and import are ready. Connecting the existing **Matador Pilot** project requires its project ID, a dataset, and credentials supplied in environment settings. No Sanity content has been imported remotely yet. This repository contains only public website content; raw WordPress exports and private form routing are excluded.

- `/`: homepage, server-rendered with Next.js. In `CONTENT_MODE=fixture`, it clearly identifies itself as an unconnected content preview.
- `/studio`: embedded Sanity Studio with Homepage, Testimonials, Member videos, Case studies, Resources and Logos.
- Presentation: authenticated draft preview with click-to-edit overlays. Drafts refresh every two seconds while the page is visible; tokens stay on the server.
- 82 seed documents, 112 editable copy/link blocks, and ordered reusable references for all homepage carousels.
- Imported images initially use the current website URLs. Uploading a replacement in Studio takes precedence.
- Forms validate locally and never send an inquiry. Other page links open the current Matador website.

## Connect the project Adam already created

1. In Sanity onboarding, choose **Next.js**, **React**, and **TypeScript**. Continue with the existing Matador Pilot project; do not create a second project.
2. Find its project ID and dataset in the project settings. If there is no dataset, create `production`. The current seed is exclusively public website content. Choose the dataset visibility appropriate to the pilot; a private dataset requires a Viewer token for published reads as well as drafts.
3. Copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`, then install:

```bash
npm ci
npm run content:import
```

That command is an **offline dry-run** and requires no token. It validates document IDs, types, references and mutation size.

4. For the import, provide an Editor token as `SANITY_API_WRITE_TOKEN` in your local environment or a trusted secret manager. Never paste it into chat or commit it. Then run:

```bash
npm run content:import -- --write
```

The importer creates missing documents in one transaction and preserves existing edits. `--write --replace` is an explicit reset of this pilot’s documents; it is not the normal import command. Remove the write token from the frontend runtime after the import.

5. Set `CONTENT_MODE=sanity`. For draft preview, provide a **Viewer-only** token as `SANITY_API_READ_TOKEN`. Set `NEXT_PUBLIC_SITE_URL` to the frontend’s actual origin. The token is server-only; no `NEXT_PUBLIC_` token variable is used.
6. In Sanity’s API settings, allow the frontend/Studio origin as a CORS origin with credentials. Use the exact local origin when developing, and the exact deployment origin when hosting.
7. Run:

```bash
npm run content:verify
npm run dev
```

Open `http://localhost:4173`, then `/studio`. Sign in with the Sanity account that owns Matador Pilot. Open **Presentation** to edit a draft beside the page. Publishing changes updates public reads on the next request; there is no silent fixture fallback when Sanity mode fails.

## Run and validate

Requires Node.js 22.12+ (Node 24 recommended).

```bash
npm ci
npm run typecheck
npm test
npm run content:import
npm run build
npm start
```

The fixture mode works without Sanity credentials. It exists to review the implementation before connecting the account, and is labeled in the page footer. A missing Sanity homepage or failed live fetch displays an error instead of making an unconnected preview look live.

## Hosting

The repository is a standard Next.js app with an embedded Studio. Deploy it to a host that supports Next.js server rendering and configure the environment variables there. Netlify or Vercel can connect to this GitHub repo. Static file upload is insufficient for the Studio preview/API routes.

No domain, production WordPress setting, hosting account or live lead routing has been changed by this pilot. Hosting and a successful cloud content round-trip remain to be completed after project connection.

## Pilot scope and comparison

This is the **homepage pilot**, not a completed migration of all pages/posts. The layout remains in the frontend; Sanity edits existing copy, images and the content/order of the carousel references. Creating or rearranging entire page sections is not implemented yet.

For fidelity, the pilot retains the existing Elementor-derived layout and some CSS/fonts/media loaded from the original site. This dependency must be removed before replacing WordPress. Performance results at this stage are not a clean benchmark of the CMS alone. Use [the comparison scorecard](docs/CMS-COMPARISON.md) with equivalent content, image sizes, hosting, cache settings and editorial tasks on both pilots.

Next migration work: self-host media/fonts/styles, replace inherited markup with dedicated components, migrate published pages and posts, configure production forms/consent/analytics, preserve URLs and metadata, and test redirects before any domain cutover.

## Source provenance

`data/pilot.ndjson` contains an allowlisted public-content export from the user-supplied October 7, 2026 WordPress export, checked against the public homepage. It deliberately excludes drafts, private posts, private form recipients, raw WordPress metadata and credentials. `scripts/extract-pilot.py` documents regeneration from the original local source files, which are not included in this public repository.

The official integration references used are [Sanity + Next.js](https://www.sanity.io/docs/nextjs), [embedded Studio](https://www.sanity.io/docs/nextjs/embedding-sanity-studio-in-nextjs), and [visual editing](https://www.sanity.io/docs/nextjs/visual-editing-with-next-js-app-router).
