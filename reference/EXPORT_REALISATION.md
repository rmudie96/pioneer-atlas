# Export realisation and additional exploration — 14 October 2026

## Authorized change to the scenarios

The user explicitly authorized retaining each place and industry's existing full-potential figures and scaling them down. The current scenarios are 1/3, 2/3 and all of the original `transformational` export, direct FTE and supply-chain FTE estimates, at both bounds. Multiplication precedes display rounding. Full values are unchanged. This supersedes the former trend-based scenarios in the interface; it is an explicit analytical assumption change, not just relabelling.

The original full allocation remains fixed: 50/50 expansion/diversification where both routes exist, retaining original single-route exceptions. National and place totals continue to use complete research portfolios, not sums of the displayed lists. England totals cover the 89 retained industries, not all ITC products. Lower/upper allocation bounds are not confidence intervals; estimates are annual opportunities by 2030, not cumulative returns. Gross employment supported is not a forecast of net new jobs. UK supply-chain employment is not located in the selected TTWA.

Original JSON and research CSVs are unchanged. `realisation.ts` derives a new runtime dataset. Legacy internal keys are retained to read old links, but downloads include the versioned scenario definition and fractions. New URLs use `one_third`, `two_thirds` and `full_potential`. Original ranks are retained and labelled research order; current-scenario export/employment sorting is available. Historical jobs-scale and allocation-share fields still refer to the former middle scenario and are labelled accordingly.

## Existing diversification candidates

The original published list contained 614 of the model's 1,809 diversification candidates. The extension recovers the other 1,195 from `ttwa_industry_ranked_propositions_v1.csv`, preserving their original estimates, ranks and evidence. They were already included in headline totals. Showing them changes coverage, not totals or qualification thresholds. Combined with the original leading expansion candidates, the interface now exposes 3,838 quantified propositions.

## Further industries to explore

The separate list contains ten additional industries per TTWA, with no local export or employment estimate. It does not add to any total and does not imply ten viable investment recommendations.

This is an editorial selection rule for investigation, not a relaxation of the quantified model: manufacturing industries with no recorded local employment, clean ITC mapping, passing the existing industry scope rule and outside the complete quantified shortlist. This first exploration list additionally excludes coke, petroleum refining and nuclear-fuel processing. These are list-scope choices, not findings that these industries could never be developed.

Within that pool, order by the weaker of the existing relatedness and occupational-fit percentiles, then the stronger, then SIC code. Allow at most two industries per SIC2 division to provide variety. Select ten. Percentiles compare places within an industry, so this rule identifies relative local evidence, not absolute project feasibility or expected returns. Existing RAG ratings remain unchanged; low ratings are shown. No new composite score is presented as research evidence.

The disclosure explains why each option failed the quantified model's capability and/or £250m national opportunity test. Occupational strengths, gaps and adjacent industries come from the existing workforce file. They do not establish available workers, qualifications or access to a workplace. National product and destination links do not establish local manufacture or trade. Sites, energy, transport, finance and regulatory feasibility require local assessment.

`scripts/build-exploration-extension.py` builds the separate context file from the ranked research output, candidate-selection audit and workforce file. SHA-256 hashes of all three sources are embedded with the selection method. Rebuilding requires the parent research workspace. Static deployment uses the generated context file; it requires no backend.

## Verification

Tests check every national, place and displayed industry estimate against its original full-potential base; source immutability; complete diversification coverage per TTWA; unique and separate exploration rows; unchanged totals when exploration rows are removed; versioned exports and share URLs. Existing tests continue to compare original research files and every neighbourhood map with the original release.
