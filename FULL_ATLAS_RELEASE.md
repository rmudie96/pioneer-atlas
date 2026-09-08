# Full-atlas rollout — Common Ground

8 September 2026. Extends the approved Sheffield reference across the existing public atlas, following the user's instruction to extend all places and existing functionality, then publish.

## Scope

- All 149 English TTWAs now have complete place profiles and their published leading opportunities.
- All 2,643 published place–industry propositions have Why here, Scenarios and Products & markets dossiers, using the correct local name and exact existing records.
- National scenario exports, direct FTE, UK supply-chain FTE and combined FTE remain available through the expandable England outlook.
- All three scenarios work nationally, for each place and in each dossier. Ranks, jobs-scale bands and evidence ratings retain their fixed research reference.
- The four separate evidence ratings can be scanned in an expandable place table; each industry opens its dossier. Whole-portfolio counts retain all three jobs-scale bands.
- All 149 active neighbourhood maps are available through Local IMD deciles. Maps load on demand, abort obsolete requests, offer retry/fallback, and retain the original LSOAs, deciles and colours. Zoom, pan, pointer inspection and keyboard activation are supported.
- Global place search works from any analytical view. Map/Profile remains the mobile navigation model. Query deep links, browser back, sharing, methodology and scoped JSON downloads work across places.

The 5,889-candidate full portfolio and the 2,643 published leading propositions remain distinct. The frontend does not reconstruct unpublished rows. Comparison between several places, new model layers, editorial stories, CSV and generated share graphics are future product work; they were not existing functionality of the public prototype.

## Research integrity

Original research files are unchanged from `f77e59d`. The new `data/manifest.json` records source SHA-256 hashes as provenance metadata. The build and release scripts copy/verify research; they do not run the economic pipeline. Existing `app.js` and `styles.css` remain in the repository as prototype source, but are no longer loaded by the production HTML.

The 14-test suite passes. Checks cover exact national and industry bytes; every Sheffield field; all 2,643 unique proposition keys and canonical ranks; all 7,929 proposition/scenario deep links; complete versus published counts; ordered finite nonnegative bounds; legacy rounding; null/nonfinite display handling; invalid analytical links; market-name cleanup; TTWA quantiles and geography; and all 33,438 LSOAs in the 149 active maps. Source hashes and the original Git research tree are checked. TypeScript and the production build pass.

No calculation, ranking, weight, scenario assumption, threshold, geographic mapping or estimate changed. Copy distinguishes gross supported FTE from net new jobs, direct local effects from UK supply-chain effects, and national product evidence from local production. A zero-current-employment diversification case receives an appropriate explanation without introducing a new eligibility rule.

## Browser checks

The production build and staged root site were exercised in the available Chromium-based browser. Desktop, compact desktop, tablet landscape and 390px mobile were inspected, in addition to the original Sheffield reference QA.

- Sunderland: complete profile, motor-vehicles dossier, local IMD map and all stored evidence. Policy acceleration retains 1,420–1,500 direct FTE, £739m–£782m allocated export potential and 3,550–3,755 UK supply-chain FTE for motor vehicles.
- Oxford: global keyboard search, local-map loading, route filtering and explicit explanation of an empty published diversification subset despite two diversification candidates in the 49-candidate whole portfolio.
- Middlesbrough and Stockton: mobile global search, long place-name wrapping, truncated breadcrumb with full accessible name, seven published diversification propositions, zero-current-jobs meat-processing dossier and correctly named product/market context.
- Cromer and Sheringham: all five actual published rows, small values including `<5`, and a readable evidence table. No hard-coded “20 available” claim remains.
- London: all 4,935 local polygons load; tablet width stays within the viewport; zoom and keyboard selection expose the original IMD decile. The map remains contextual evidence, not a jobs allocation.
- England: national outlook and transformational values retain 454,900–520,900 direct FTE, £131bn–£151bn exports, 496,300–573,800 supply-chain FTE and 951,200–1,094,700 combined FTE under the legacy rounding rules.

Additional checks cover deep URL entry/refresh, correct place-specific titles, navigation back to England, actual table links, methodology, scenario selection and the shared layout. The release corrects long-name breadcrumb collisions, wraps long map labels, and preserves the thematic fill beneath selection outlines. The available browser's final application log was checked for warnings/errors.

These are browser and viewport checks, not a claim of physical-device or comprehensive assistive-technology certification. In particular, thousands of individual LSOA keyboard targets still warrant a specialist accessibility review and a future more efficient navigation model. Search and skip-map navigation provide alternatives for the primary place journey.

## Delivery

React/TypeScript source remains in `reference/`, extended in place to preserve the existing setup. `pnpm run stage:release` builds, tests, verifies source hashes and stages static production HTML/assets at the repository root. GitHub Pages is already configured to publish `main` at `/`; no backend, Actions migration or server rewrites are introduced. Font and runtime licence notices are included.

The release JavaScript is approximately 238.79 kB uncompressed / 74.45 kB gzip, with 31.04 kB CSS / 6.99 kB gzip. The initial national/industry data remains approximately 4.6 MB uncompressed; local geography is fetched only when requested. These are file sizes, not measured user-network transfer or Core Web Vitals. A later performance pass can split proposition data by place without changing values, with integrity checks retained.

Rollback is a normal revert of the release commit on `main`; do not delete or rebuild research to roll back the frontend. Existing source research is pinned to `f77e59d`, independently of frontend release commits.

## Remaining limitations

Temporary route filters and camera position are not part of URL state; shared analytical identity and scenario are. JSON downloads include original nested records and all scenarios, with explicit scope, rather than only visible filtered rows. A dedicated filesystem assertion of browser download delivery and cross-browser/assistive-technology testing remain advisable. No postcode or administrative-area alias mapping, new confidence score, unpublished candidate detail or product-by-market allocation has been invented.
