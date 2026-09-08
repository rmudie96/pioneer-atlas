import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  count,
  money,
  range,
  readRoute,
  routeSearch,
  marketNames,
  quantiles,
  needClass,
  validateRoute,
} from "../src/model.ts";
import type { Dataset, Option, Place } from "../src/model.ts";

const sourceDir = new URL("../../data/", import.meta.url);
const outputDir = new URL("../public/data/", import.meta.url);
function source(name: string) {
  return readFileSync(new URL(name, sourceDir));
}
function output(name: string) {
  return readFileSync(new URL(name, outputDir));
}
const places: Place[] = JSON.parse(source("ttwa-summary.json").toString());
const options: Option[] = JSON.parse(
  source("industry-options.json").toString(),
);
const sheffield = options.filter((o) => o.ttwaCode === "E30000261");
const dataset: Dataset = {
  places,
  options,
  boundaries: JSON.parse(source("ttwa-boundaries.json").toString()),
  national: JSON.parse(source("national-summary.json").toString()),
  manifest: JSON.parse(output("manifest.json").toString()),
};

test("National geometry, summaries and totals are byte-identical copies", () => {
  for (const file of [
    "ttwa-summary.json",
    "ttwa-boundaries.json",
    "national-summary.json",
  ])
    assert.deepEqual(output(file), source(file));
});
test("Every Sheffield field and record order is identical to the current public input", () => {
  assert.deepEqual(
    JSON.parse(output("industry-options.json").toString()).filter(
      (o: Option) => o.ttwaCode === "E30000261",
    ),
    sheffield,
  );
  assert.equal(sheffield.length, 20);
  assert.equal(sheffield[0].sic4, "2441");
  assert.equal(sheffield[0].rank, 1);
  assert.equal(
    places.find((p) => p.code === "E30000261")!.candidateOptions,
    66,
  );
});
test("Source research assets match the original Git commit", () => {
  for (const file of [
    "ttwa-summary.json",
    "ttwa-boundaries.json",
    "national-summary.json",
    "industry-options.json",
  ]) {
    const git = execFileSync("git", ["show", `f77e59d:data/${file}`], {
      cwd: new URL("../../", import.meta.url),
      maxBuffer: 10_000_000,
    });
    assert.deepEqual(source(file), git, file);
    assert.equal(
      dataset.manifest.sourceHashes[file],
      createHash("sha256").update(source(file)).digest("hex"),
    );
  }
});
test("Display rounding matches the legacy JavaScript, including small and equal bounds", () => {
  assert.equal(count(5351.8, 10), "5,350");
  assert.equal(count(6138.5, 10), "6,140");
  assert.equal(count(996.4, 5), "995");
  assert.equal(count(0.1, 5), "<5");
  assert.equal(count(0, 5), "0");
  assert.equal(
    range({ lower: 996.4, upper: 996.4 }, (n) => count(n, 5)),
    "995",
  );
  assert.equal(
    range({ lower: 1322.533, upper: 1539.171 }, money),
    "£1.3bn–£1.5bn",
  );
  assert.equal(money(182.982), "£183m");
  assert.equal(money(100000), "£100bn");
});
test("Missing and non-finite values never silently become zero", () => {
  assert.equal(count(null), "Not available");
  assert.equal(count(NaN), "Not available");
  assert.equal(money(undefined), "Not available");
});
test("All three scenarios retain exact stored Sheffield values and ordered bounds", () => {
  for (const o of sheffield)
    for (const values of Object.values(o.scenarios))
      for (const b of Object.values(values))
        if (b) assert.ok(b.lower <= b.upper);
  const p = sheffield[0];
  assert.equal(p.scenarios.policy_acceleration.directFte.lower, 996.4);
  assert.equal(p.scenarios.transformational.directFte.lower, 1291.8);
  assert.ok(p.reviewReasons.includes("precious_materials_trade_value_review"));
});
test("Deep state round-trips without losing canonical IDs or scenario", () => {
  const r = readRoute(
    "?place=E30000261&industry=2441&scenario=transformational&section=markets&lens=need",
  );
  assert.deepEqual(readRoute(routeSearch(r)), r);
  assert.equal(validateRoute(r, dataset), undefined);
});
test("Invalid scenarios and unimplemented entities do not silently substitute research", () => {
  assert.ok(validateRoute(readRoute("?scenario=accelerated"), dataset));
  assert.ok(validateRoute(readRoute("?industry=2441"), dataset));
  assert.ok(validateRoute(readRoute("?place=unknown"), dataset));
  assert.ok(
    validateRoute(readRoute("?place=E30000261&industry=9999"), dataset),
  );
});
test("Market names preserve the exact legacy de-duplication and five-name limit", () => {
  assert.deepEqual(marketNames(sheffield[0].markets), [
    "United States of America",
    "Switzerland",
    "Hong Kong SAR",
    "China",
    "Japan",
  ]);
  assert.deepEqual(marketNames(""), []);
});
test("Map preserves every geography code and the existing quantile thresholds", () => {
  assert.deepEqual(
    new Set(dataset.boundaries.map((b) => b.code)),
    new Set(places.map((p) => p.code)),
  );
  const sorted = places
    .map((p) => p.localDeprivationPercentile)
    .sort((a, b) => a - b);
  assert.deepEqual(
    quantiles(places),
    [0.2, 0.4, 0.6, 0.8].map((q) => sorted[Math.floor(q * 149)]),
  );
  for (const [i, b] of quantiles(places).entries())
    assert.equal(needClass(b, quantiles(places)), i + 1);
});

