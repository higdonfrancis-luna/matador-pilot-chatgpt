# Matador pilot: Sanity and Storyblok comparison

Use the same Matador homepage content and approved design in both pilots. Adam should perform the editorial tasks in each CMS, with the builder observing and recording results. A difference in the frontend implementation is not, by itself, evidence that one CMS is better.

No winner has been established. Empty cells below mean not yet tested, not a failure.

## Conditions to record

| Condition | Sanity pilot | Storyblok pilot |
| --- | --- | --- |
| Preview URL and tested commit | | |
| CMS plan, number of editors, test date | | |
| Hosting platform and region | | |
| Same content and image files? | | |
| Original-site image or CSS dependencies | | |
| Caching, publish delay, draft preview setup | | |
| Device, browser, viewport, connection | | |

The initial Sanity seed keeps existing image URLs. Record this dependency; do not credit either CMS for the original site's asset delivery. Complete asset migration in both pilots before comparing independent operation or final page speed.

## Editor tasks

For each task, record completion, elapsed time, mistakes, developer help needed, and Adam's ease-of-use score from 1 (difficult) to 5 (easy). Use identical edits in each CMS, then restore the baseline.

| Task | Pass condition | Sanity result | Storyblok result |
| --- | --- | --- | --- |
| Change the hero heading | Draft and published page show the intended text without a code edit | | |
| Reorder three testimonials | New order appears in the correct carousel; quotes and authors remain paired | | |
| Replace a logo or card image | Editor can upload/select an image and set useful alt text; layout remains correct | | |
| Preview a draft | Authorized editor sees the draft; a signed-out public visitor still sees the published version | | |
| Publish an update | Public page reflects the change within the documented refresh interval | | |
| Undo an accidental edit | Editor restores the intended content and republishes without developer intervention | | |
| Update a shared testimonial | All intended placements update without editing duplicate copies | | |
| Change a case-study link | Correct destination opens; editing does not break neighboring cards | | |

If a function has not been implemented or configured in a pilot, mark it **not configured**. Test it after setup before judging the CMS itself. Do not imply that the homepage pilot has completed the entire WordPress migration.

## Website behavior

| Check | Pass condition | Sanity result | Storyblok result |
| --- | --- | --- | --- |
| Desktop navigation | Marketing Solutions text fits, links work, submenu supports keyboard access | | |
| Phone navigation | Menu opens/closes, fits the viewport, and reaches all intended links | | |
| Content carousels | Previous/next controls and keyboard navigation work; all cards remain reachable | | |
| Logo strips | Continuous motion at the approved scale; reduced-motion preference is respected | | |
| Videos | Correct video plays after activation; surrounding layout remains stable | | |
| Form | Clearly identifies test mode; production test later reaches the agreed inbox exactly once | | |
| Responsive layout | Review desktop, tablet, and phone widths with the same content | | |
| SEO and internal routes | Page title, description, canonical, headings, and intended routes are correct | | |
| Failure behavior | Content/API failures are visible to operators and do not silently present an old demo as a live CMS result | | |

## Performance and operating cost

Measure the same deployed page with the same content, image sizes/formats, font loading, third-party scripts, and comparable caching. Record at least three runs per configuration and compare the median. Record Lighthouse mobile performance, LCP, CLS, page transfer size, and request count. INP needs an appropriate interaction or field measurement; do not invent it from a single Lighthouse score. A page that has fewer images or omits a carousel is not an equivalent performance test.

For cost, record the currently applicable plan and pricing source on the test date. Include editor seats, content and asset storage, bandwidth/CDN, API requests, draft preview or workflow requirements, frontend hosting, and maintenance time. Do not assume that a free pilot will meet production requirements. Keep one-time implementation hours separate from recurring charges.

| Measure | Sanity pilot | Storyblok pilot |
| --- | --- | --- |
| Median mobile performance / LCP / CLS | | |
| Transfer size / requests | | |
| Time from publish to public update | | |
| Editor task completion and median time | | |
| Adam's editor ease-of-use score | | |
| Unresolved functional defects | | |
| Expected monthly cost at Matador's usage | | |
| Developer time for routine changes | | |

## Decision record

Agree the priorities with Nick and Adam before adding up scores. Record observed strengths, unresolved defects, required production work, and the preferred CMS with reasons. Keep frontend quality and CMS authoring quality as separate findings. Re-run tasks that were blocked by missing setup before making a final selection.

## Import implementation references

The pilot importer uses Sanity's official client, validates local document structure first, and writes one transaction. It defaults to a dry run. `--write` uses `createIfNotExists`, so rerunning the seed preserves editor changes; `--write --replace` deliberately replaces only the imported published documents. Studio schema validation is a separate check because Sanity's mutation API does not apply Studio validation rules.

- [Sanity: creating and updating documents](https://www.sanity.io/docs/apis-and-sdks/js-client-mutations)
- [Sanity: transactions and consistency](https://www.sanity.io/docs/content-lake/transactions)
- [Sanity: API technical limits](https://www.sanity.io/docs/content-lake/technical-limits)

These implementation references support the import behavior; they do not establish an advantage over Storyblok.
