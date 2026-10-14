# PIONEER Atlas

The public economic atlas covers 149 English Travel to Work Areas and 2,643 published leading industrial propositions. It presents the existing research in the Common Ground design: map exploration, place profiles, industry evidence, three conditional scenarios, national products/markets and local neighbourhood deprivation.

## Development and release

The React/TypeScript source is in `reference/` (the original Sheffield reference was extended in place). Use Node 24 and pnpm:

```sh
cd reference
pnpm install --frozen-lockfile
pnpm run dev
```

For a release:

```sh
pnpm run stage:release
```

This builds and tests the app, verifies every copied research asset against its original, and stages the static HTML/assets at the repository root. It does **not** commit or push. Review the changes, commit and push `main`; GitHub Pages publishes the root of that branch. Do not publish the raw React source or run the upstream research pipeline as part of a frontend release.

The root `app.js` and `styles.css` are retained prototype files and are no longer loaded by the new `index.html`. Git history preserves the original working site at `f77e59d` for rollback. Hashed production assets are committed because this repository uses branch-based Pages publishing.

## Research contract

Original files under `data/` remain unchanged. The runtime derives the current scenarios from each original full-potential allocation, multiplying it by 1/3, 2/3 or 1. Headline totals cover the complete 5,889-candidate portfolio. Lists expose the original leading expansion propositions and all 1,809 existing modelled diversification candidates (1,195 recovered from the full research output). Ten unquantified further industries per TTWA remain separate and contribute nothing to totals. Research ranks, evidence ratings, geography and analytical thresholds are retained. See `reference/EXPORT_REALISATION.md` for the authorized analytical change and selection method.

The atlas reports conditional gross direct TTWA FTE and separately identified UK-wide supply-chain FTE; these are not forecasts, net new jobs or allocations to neighbourhood residents. Products and destination names are national evidence, not proof of local manufacture. The local map retains 2021 LSOAs and IMD 2025 national deciles.

## Links and exports

Query URLs refresh correctly on GitHub Pages without rewrites:

```text
https://rmudie96.github.io/pioneer-atlas/?place=E30000275&industry=2910&scenario=transformational&section=markets
```

Supported state: `place`, `industry`, `scenario`, `section`, `lens`, `view`, `sector`, `compare`, `filter`, `sort` and `q`. Use `lens=neighbourhoods` with a place for local IMD geography. Industry filters and ordering, national industry selection and up to three comparison places survive sharing and browser navigation. Geographic-search queries and camera/disclosure state are transient. Downloads contain the selected places and filtered published propositions in the selected order, all stored scenarios, the active scenario/filter metadata and source hashes.

See `FULL_ATLAS_RELEASE.md` for rollout checks and remaining limitations.


## October 2026 discovery redesign

The opening map shows Local economic need: the original five percentile classes are retained, and previews also show the underlying population percentage. This is the share living in England's most deprived 20% of neighbourhoods, using IMD 2025 and the existing mid-2022 population allocation. It is not an official TTWA IMD decile. The employment-opportunity map layer was removed on 14 October 2026. Older links with lens=opportunities open Local economic need, retaining their selected place and scenario. Employment-scale figures remain available in profiles, comparison and data exports; the original research values are unchanged. `reference/scripts/build-employment-context.py` reproduces the 149 totals from the existing official downloads and records source hashes in `context/employment-base.json`.

Profiles prioritise published industries, show six propositions initially, and explain the distinction from the complete portfolio. A smaller, enlargable neighbourhood map includes a keyboard-accessible neighbourhood selector. Industry dossiers occupy the full reading width. Searchable industry exploration and comparison of up to three places complement the map. There is no combined confidence score or place league table.

Scenario controls use the exact labels agreed with the user: Achieving 1/3 of our unrealised national export potential; Achieving 2/3 of our unrealised national export potential; Achieving all of our unrealised national export potential. These are uniform realisation fractions of the existing full-potential allocation. Full-potential export and employment values remain unchanged. The former trend and half-remaining-gap scenarios are superseded in the current interface. Gross employment supported is not a forecast of net new jobs; associated supply-chain FTE remains UK-wide.

### Geographic search and maintenance