test("All 2,643 published propositions retain exact bytes, unique IDs and valid deep links", () => {
  assert.deepEqual(
    output("industry-options.json"),
    source("industry-options.json"),
  );
  assert.equal(options.length, 2643);
  assert.equal(
    new Set(options.map((o) => `${o.ttwaCode}/${o.sic4}`)).size,
    2643,
  );
  for (const p of places) {
    const rows = options.filter((o) => o.ttwaCode === p.code);
    assert.equal(rows.length, Math.min(20, p.candidateOptions));
    assert.deepEqual(
      rows.map((o) => o.rank),
      Array.from({ length: rows.length }, (_, i) => i + 1),
    );
    assert.equal(
      p.jobsRatings.green + p.jobsRatings.amber + p.jobsRatings.red,
      p.candidateOptions,
    );
  }
  for (const o of options) {
    for (const scenario of [
      "existing_trajectory",
      "policy_acceleration",
      "transformational",
    ]) {
      const r = readRoute(
        `?place=${o.ttwaCode}&industry=${o.sic4}&scenario=${scenario}&section=markets`,
      );
      assert.equal(validateRoute(r, dataset), undefined);
      assert.deepEqual(readRoute(routeSearch(r)), r);
      for (const b of Object.values(
        o.scenarios[scenario as keyof typeof o.scenarios],
      )) {
        assert.ok(
          b &&
            Number.isFinite(b.lower) &&
            Number.isFinite(b.upper) &&
            b.lower >= 0 &&
            b.lower <= b.upper,
        );
      }
    }
  }
});

test("All 149 active neighbourhood maps are byte-identical, with original membership and deciles", () => {
  let total = 0;
  for (const p of places) {
    const file = `neighbourhoods/${p.code}.json`;
    assert.deepEqual(output(file), source(file));
    const data = JSON.parse(output(file).toString());
    assert.equal(data.ttwaCode, p.code);
    assert.equal(data.ttwaName, p.name);
    for (const n of data.neighbourhoods) {
      assert.ok(n.path);
      assert.ok(
        Number.isInteger(n.imdDecile) && n.imdDecile >= 1 && n.imdDecile <= 10,
      );
    }
    total += data.neighbourhoods.length;
    assert.equal(
      dataset.manifest.sourceHashes[file],
      createHash("sha256").update(source(file)).digest("hex"),
    );
  }
  assert.equal(total, 33438);
  // Git tree comparison checks the complete research directory, including inactive K-code maps.
  const changed = execFileSync(
    "git",
    [
      "diff",
      "--name-only",
      "f77e59d",
      "--",
      "data",
      ":(exclude)data/manifest.json",
    ],
    { cwd: new URL("../../", import.meta.url) },
  )
    .toString()
    .trim();
  assert.equal(changed, "");
});

test("Oxford's empty displayed diversification subset does not erase its two portfolio candidates", () => {
  const oxford = places.find((p) => p.name === "Oxford")!;
  assert.equal(oxford.diversificationOptions, 2);
  assert.equal(
    options.filter(
      (o) => o.ttwaCode === oxford.code && o.route === "diversification",
    ).length,
    0,
  );
  const smallest = places.find((p) => p.name === "Cromer and Sheringham")!;
  assert.equal(options.filter((o) => o.ttwaCode === smallest.code).length, 5);
});

test("Neighbourhood routes preserve place and scenario, but cannot be used without a place", () => {
  const r = readRoute(
    "?place=E30000234&lens=neighbourhoods&scenario=transformational",
  );
  assert.equal(validateRoute(r, dataset), undefined);
  assert.deepEqual(readRoute(routeSearch(r)), r);
  assert.ok(validateRoute(readRoute("?lens=neighbourhoods"), dataset));
});
