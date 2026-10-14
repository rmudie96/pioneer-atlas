# Atlas readability and navigation edits — 14 October 2026

## Landing page
- [x] Enlarge and centre the right-hand banner text; opening question green.
- [x] Remove search helper/privacy block; revise the 149-economy browse label.
- [x] Enlarge national-picture/date labels; revise scenario and export narration.
- [x] Show “That would support” with separate direct and indirect employment.
- [x] Move employment caveat into notes; clarify retained SIC industries.
- [x] Remove map source strapline and redundant editorial eyebrow.
- [x] Apply the three requested introductory/expansion/evidence copy changes.

## Area pages
- [x] Larger deprivation map on the left; industries on the right; map visible on mobile.
- [x] Retain only Local Deprivation (IMD), with requested area-specific introduction.
- [x] Remove neighbourhood selector; click or keyboard-select to zoom with surrounding context.
- [x] Use local economy terminology throughout visible interface.
- [x] Remove leading-opportunities header and redundant portfolio descriptions.
- [x] Enlarge candidate counts, metric labels, evidence heading, key and column headers.
- [x] Show direct/indirect employment and exports; comparison shows all three measures.
- [x] Rename Definitions; national-export ratings use Strong/Weak only.
- [x] Update coefficient explanation and remove bold from employment warning.
- [x] Remove research/name sort choices and visible rank labels; Explore more control.
- [x] Remove evidence comparison table and redundant supply-chain/context disclosure.
- [x] Put further industries at the main controls, never buried; verify Doncaster and other areas.

## Industry pages
- [x] Remove rank and rank explanation.
- [x] Enlarge scenario heading and supporting data labels.
- [x] Make products and overseas markets immediately visible alongside core evidence.

## Verification
- [x] Build and relevant regression tests; preserve all estimates, ratings and source files.
- [x] Desktop and mobile visual checks, including neighbourhood zoom and further industries.
- [x] Stage local static release; do not publish.

## Review notes

- Local preview: http://127.0.0.1:5173/
- Doncaster additional options: http://127.0.0.1:5173/?place=E30000201&filter=exploration
- Clacton additional options: http://127.0.0.1:5173/?place=E30000192&filter=exploration
- The additional options are the fourth opportunity filter beside All, Grow and Develop. Each of the 149 areas has ten; their estimates remain unmodelled.
- Industry pages show the evidence key and ratings before the scenario figures and a single full products/markets section, without a duplicate preview.
- Indirect employment remains explicitly UK-wide supply-chain employment. It is not assigned to the local area. All underlying full-potential values, realisation shares, ratings and eligibility thresholds are unchanged.
- Industry lists now default to employment, with export value as the alternative. Original research ranks remain in downloads, but are removed from the requested interface elements.
- Verified Doncaster and Clacton additional views; Doncaster's three modelled diversification candidates; mobile tap and keyboard zoom; product/market visibility; scenario comparison. No horizontal page overflow at 390px or 1440px test widths.
- Production build passed; all 34 tests passed, including original research and neighbourhood-map integrity and all-place exploration exports. Static release prepared locally; not committed, pushed or published.

## Follow-up refinement — 14 October 2026

- [x] Rebalance oversized landing, place and industry typography; check desktop and mobile widths.
- [x] Replace national outlook on selected-place pages with a place banner containing name, candidate counts, scenario, exports and direct/indirect employment.
- [x] Bring the place evidence key to the start of the main content.
- [x] Let the neighbourhood map scroll normally with the page.
- [x] Use “routes into work from” in the deprivation introduction.
- [x] Make Further industries to explore the fourth filter; two-by-two arrangement on mobile.
- [x] Change the column heading to Industry with the product/global-market prompt and matching row typography.
- [x] Rename Main products and overseas markets; show all available source products and up to five source markets.
- [x] Put industry evidence above figures; remove the long estimates note and repeated lower sections from industry pages.
- [x] Remove the linked-area introductory geography block; position connected economy summaries beside the map.
- [x] Add “Click the map to explore”; connected shapes open their local economy by click or keyboard.
- [x] Verify Doncaster, Sheffield and multi-economy Rotherham; check mobile filters and no horizontal overflow.
- [x] Production build and all 34 regression tests pass; research data integrity checks pass. Static release refreshed locally only.

## Copy and table consistency — 14 October 2026

- [x] Remove the FTE-per-100-jobs measure from area summaries and comparison views.
- [x] Display further industries using the shared industry/evidence columns, with expandable detail and unchanged unquantified status.
- [x] Move the full model description into the landing banner beneath the new industrial-opportunity heading; remove its duplicate below.
- [x] Use the existing green for interface accents, links and disclosure labels.
- [x] Apply the requested workforce-readiness question; retain the precise definition of the underlying occupational measure.
- [x] Move the estimates note to the bottom of each place's results.
- [x] Verify single-line desktop heading and responsive mobile evidence rows; no horizontal overflow. All 34 tests pass.
