import { applyRealisationScenarios } from "./realisation.ts";
import type { realisationDefinition } from "./realisation.ts";
export const SHEFFIELD = "E30000261";
export const SCENARIOS = [
  "existing_trajectory",
  "policy_acceleration",
  "transformational",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
// Single source for public labels: landing, profiles, comparison and evidence.
// Research keys remain unchanged; do not introduce shorter labels in components.
export const scenarioNames: Record<Scenario, string> = {
  existing_trajectory: "Achieving 1/3 of our unrealised national export potential",
  policy_acceleration: "Achieving 2/3 of our unrealised national export potential",
  transformational: "Achieving all of our unrealised national export potential",
};
const scenarioUrls: Record<Scenario, string> = { existing_trajectory: "one_third", policy_acceleration: "two_thirds", transformational: "full_potential" };
export const LOCAL_NEED_LABEL = "Local economic need";
export type Bounds = { lower: number; upper: number };
export type Impacts = {
  exports: Bounds;
  directFte: Bounds;
  supplyFte: Bounds;
  totalFte?: Bounds;
};
export type Place = {
  code: string;
  name: string;
  candidateOptions: number;
  expansionOptions: number;
  diversificationOptions: number;
  jobsRatings: { green: number; amber: number; red: number };
  localDeprivationPercentile: number;
  reviewCount: number;
  scenarios: Record<Scenario, Impacts>;
};
export type Boundary = { code: string; name: string; path: string };
export type Neighbourhood = {
  code: string;
  name: string;
  imdDecile: number;
  path: string;
};
export type NeighbourhoodMapData = {
  ttwaCode: string;
  ttwaName: string;
  neighbourhoods: Neighbourhood[];
};
export type Option = {
  ttwaCode: string;
  rank: number;
  routeRank: number;
  sic4: string;
  industry: string;
  route: "expansion" | "diversification";
  jobsRating: string;
  currentJobs: number;
  localUnits: number;
  employmentRca: number;
  relatedness: number;
  workforce: number;
  ratings: {
    comparativeAdvantage: string;
    relatedness: string;
    workforce: string;
    export: string;
  };
  nationalOpportunity: number;
  allocationShare: number;
  products: string[];
  productFamilies: string[];
  markets: string;
  reviewRequired: boolean;
  reviewReasons: string[];
  scenarios: Record<Scenario, Impacts>;
};
export type Dataset = {
  scenarioDefinition?: typeof realisationDefinition;
  further?: ExplorationOption[];
  explorationProvenance?: { sourceHashes: Record<string, string>; method: string };
  places: Place[];
  boundaries: Boundary[];
  options: Option[];
  national: { projectionHorizon: number; scenarios: Record<Scenario, Impacts> };
  manifest: { sourceCommit: string; sourceHashes: Record<string, string> };
};
export type ExplorationOption = Pick<Option, "ttwaCode" | "sic4" | "industry" | "currentJobs" | "employmentRca" | "relatedness" | "workforce" | "ratings" | "nationalOpportunity" | "products" | "productFamilies" | "markets"> & {
  estimateStatus: "not_modelled";
  selectionReason: string;
  occupationalStrengths: string;
  occupationalGaps: string;
  adjacentIndustries: string;
  requiredOccupations: string;
  workforceResolution: string;
};
export type Section = "why" | "scenarios" | "markets";
export type AreaSelection = {
  code: string;
  name: string;
  type: string;
  ttwas: string[];
  outsideAtlas?: string[];
};
export type Route = {
  area?: AreaSelection | null;
  groups?: AreaSelection[];
  place: string | null;
  industry: string | null;
  scenario: Scenario;
  section: Section;
  lens: "need" | "neighbourhoods";
  view?: "explore" | "industries" | "compare";
  compare?: string[];
  sector?: string | null;
  filter?: "all" | "expansion" | "diversification" | "exploration";
  sort?: "rank" | "jobs" | "exports" | "name";
  query?: string;
  error?: string;
};

export function readRoute(search: string): Route {
  const p = new URLSearchParams(search);
  let area: AreaSelection | null = null,
    groups: AreaSelection[] = [],
    invalidArea = false;
  try {
    area = p.has("area") ? JSON.parse(p.get("area")!) : null;
    groups = p.has("groups") ? JSON.parse(p.get("groups")!) : [];
    const valid = (a: AreaSelection) =>
      a &&
      typeof a.code === "string" &&
      typeof a.name === "string" &&
      a.name.length <= 200 &&
      typeof a.type === "string" &&
      Array.isArray(a.ttwas) &&
      a.ttwas.length <= 149 &&
      a.ttwas.every((c) => typeof c === "string") &&
      (!a.outsideAtlas ||
        (Array.isArray(a.outsideAtlas) &&
          a.outsideAtlas.every((c) => typeof c === "string")));
    if (
      (area && !valid(area)) ||
      !Array.isArray(groups) ||
      groups.length > 3 ||
      !groups.every(valid)
    )
      throw Error();
  } catch {
    invalidArea = true;
    area = null;
    groups = [];
  }
  const requestedScenario = p.get("scenario") ?? "two_thirds";
  const s = Object.entries(scenarioUrls).find(([, value]) => value === requestedScenario)?.[0] ?? requestedScenario;
  const section = p.get("section") ?? "why";
  const lens = p.get("lens") ?? (p.get("place") ? "neighbourhoods" : "need");
  return {
    area,
    groups,
    view: (p.get("view") ?? "explore") as Route["view"],
    compare: [...new Set((p.get("compare") ?? "").split(",").filter(Boolean))],
    sector: p.get("sector"),
    filter: (p.get("filter") ?? "all") as Route["filter"],
    sort: (p.get("sort") === "exports" ? "exports" : "jobs") as Route["sort"],
    query: p.get("q") ?? "",
    place: p.get("place"),
    industry: p.get("industry"),
    scenario: SCENARIOS.includes(s as Scenario)
      ? (s as Scenario)
      : "policy_acceleration",
    section: ["why", "scenarios", "markets"].includes(section)
      ? (section as Section)
      : "why",
    // Retired employment-layer links still open their place and scenario.
    lens: lens === "neighbourhoods" ? lens : "need",
    error:
      invalidArea ||
      !["explore", "industries", "compare"].includes(
        p.get("view") ?? "explore",
      ) ||
      !["all", "expansion", "diversification", "exploration"].includes(
        p.get("filter") ?? "all",
      ) ||
      !["rank", "jobs", "exports", "name"].includes(p.get("sort") ?? "rank") ||
      !SCENARIOS.includes(s as Scenario) ||
      !["why", "scenarios", "markets"].includes(section) ||
      !["opportunities", "need", "neighbourhoods"].includes(lens)
        ? "This link contains a scenario or view that is not available."
        : undefined,
  };
}
export function routeSearch(route: Route): string {
  const p = new URLSearchParams();
  if (route.area) p.set("area", JSON.stringify(route.area));
  if (route.groups?.length) p.set("groups", JSON.stringify(route.groups));
  if (route.view && route.view !== "explore") p.set("view", route.view);
  if (route.compare?.length) p.set("compare", route.compare.join(","));
  if (route.sector) p.set("sector", route.sector);
  if (route.filter && route.filter !== "all") p.set("filter", route.filter);
  if (route.sort && route.sort !== "jobs") p.set("sort", route.sort);
  if (route.query) p.set("q", route.query);
  if (route.place) p.set("place", route.place);
  if (route.industry) p.set("industry", route.industry);
  if (route.place || route.scenario !== "policy_acceleration")
    p.set("scenario", scenarioUrls[route.scenario]);
  if (route.industry && route.section !== "why")
    p.set("section", route.section);
  if (route.place || route.lens !== "need") p.set("lens", route.lens);
  return p.size ? `?${p}` : "";
}
export function validateRoute(route: Route, data: Dataset): string | undefined {
  if (route.error) return route.error;
  if (
    route.area &&
    (route.place || route.industry || (route.view && route.view !== "explore"))
  )
    return "This link mixes an area overview with another view.";
  if (
    [...(route.area ? [route.area] : []), ...(route.groups ?? [])].some(
      (a) =>
        !a.ttwas.length ||
        a.ttwas.some((c) => !data.places.some((p) => p.code === c)),
    )
  )
    return "This area contains a local economy outside the current Atlas. Search for the area again.";
  if (route.view && route.view !== "explore" && (route.place || route.industry))
    return "This link mixes a place dossier with another view. Return to England to explore.";
  if (route.sector && route.view !== "industries")
    return "An industry-led selection needs the industries view.";
  if (
    (route.compare?.length ?? 0) > 3 ||
    route.compare?.some((c) => !data.places.some((p) => p.code === c))
  )
    return "This comparison contains an unavailable place or more than three places.";
  if (route.sector && !data.options.some((o) => o.sic4 === route.sector))
    return "This industry is not in the published atlas.";
  if (route.lens === "neighbourhoods" && !route.place)
    return "Select a place to see its neighbourhood map.";
  if (route.place && !data.places.some((p) => p.code === route.place))
    return "This place is not in the current 149-TTWA dataset.";
  if (
    route.industry &&
    (!route.place ||
      !data.options.some(
        (o) => o.ttwaCode === route.place && o.sic4 === route.industry,
      ))
  )
    return "This industry is not in the published leading propositions for this place. No alternative result has been substituted.";
}
export function count(value: number | null | undefined, step = 1): string {
  if (value == null || !Number.isFinite(value)) return "Not available";
  if (value > 0 && value < step / 2) return `<${step}`;
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(
    Math.round(value / step) * step,
  );
}
export function money(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "Not available";
  if (value >= 1000)
    return `£${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}bn`;
  if (value >= 10) return `£${value.toFixed(0)}m`;
  return `£${value.toFixed(1)}m`;
}
export function range(b: Bounds, format: (n: number) => string): string {
  const lo = format(b.lower),
    hi = format(b.upper);
  return lo === hi ? lo : `${lo}–${hi}`;
}
export function ordinal(value: number): string {
  const n = Math.round(value),
    last = n % 100;
  return `${n}${last >= 11 && last <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th")}`;
}
export function rating(value: string): string {
  return (
    (
      { green: "Stronger", amber: "Moderate", red: "Weaker" } as Record<
        string,
        string
      >
    )[value] ?? value.replace(/^grey_/, "").replaceAll("_", " ")
  );
}
export function marketNames(value: string): string[] {
  return [
    ...new Set(
      value
        .split(";")
        .map((x) => x.replace(/\s*\([\d,.]+\)\s*$/, "").trim())
        .filter(Boolean),
    ),
  ].slice(0, 5);
}
export function quantiles(places: Place[]): number[] {
  const v = places
    .map((p) => p.localDeprivationPercentile)
    .sort((a, b) => a - b);
  return [0.2, 0.4, 0.6, 0.8].map(
    (q) => v[Math.min(v.length - 1, Math.floor(q * v.length))],
  );
}
export function needClass(value: number, breaks: number[]): number {
  let i = 0;
  while (i < breaks.length && value > breaks[i]) i++;
  return i + 1;
}
export const reviewLabels: Record<string, string> = {
  precious_materials_trade_value_review:
    "Precious-materials trade values need careful interpretation. They can reflect prices, trading or re-export activity; this is not a prediction of local hiring.",
  very_large_direct_jobs_estimate:
    "Very large direct-jobs estimate: interpret the conditional scale with care.",
  large_diversification_scale:
    "Large diversification scale requires interpretation.",
  high_share_review:
    "A high share of the national industry allocation requires review.",
  moderate_share_review:
    "A material share of the national industry allocation requires review.",
  weaker_industrial_relatedness: "Industrial-relatedness evidence is weaker.",
  weaker_workforce_compatibility: "Workforce compatibility evidence is weaker.",
  waste_and_circular_economy_scope_review:
    "Waste and circular-economy scope requires interpretation.",
  small_direct_jobs_effect: "The direct employment effect is small.",
};
export async function fetchDataset(signal: AbortSignal): Promise<Dataset> {
  async function get(file: string, directory = "data") {
    const response = await fetch(`./${directory}/${file}`, { signal });
    if (!response.ok)
      throw new Error(`Could not load ${file} (HTTP ${response.status}).`);
    return response.json();
  }
  const [places, boundaries, options, national, manifest, extension] = await Promise.all([
    get("ttwa-summary.json"),
    get("ttwa-boundaries.json"),
    get("industry-options.json"),
    get("national-summary.json"),
    get("manifest.json"),
    get("exploration-extension.json", "context"),
  ]);
  if (
    places.length !== 149 ||
    boundaries.length !== 149 ||
    options.length !== 2643
  )
    throw new Error("This data release does not match the published atlas.");
  const combined = [...options, ...extension.additionalDiversification];
  if (combined.length !== 3838 || new Set(combined.map((o: Option) => `${o.ttwaCode}/${o.sic4}`)).size !== 3838)
    throw new Error("The extended diversification catalogue is incomplete or contains duplicates.");
  return applyRealisationScenarios({ places, boundaries, options: combined, national, manifest,
    further: extension.further, explorationProvenance: extension.provenance });
}
