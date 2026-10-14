import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readRoute, routeSearch, validateRoute } from "../src/model.ts";
import type { Dataset } from "../src/model.ts";
import {
  containingAreas,
  exportSelection,
  isFullPostcode,
  opportunityBand,
  visibleOptions,
  matchesArea,
  relativeEmployment,
  comparisonAreas,
} from "../src/exploration.ts";

const get = (p: string) =>
  JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const data: Dataset = {
  places: get("../public/data/ttwa-summary.json"),
  options: get("../public/data/industry-options.json"),
  boundaries: get("../public/data/ttwa-boundaries.json"),
  national: get("../public/data/national-summary.json"),
  manifest: get("../public/data/manifest.json"),
};
test("All exploration states round trip, including filters, comparison and retired map links", () => {
  for (const q of [
    "?view=compare&compare=E30000261,E30000192&scenario=transformational",
    "?view=industries&sector=2410&sort=exports&filter=expansion&q=iron",
    "?place=E30000261&filter=diversification&sort=jobs&scenario=existing_trajectory",
    "?lens=opportunities",
  ]) {
    const r = readRoute(q);
    assert.deepEqual(readRoute(routeSearch(r)), r);
    assert.equal(validateRoute(r, data), undefined);
  }
  assert.equal(readRoute("").lens, "need");
  for (const q of [
    "?view=unknown",
    "?sort=confidence",
    "?filter=strong",
    "?sector=0000",
    "?view=compare&compare=unknown",
    "?view=compare&compare=E30000261,E30000192,E30000004,E30000018",
  ])
    assert.ok(validateRoute(readRoute(q), data));
});
test("Retired employment-map links preserve the analytical state and use local economic need", () => {
  for (const place of ["", "&place=E30000261"]) {
    const r = readRoute(`?lens=opportunities&scenario=transformational${place}`);
    assert.equal(r.lens, "need");
    assert.equal(r.scenario, "transformational");
    assert.equal(r.place, place ? "E30000261" : null);
    assert.equal(validateRoute(r, data), undefined);
    assert.ok(!routeSearch(r).includes("opportunities"));
    assert.deepEqual(readRoute(routeSearch(r)), r);
  }
  assert.ok(validateRoute(readRoute("?lens=unknown"), data));
});
test("Sorts and filters preserve source values, canonical rank and per-place portfolio scope", () => {
  const before = JSON.stringify(data.options);
  const route = readRoute(
    "?place=E30000261&filter=expansion&sort=exports&scenario=transformational",
  );
  const rows = visibleOptions(data, route);
  assert.ok(
    rows.length > 0 &&
      rows.every((o) => o.ttwaCode === "E30000261" && o.route === "expansion"),
  );
  for (let i = 1; i < rows.length; i++)
    assert.ok(
      rows[i - 1].scenarios.transformational.exports.lower >=
        rows[i].scenarios.transformational.exports.lower,
    );
  assert.equal(JSON.stringify(data.options), before);
  const exported = exportSelection(data, route);
  assert.deepEqual(exported.options, rows);
  assert.equal(exported.places.length, 1);
  assert.equal(exported.places[0].candidateOptions, 66);
  const comparison = exportSelection(
    data,
    readRoute("?view=compare&compare=E30000261,E30000192"),
  );
  assert.equal(comparison.places.length, 2);
  assert.ok(
    comparison.options.every((o) =>
      ["E30000261", "E30000192"].includes(o.ttwaCode),
    ),
  );
});
test("Geographic index contains all English councils and constituencies and retains multi-TTWA membership", () => {
  const entries = get("../public/context/search-index.json");
  assert.equal(
    entries.filter((e: { type: string }) => e.type === "Constituency").length,
    543,
  );
  assert.equal(
    entries.filter((e: { type: string }) => e.type === "Local authority")
      .length,
    296,
  );
  assert.ok(
    entries.find(
      (e: { name: string; type: string }) =>
        e.name === "Cornwall" && e.type === "Local authority",
    ).ttwas.length > 5,
  );
  const codes = new Set(data.places.map((p) => p.code));
  for (const entry of entries) {
    assert.ok(entry.ttwas.every((c: string) => codes.has(c)));
    assert.equal(new Set(entry.ttwas).size, entry.ttwas.length);
  }
  assert.ok(
    entries.some((e: { outsideAtlas: string[] }) => e.outsideAtlas.length > 0),
  );
});
test("Underlying need shares are percentages for exactly the 149 original labour markets", () => {
  const need = get("../public/context/neighbourhood-need.json");
  assert.deepEqual(
    Object.keys(need).sort(),
    data.places.map((p) => p.code).sort(),
  );
  assert.ok(
    Object.values(need).every(
      (v) => typeof v === "number" && v >= 0 && v <= 100,
    ),
  );
  assert.ok(Math.abs(need.E30000004 - 40.50457877847061) < 1e-9);
});
test("OS settlement coordinates resolve by original polygons, not name similarity or nearest centre", () => {
  const geometry = get("../public/context/ttwa-points.json");
  assert.deepEqual(containingAreas(617463, 216507, geometry), ["E30000192"]); // Great Clacton OS point
  assert.deepEqual(containingAreas(0, 0, geometry), []);
  const synthetic = [
    {
      code: "x",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
          [
            [3, 3],
            [7, 3],
            [7, 7],
            [3, 7],
            [3, 3],
          ],
        ],
      },
    },
  ];
  assert.deepEqual(containingAreas(1, 1, synthetic), ["x"]);
  assert.deepEqual(containingAreas(5, 5, synthetic), []);
});
test("Complete postcodes are recognised, incomplete postcodes and settlement names are not", () => {
  for (const p of ["S1 2HH", "sw1a1aa", "EC1A 1BB", "m1 1aa"])
    assert.equal(isFullPostcode(p), true);
  for (const p of ["Sheffield", "S1", "SW1A", "123"])
    assert.equal(isFullPostcode(p), false);
});
test("Opportunity legend thresholds are relative-scale display bands, never research ratings", () => {
  assert.deepEqual(
    [0, 0.49, 0.5, 0.99, 1, 1.99, 2, 4.99, 5].map(opportunityBand),
    [1, 1, 2, 2, 3, 3, 4, 4, 5],
  );
});