- The bundled index has 543 July 2024 English constituencies, 296 April 2023 district/unitary authorities and 21 county councils. The small index is bundled into a lazy-loaded application module, removing a separate context-fetch dependency. It joins the ONS OA21–PCON24 best-fit lookup to the existing OA21–TTWA11 lookup; LA22–LA23 handles council mergers, and ONS LAD23–CTY23 supplies county-council membership (E10 codes only). Every represented labour market is retained, including explicit out-of-atlas coverage. These are best-fit output-area relationships, not exact polygon intersections. Council reorganisations require a dated index refresh.
- Full postcodes use Postcodes.io's ONS TTWA codes. Named settlements/neighbourhoods use OS Open Names representative coordinates, tested against the original British National Grid TTWA polygons. A settlement centre is not its entire footprint. Out-of-atlas results are never replaced with a guessed nearest place.
- Live queries use an eight-second timeout and a visible failure/retry state. Council, constituency and labour-market lookup remains available without the live service. Search has no API key or server component. Queries of at least three characters are sent to Postcodes.io, as explained beside search; the atlas does not store search history.
- New context assets live under `reference/public/context/` and are staged separately to `context/`. Their provenance and source hashes are in `context/provenance.json`. The approximately 5 MB exact geometry is fetched only when a named settlement is selected, not on homepage load.
- `reference/scripts/build-search-context.py` regenerates presentation geography from the original local research workspace plus ONS downloads. It does not run the model or change any research file. The source service's PCON25 field names are aliased by ONS to the July 2024 constituency release; the release title and metadata determine the geography.

### Verification

The production build and 27 automated checks pass. These cover unchanged original research bytes and geography, all 2,643 published options and 149 neighbourhood maps, deep-link round trips, filters and sorts, comparison/export scope, all council/constituency index entries, percentage units and point-in-polygon resolution (including polygon holes).

Browser checks include desktop and phone layouts, keyboard postcode selection, Sheffield postcode resolution, Great Clacton OS settlement resolution, Cornwall's nine TTWAs, North Cornwall's five TTWAs, invalid and Scottish postcodes, three-place comparison, scenario/back navigation, industry-led entry, national product/market interpretation, map keyboard previews, and filtered JSON download. The downloaded Sheffield diversification/export-order subset retained ranks 7, 20 and 15. Core body, secondary, data, link and review text colours exceed 4.5:1 against the main surface; controls exceed 3:1. This is targeted verification, not a claim of a full independent accessibility certification.

The release has been built into the repository root for review. No commit, push or public deployment is performed by staging.


### Refinements following user review

- Search tolerates council descriptors and punctuation (for example Sheffield City Council, Tendring District Council, Essex County Council), supports partial-postcode suggestions and immediate Enter/Go submission, and avoids request restarts caused by filtered comparison-place lists. Full postcode input is normalised before lookup; live calls time out with retry guidance.
- Named council, constituency, postcode and settlement selections retain their identity in an area overview. All connected TTWAs are shown together with the original figures separately. No council/constituency employment allocation is inferred. Comparisons retain up to three selected areas, identify overlapping TTWAs, and exports deduplicate shared research rows. Named areas and groups survive URL round trips.
- Existing strength (RCA), industrial relatedness, workforce readiness and national export potential are visible alongside each published industry, with distinct icons, original RAG values, underlying numbers and a key. On smaller screens the four signals form a labelled row underneath each industry. The dossier repeats these signals near its opening. Workforce readiness is only a renamed occupational-fit display; it does not establish actual worker availability, qualifications or access.
- Confirmed browser journeys: Sheffield City Council; Tendring’s Clacton/Colchester overview and mixed comparison with Sheffield; Essex County Council; unspaced lowercase S1 2HH with immediate Enter; partial-postcode suggestions; invalid postcode; scenario changes and browser back. All scenario values, ratings, ranks and research geography remain unchanged.

## Presentational front page

The England landing state uses `LandingPage.tsx` and scoped `landing.css`: large title and Commission credit, interactive national map on the left, geography search and scenario-controlled England totals on the right. The range graphic uses a fixed zero-to-full-upper-estimate scale, with a solid lower bound and hatched extension to the upper bound; movement only follows scenario selection and respects reduced-motion preferences. No automatic rotation or model changes.

Below 760px, the page orders introduction, search, map and national summary, with jump links for the latter two. The existing analytical routes, neighbourhood maps, search geography, comparison and evidence remain available. The home footer retains national data download and source interpretation. Desktop and 390px/320px phone layouts were checked, along with scenario changes, grouped council search, map-to-neighbourhood navigation and browser back. All 27 existing checks pass.
## Public naming contract — 14 October 2026

Every scenario control and heading uses `scenarioNames` in `reference/src/model.ts`. Do not add component-specific abbreviations or restore the former scenario names. Legacy internal keys remain for source compatibility but now identify the fixed fractions documented in exported scenario metadata; new URLs use one_third, two_thirds and full_potential. Both maps use the shared `LOCAL_NEED_LABEL`: **Local economic need**. This remains the existing neighbourhood-deprivation measure, with unchanged geography, percentiles and thresholds; the label is not a new composite index.

The local preview requires its development server to remain running. Restart with `pnpm run dev --port 5173 --strictPort` from `reference/` when the local server has stopped, then reload the browser. A cached application shell can otherwise display “Failed to fetch” because its research files cannot be reached. The static release is separate and is not published by starting the preview.
