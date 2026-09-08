# PIONEER frontend

This folder began as the Sheffield reference and now powers the complete public atlas. Its name is retained to preserve the existing development setup and review history.

From this folder, using Node 24 and pnpm:

```sh
pnpm install --frozen-lockfile
pnpm run dev
pnpm run build
pnpm run test
pnpm run preview
```

Development uses port 5173; production preview uses port 4173. `pnpm run stage:release` builds, tests and stages the static output at the parent repository root for branch-based GitHub Pages publishing. It does not commit or push. See the parent README for the release and research contract.

`src/model.ts` owns data types, formatting and URL validation; `App.tsx` owns navigation and utilities; `views.tsx` owns the place/dossier narrative; `ui.tsx` contains shared primitives. `AtlasMap.tsx` retains the original national geometry. `NeighbourhoodMap.tsx` loads each original local map only when requested, with abort/retry handling and explicit IMD interpretation. `tokens.css` and `styles.css` contain the design system and responsive rules.

`prepare-data.mjs` copies the original four national files and the 149 active neighbourhood maps without modifying bytes. It does not recalculate research. Tests verify all 2,643 records, ranks, 7,929 scenario deep links, 33,438 neighbourhoods, original classifications and source identity. Generated public data, dependencies and `dist/` are ignored; the staged production assets at the parent root are tracked.
