import type { AreaSelection, Dataset, Option, Route } from "./model";
import { ordinal } from "./model.ts";
import { horizonNote } from "./realisation.ts";

export const scenarioDescriptions = {
  existing_trajectory:
    "One-third of each industry’s full unrealised export potential, using the existing full-potential allocation between places.",
  policy_acceleration:
    "Two-thirds of each industry’s full unrealised export potential, using the same allocation between places.",
  transformational: "All of the unrealised export potential covered by the model, with the existing full-potential allocation between places.",
};
export const boundsNote =
  "The lower bound retains England’s current share of UK industry employment; the upper makes the whole mapped UK export opportunity contestable by England. These are allocation assumptions, not confidence intervals.";
export function industryName(name: string) {
  const friendly: Record<string, string> = {
    "Manufacture of basic iron and steel and of ferro-alloys":
      "Iron, steel & ferro-alloys",
    "Manufacture of medical and dental instruments and supplies":
      "Medical & dental instruments",
    "Manufacture of instruments and appliances for measuring, testing and navigation":
      "Measuring, testing & navigation instruments",
  };
  if (friendly[name]) return friendly[name];
  const short = name
    .replace(/^Manufacture of /, "")
    .replace(/^Manufacture, /, "")
    .replace(/,? n\.?e\.?c\.?$/i, " (not elsewhere classified)")
    .replace(/ and of /g, " and ");
  return short.charAt(0).toUpperCase() + short.slice(1);
}
export function whyHere(o: Option) {
  const base =
    o.currentJobs === 0
      ? "No recorded employment in this industry."
      : `${o.currentJobs.toLocaleString("en-GB")} recorded jobs in this industry.`;
  if (o.route === "expansion")
    return `${base} ${o.employmentRca >= 1 ? "Its local employment share is at least as high as nationally." : "The model identifies scope to build on this existing base."}`;
  return `${base} Industry connections: ${ordinal(o.relatedness)} percentile; occupational fit: ${ordinal(o.workforce)} percentile, compared with other local economies for this industry.`;
}
export function visibleOptions(data: Dataset, route: Route) {
  const rows = data.options.filter(
    (o) =>
      (!route.place || o.ttwaCode === route.place) &&
      (!route.industry || o.sic4 === route.industry) &&
      (!route.sector || o.sic4 === route.sector) &&
      (!route.filter || route.filter === "all" || o.route === route.filter) &&
      (!route.query ||
        o.industry.toLowerCase().includes(route.query.toLowerCase()) ||
        o.sic4.includes(route.query)),
  );
  return rows.sort((a, b) =>
    (!route.sort || route.sort === "jobs")
      ? b.scenarios[route.scenario].directFte.lower -
          a.scenarios[route.scenario].directFte.lower || a.rank - b.rank
      : route.sort === "exports"
        ? b.scenarios[route.scenario].exports.lower -
            a.scenarios[route.scenario].exports.lower || a.rank - b.rank
        : route.sort === "name"
          ? a.industry.localeCompare(b.industry)
          : a.rank - b.rank,
  );
}
export function exportSelection(data: Dataset, route: Route) {
  const rows = visibleOptions(data, route);
  const codes =
    route.view === "compare"
      ? comparisonAreas(data, route).flatMap((a) => a.ttwas)
      : route.place
        ? [route.place]
        : route.area
          ? route.area.ttwas
          : route.view === "industries"
            ? [...new Set(rows.map((o) => o.ttwaCode))]
            : data.places.map((p) => p.code);
  return {
    metadata: {
      source: data.manifest,
      url: typeof window === "undefined" ? "" : window.location.href,
      scenario: route.scenario,
      scenarioDefinition: data.scenarioDefinition,
      explorationProvenance: data.explorationProvenance,
      selectedArea: route.area ?? null,
      comparisonAreas:
        route.view === "compare" ? comparisonAreas(data, route) : undefined,
      filter: route.filter ?? "all",
      sort: route.sort ?? "rank",
      query: route.query ?? "",
      scope:
        "Whole-TTWA summaries; overlapping areas deduplicated. All modelled diversification candidates plus leading published expansion propositions. Further industries are separate, unquantified and excluded from all totals. National products and markets do not establish local trade links. Gross employment supported, not forecasts of net new jobs. UK supply-chain FTE is not local.",
      bounds: boundsNote,
        interpretation: horizonNote,
    },
    national:
      !route.place && !route.area && route.view !== "compare"
        ? data.national
        : undefined,
    places: data.places.filter((p) => codes.includes(p.code)),
    options: rows.filter((o) => codes.includes(o.ttwaCode)),
    furtherIndustries: (data.further ?? []).filter((o) => codes.includes(o.ttwaCode) && route.view !== "industries" && !route.industry && route.filter !== "expansion" && (!route.query || o.industry.toLowerCase().includes(route.query.toLowerCase()) || o.sic4.includes(route.query))),
  };
}
export type SearchArea = {
  code: string;
  name: string;
  type: string;
  ttwas: string[];
  outsideAtlas?: string[];
};
export type PointGeometry = {
  type: string;
  coordinates: number[][][] | number[][][][];
};
function inRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function containingAreas(
  x: number,
  y: number,
  rows: { code: string; geometry: PointGeometry }[],
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
  return rows
    .filter((r) => {
      const polys =
        r.geometry.type === "Polygon"
          ? [r.geometry.coordinates as number[][][]]
          : (r.geometry.coordinates as number[][][][]);
      return polys.some(
        (p) =>
          inRing(x, y, p[0]) && !p.slice(1).some((hole) => inRing(x, y, hole)),
      );
    })
    .map((r) => r.code);
}
export const isFullPostcode = (q: string) =>
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(q.trim());
export const opportunityBand = (value: number) =>
  value < 0.5 ? 1 : value < 1 ? 2 : value < 2 ? 3 : value < 5 ? 4 : 5;
export const relativeEmployment = (fte: number, jobs?: number) =>
  jobs && jobs > 0 && Number.isFinite(jobs) && Number.isFinite(fte)
    ? (100 * fte) / jobs
    : null;
export const areaForPlace = (p: {
  code: string;
  name: string;
}): AreaSelection => ({
  code: p.code,
  name: p.name,
  type: "Local economy",
  ttwas: [p.code],
});
export function comparisonAreas(data: Dataset, route: Route): AreaSelection[] {
  return route.groups?.length
    ? route.groups
    : (route.compare ?? []).flatMap((c) => {
        const p = data.places.find((p) => p.code === c);
        return p ? [areaForPlace(p)] : [];
      });
}
export function searchTerms(query: string) {
  const type = /\b(council|borough|district|local authority|unitary)\b/i.test(
    query,
  )
    ? "Local authority"
    : /\b(constituency|parliamentary|seat)\b/i.test(query)
      ? "Constituency"
      : undefined;
  const text = query
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(
      /\b(city|county|metropolitan|borough|district|council|of|local authority|unitary authority|constituency|parliamentary|seat)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  return { text, type };
}
export function matchesArea(area: SearchArea, query: string) {
  const q = searchTerms(query),
    n = searchTerms(area.name).text;
  return (
    !!q.text &&
    (!q.type ||
      area.type === q.type ||
      (q.type === "Local authority" && area.type === "County council")) &&
    q.text.split(" ").every((t) => n.includes(t))
  );
}
