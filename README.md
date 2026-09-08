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

Original files under `data/` remain unchanged. `data/manifest.json` is generated provenance metadata containing SHA-256 hashes, not a new model output. All place headlines and national totals cover the complete 5,889-candidate portfolio. Lists expose up to 20 published propositions per place and explicitly state that scope. Ranks, weights, estimates, scenario assumptions, geographic assignments, review flags and classification thresholds are unchanged.

The atlas reports conditional gross direct TTWA FTE and separately identified UK-wide supply-chain FTE; these are not forecasts, net new jobs or allocations to neighbourhood residents. Products and destination names are national evidence, not proof of local manufacture. The local map retains 2021 LSOAs and IMD 2025 national deciles.

## Links and exports

Query URLs refresh correctly on GitHub Pages without rewrites:

```text
https://rmudie96.github.io/pioneer-atlas/?place=E30000275&industry=2910&scenario=transformational&section=markets
```

Supported state: `place`, `industry`, `scenario`, `section` and `lens`. Use `lens=neighbourhoods` with a place for local IMD geography. Search, temporary route filters, map camera and mobile Map/Profile preference are transient interface state. Downloads retain exact records and all scenarios, with an explicit scope statement and source hashes.

See `FULL_ATLAS_RELEASE.md` for rollout checks and remaining limitations.
