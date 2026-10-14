import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Dataset, Option, ExplorationOption } from "../src/model.ts";
import { readRoute, routeSearch, validateRoute } from "../src/model.ts";
import { applyRealisationScenarios, realisationShares } from "../src/realisation.ts";
import { exportSelection, visibleOptions } from "../src/exploration.ts";
const get = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const extension: { additionalDiversification: Option[]; further: ExplorationOption[]; provenance: NonNullable<Dataset['explorationProvenance']> } = get("../public/context/exploration-extension.json");
const original: Dataset = {
  places: get("../public/data/ttwa-summary.json"), options: get("../public/data/industry-options.json"),
  national: get("../public/data/national-summary.json"), boundaries: get("../public/data/ttwa-boundaries.json"), manifest: get("../public/data/manifest.json"),
};
const combined = {...original, options: [...original.options, ...extension.additionalDiversification], further: extension.further, explorationProvenance: extension.provenance};
test("Every scenario scales the original full allocation exactly, without mutating source data", () => {
  const before = JSON.stringify(combined);
  const result = applyRealisationScenarios(combined);
  const inputs = [combined.national, ...combined.places, ...combined.options];
  const outputs = [result.national, ...result.places, ...result.options];
  inputs.forEach((input, i) => {
    assert.deepEqual(outputs[i].scenarios.transformational, input.scenarios.transformational);
    for (const [s, fraction] of Object.entries(realisationShares)) {
      for (const [metric, bounds] of Object.entries(input.scenarios.transformational)) {
        const actual = (outputs[i].scenarios as Record<string, Record<string, {lower:number;upper:number}>>)[s][metric];
        assert.equal(actual.lower, bounds.lower * fraction);
        assert.equal(actual.upper, bounds.upper * fraction);
      }
    }
    const {scenarios: _a, ...originalEvidence} = input;
    const {scenarios: _b, ...newEvidence} = outputs[i];
    assert.deepEqual(newEvidence, originalEvidence);
  });
  assert.equal(JSON.stringify(combined), before);
  assert.equal(result.national.scenarios.transformational.exports.lower, 131057.1);
  assert.equal(result.national.scenarios.transformational.directFte.lower, 454906);
});
test("Recovered candidates expose every existing modelled diversification option, without duplicating rows", () => {
  assert.equal(extension.additionalDiversification.length, 1195);
  assert.equal(new Set(combined.options.map(o => `${o.ttwaCode}/${o.sic4}`)).size, 3838);
  for (const p of combined.places) {
    assert.equal(combined.options.filter(o => o.ttwaCode === p.code && o.route === "diversification").length, p.diversificationOptions, p.name);
  }
  assert.ok(extension.additionalDiversification.every(o => o.route === "diversification"));
});
test("Ten exploration options per place stay outside quantified totals and exports", () => {
  const keys = new Set(combined.options.map(o => `${o.ttwaCode}/${o.sic4}`));
  for (const p of combined.places) {
    const rows = extension.further.filter(o => o.ttwaCode === p.code);
    assert.equal(rows.length, 10);
    assert.equal(new Set(rows.map(o => o.sic4)).size, 10);
    for (const o of rows) {
      assert.equal(keys.has(`${o.ttwaCode}/${o.sic4}`), false);
      assert.equal(o.estimateStatus, "not_modelled");
      assert.equal("scenarios" in o, false);
      assert.equal(o.currentJobs, 0);
      assert.ok(Number.isFinite(o.relatedness) && Number.isFinite(o.workforce));
    }
  }
  const withFurther = applyRealisationScenarios(combined);
  const without = applyRealisationScenarios({...combined, further: []});
  assert.deepEqual(withFurther.national, without.national);
  assert.deepEqual(withFurther.places, without.places);
  assert.deepEqual(withFurther.options, without.options);
  const download = exportSelection(withFurther, readRoute(`?place=${combined.places[0].code}&filter=diversification`));
  assert.equal(download.furtherIndustries.length, 10);
  assert.ok(download.options.every(o => o.route === "diversification"));
  assert.equal(download.metadata.scenarioDefinition?.fractions.policy_acceleration, 2 / 3);
});
test("New share URLs and older shared links select the same current scenario", () => {
  for (const [oldKey, newKey] of [["existing_trajectory", "one_third"], ["policy_acceleration", "two_thirds"], ["transformational", "full_potential"]]) {
    const old = readRoute(`?place=E30000261&scenario=${oldKey}`);
    assert.deepEqual(readRoute(`?place=E30000261&scenario=${newKey}`), old);
    assert.ok(routeSearch(old).includes(newKey));
  }
});
test("Every place has a shareable exploration view with ten separate unquantified options", () => {
  const data = applyRealisationScenarios(combined);
  for (const p of data.places) {
    const route = readRoute(`?place=${p.code}&filter=exploration`);
    assert.equal(validateRoute(route, data), undefined);
    assert.deepEqual(readRoute(routeSearch(route)), route);
    const download = exportSelection(data, route);
    assert.equal(download.options.length, 0);
    assert.equal(download.furtherIndustries.length, 10, p.name);
    assert.deepEqual(download.places[0].scenarios, p.scenarios);
  }
});
test("Current employment order is the default; retired sort links retain valid analytical states", () => {
  const data = applyRealisationScenarios(combined);
  for (const suffix of ["", "&sort=rank", "&sort=name"]) {
    const route = readRoute(`?place=E30000201${suffix}`);
    assert.equal(route.sort, "jobs");
    const rows = visibleOptions(data, route);
    for (let i = 1; i < rows.length; i++)
      assert.ok(rows[i-1].scenarios[route.scenario].directFte.lower >= rows[i].scenarios[route.scenario].directFte.lower);
    assert.deepEqual(rows.map(o => o.rank).sort((a,b)=>a-b), data.options.filter(o=>o.ttwaCode===route.place).map(o=>o.rank).sort((a,b)=>a-b));
  }
});
