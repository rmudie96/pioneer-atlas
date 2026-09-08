export const SHEFFIELD = "E30000261";
export const SCENARIOS = [
  "existing_trajectory",
  "policy_acceleration",
  "transformational",
] as const;
export type Scenario = (typeof SCENARIOS)[number];
export const scenarioNames: Record<Scenario, string> = {
  existing_trajectory: "Existing trajectory",
  policy_acceleration: "Policy acceleration",
  transformational: "Transformational",
};
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
  places: Place[];
  boundaries: Boundary[];
  options: Option[];
  national: { projectionHorizon: number; scenarios: Record<Scenario, Impacts> };
  manifest: { sourceCommit: string; sourceHashes: Record<string, string> };
};
export type Section = "why" | "scenarios" | "markets";
export type Route = {
  place: string | null;
  industry: string | null;
  scenario: Scenario;
  section: Section;
  lens: "opportunities" | "need" | "neighbourhoods";
  error?: string;
};

export function readRoute(search: string): Route {
  const p = new URLSearchParams(search);
  const s = p.get("scenario") ?? "policy_acceleration";
  const section = p.get("section") ?? "why";
  const lens = p.get("lens") ?? (p.get("place") ? "neighbourhoods" : "opportunities");
  return {
    place: p.get("place"),
    industry: p.get("industry"),
    scenario: SCENARIOS.includes(s as Scenario)
      ? (s as Scenario)
      : "policy_acceleration",
    section: ["why", "scenarios", "markets"].includes(section)
      ? (section as Section)
      : "why",
    lens: lens === "need" || lens === "neighbourhoods" ? lens : "opportunities",
    error:
      !SCENARIOS.includes(s as Scenario) ||
      !["why", "scenarios", "markets"].includes(section) ||
      !["opportunities", "need", "neighbourhoods"].includes(lens)
        ? "This link contains a scenario or view that is not available."
        : undefined,
  };
}
export function routeSearch(route: Route): string {
  const p = new URLSearchParams();
  if (route.place) p.set("place", route.place);
  if (route.industry) p.set("industry", route.industry);
  if (route.place || route.scenario !== "policy_acceleration")
    p.set("scenario", route.scenario);
  if (route.industry && route.section !== "why")
    p.set("section", route.section);
  if (route.place || route.lens !== "opportunities") p.set("lens", route.lens);
  return p.size ? `?${p}` : "";
}
export function validateRoute(route: Route, data: Dataset): string | undefined {
  if (route.error) return route.error;
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
  async function get(file: string) {
    const response = await fetch(`./data/${file}`, { signal });
    if (!response.ok)
      throw new Error(`Could not load ${file} (HTTP ${response.status}).`);
    return response.json();
  }
  const [places, boundaries, options, national, manifest] = await Promise.all([
    get("ttwa-summary.json"),
    get("ttwa-boundaries.json"),
    get("industry-options.json"),
    get("national-summary.json"),
    get("manifest.json"),
  ]);
  if (
    places.length !== 149 ||
    boundaries.length !== 149 ||
    options.length !== 2643
  )
    throw new Error("This data release does not match the published atlas.");
  return { places, boundaries, options, national, manifest };
}