test("An industry export contains only places represented by the selected published industry", () => {
  const selected = exportSelection(
    data,
    readRoute("?view=industries&sector=2410&sort=jobs"),
  );
  const codes = [...new Set(selected.options.map((o) => o.ttwaCode))].sort();
  assert.deepEqual(selected.places.map((p) => p.code).sort(), codes);
  assert.ok(selected.options.every((o) => o.sic4 === "2410"));
});

test("Council qualifiers and punctuation match official names without guessed geographic links", () => {
  const index = get("../public/context/search-index.json");
  for (const [q, n] of [
    ["Sheffield City Council", "Sheffield"],
    ["Cornwall council", "Cornwall"],
    ["Tendring District Council", "Tendring"],
    ["Stoke on Trent council", "Stoke-on-Trent"],
  ]) {
    const rows = index.filter((a: import("../src/exploration.ts").SearchArea) =>
      matchesArea(a, q),
    );
    assert.ok(
      rows.some((a: { name: string }) => a.name === n),
      q,
    );
    assert.ok(
      rows.every((a: { type: string }) => a.type === "Local authority"),
    );
  }
  assert.ok(
    index.some((a: import("../src/exploration.ts").SearchArea) =>
      matchesArea(a, "North Cornwall constituency"),
    ),
  );
});
test("Named areas survive deep links and comparison exports retain whole markets only once", () => {
  const index = get("../public/context/search-index.json");
  const area = index.find(
    (a: { name: string; type: string }) =>
      a.name === "Tendring" && a.type === "Local authority",
  );
  assert.ok(area.ttwas.length >= 2);
  const r = { ...readRoute(""), area };
  const roundtrip = readRoute(routeSearch(r));
  assert.deepEqual(roundtrip, r);
  assert.equal(validateRoute(r, data), undefined);
  const result = exportSelection(data, r);
  assert.deepEqual(
    result.places.map((p) => p.code).sort(),
    area.ttwas.slice().sort(),
  );
  assert.ok(result.options.every((o) => area.ttwas.includes(o.ttwaCode)));
  assert.equal(result.national, undefined);
  const market = data.places.find((p) => p.code === area.ttwas[0])!;
  const compare = {
    ...readRoute("?view=compare"),
    groups: [
      area,
      {
        code: market.code,
        name: market.name,
        type: "Local labour market",
        ttwas: [market.code],
      },
    ],
  };
  assert.deepEqual(readRoute(routeSearch(compare)), compare);
  assert.equal(comparisonAreas(data, compare)[0].name, "Tendring");
  const out = exportSelection(data, compare);
  assert.equal(out.places.length, area.ttwas.length);
  assert.equal(
    new Set(out.options.map((o) => o.ttwaCode + "-" + o.sic4)).size,
    out.options.length,
  );
  for (const q of ["?groups=null", "?area={}", "?groups=[null]"])
    assert.ok(validateRoute(readRoute(q), data));
});
test("Relative employment compares full gross opportunity to the official all-industry workplace count", () => {
  const base = get("../public/context/employment-base.json");
  assert.equal(base.year, 2024);
  assert.deepEqual(
    Object.keys(base.totals).sort(),
    data.places.map((p) => p.code).sort(),
  );
  assert.ok(
    Object.values(base.totals).every((n) => typeof n === "number" && n > 0),
  );
  assert.equal(base.totals.E30000004, 103000);
  assert.equal(relativeEmployment(200, 10000), 2);
  assert.equal(relativeEmployment(1000, 100000), 1);
  assert.equal(relativeEmployment(0, 100), 0);
  for (const n of [0, undefined, NaN, -1])
    assert.equal(relativeEmployment(100, n), null);
});

test("County councils use the official district-to-county union, including outside-atlas coverage", () => {
  const index = get("../public/context/search-index.json");
  const counties = index.filter(
    (a: { type: string }) => a.type === "County council",
  );
  assert.equal(counties.length, 21);
  const essex = counties.find((a: { name: string }) => a.name === "Essex");
  assert.ok(matchesArea(essex, "Essex County Council"));
  assert.ok(essex.ttwas.length > 1);
  assert.ok(
    essex.ttwas.includes("E30000192") && essex.ttwas.includes("E30000193"),
  );
});
