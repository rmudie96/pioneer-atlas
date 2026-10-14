import type { Dataset, Impacts, Scenario } from "./model.ts";

export const realisationShares: Record<Scenario, number> = {
  existing_trajectory: 1 / 3,
  policy_acceleration: 2 / 3,
  transformational: 1,
};
export const employmentNote = "They are gross employment supported, not forecasts of net new jobs.";
export const horizonNote = "The export estimates reflect ITC’s assessment of unrealised export potential to 2030. Associated employment estimates are calculated using ONS industry employment coefficients, distributed according to existing employment. These are indicative opportunities, not forecasts. In other words, they do not capture every potential source of local growth, and crucially, they do not set a ceiling on what an industry could achieve beyond 2030.";
export const realisationDefinition = {
  version: "export-realisation-2026-10-14",
  base: "Unchanged original full-potential (transformational) allocation for every place and industry",
  fractions: realisationShares,
  allocation: "Original full-potential allocation retained: 50% expansion / 50% diversification where both routes exist; the existing single-route exceptions are unchanged.",
  scope: "England allocation of the 89 retained industries, not every product in the ITC dataset. Lower and upper allocation bounds retained.",
  employment: employmentNote,
  ranking: "Original research ranks and evidence ratings retained; historical jobs-scale ratings and allocationShare fields refer to the original middle scenario and are not current scenario estimates.",
  storageKeys: "Legacy scenario keys are retained for source compatibility; their current meaning is the fraction in this definition, not the old trend-based scenarios.",
};
export function realisedScenarios(full: Impacts): Record<Scenario, Impacts> {
  return Object.fromEntries(Object.entries(realisationShares).map(([s, share]) => [s,
    Object.fromEntries(Object.entries(full).map(([measure, bounds]) => [measure, {
      lower: bounds.lower * share, upper: bounds.upper * share,
    }])),
  ])) as Record<Scenario, Impacts>;
}
export function applyRealisationScenarios(data: Dataset): Dataset {
  return {
    ...data,
    scenarioDefinition: realisationDefinition,
    national: { ...data.national, scenarios: realisedScenarios(data.national.scenarios.transformational) },
    places: data.places.map((p) => ({ ...p, scenarios: realisedScenarios(p.scenarios.transformational) })),
    options: data.options.map((o) => ({ ...o, scenarios: realisedScenarios(o.scenarios.transformational) })),
  };
}
