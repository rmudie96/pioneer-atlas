import type { AreaSelection, Dataset, Place, Route } from "./model";
import { count, money, range } from "./model";
import { AtlasLink } from "./views";
import { Button, Icon, ScenarioSelect } from "./ui";
import {
  comparisonAreas,
  industryName,
} from "./exploration";

type Props = {
  data: Dataset;
  route: Route;
  go: (u: Partial<Route>) => void;
  link: (u: Partial<Route>) => string;
};
export function AreaExplanation({ area }: { area: AreaSelection }) {
  if (area.type === "Local economy" || area.type === "Local labour market")
    return (
      <p className="area-explanation">
        A complete local economy, based on where people live and work. All
        figures below describe this TTWA.
      </p>
    );
  const political =
    area.type === "Local authority" ||
    area.type === "County council" ||
    area.type === "Constituency";
  return (
    <p className="area-explanation">
      {area.type === "Postcode"
        ? "This postcode lies in the local economy shown below."
        : political
          ? `This ${area.type === "Constituency" ? "constituency" : "council area"} overlaps ${area.ttwas.length} of PIONEER’s local economies. All are shown together below.`
          : "The mapped centre of this settlement lies in the local economy shown below. A full postcode gives a more precise location."}{" "}
      The figures describe each whole local economy, not employment allocated to{" "}
      {area.name}.
      {political
        ? " Overlaps use ONS output-area best fits; council boundaries are from 2023 and constituencies from July 2024."
        : ""}
      {area.outsideAtlas?.length
        ? " Some of this area is in cross-border or other local economies outside the current Atlas."
        : ""}
    </p>
  );
}
export function MarketSummary({
  place,
  data,
  route,
  go,
  link,
}: { place: Place } & Props) {
  const v = place.scenarios[route.scenario];
  const target = {
    view: "explore" as const,
    place: place.code,
    industry: null,
    area: null,
  };
  return (
    <section
      className="area-market"
      aria-label={`${place.name} whole local economy`}
    >
      <div className="area-market-title">
        <h3>
          <AtlasLink href={link(target)} onClick={() => go(target)}>
            {place.name} <Icon name="arrow" size={17} />
          </AtlasLink>
        </h3>
        <span className="eyebrow">WHOLE LOCAL ECONOMY</span>
      </div>
      <div className="area-market-metrics">
        <div>
          <strong>{range(v.directFte, (n) => count(n, 5))}</strong>
          <span>Direct employment (FTE)</span>
        </div>
        <div>
          <strong>{range(v.exports, money)}</strong>
          <span>allocated exports</span>
        </div>
      </div>
      <div className="area-market-metrics"><div><strong>{range(v.supplyFte, n => count(n, 5))}</strong><span>Indirect employment (FTE) · UK-wide supply chain</span></div></div>
      <AtlasLink className="further-entry" href={link({...target, filter: "exploration"})} onClick={() => go({...target, filter: "exploration"})}>Further industries to explore · 10 additional options <Icon name="arrow" /></AtlasLink>
      <p className="small-note">
        {place.expansionOptions} expansion candidates ·{" "}
        {place.diversificationOptions} diversification candidates
      </p>
      <ol>
        {data.options
          .filter((o) => o.ttwaCode === place.code)
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 3)
          .map((o) => (
            <li key={o.sic4}>
              <AtlasLink
                href={link({ ...target, industry: o.sic4, section: "why" })}
                onClick={() =>
                  go({ ...target, industry: o.sic4, section: "why" })
                }
              >
                {industryName(o.industry)}
                {o.reviewRequired ? " †" : ""}
              </AtlasLink>
            </li>
          ))}
      </ol>
      <small>
        Leading published industries · original research order · †
        Interpretation note
      </small>
    </section>
  );
}
export function AreaView(props: Props) {
  const { data, route, go } = props,
    area = route.area!;
  const places = data.places.filter((p) => area.ttwas.includes(p.code));
  const selected = data.boundaries.filter((b) => area.ttwas.includes(b.code));
  const coordinates = selected.flatMap((b) =>
    b.path.match(/-?\d+(?:\.\d+)?/g)!.map(Number),
  );
  const xs = coordinates.filter((_, i) => i % 2 === 0),
    ys = coordinates.filter((_, i) => i % 2 === 1);
  const x = Math.min(...xs) - 12,
    y = Math.min(...ys) - 12,
    w = Math.max(...xs) - x + 12,
    h = Math.max(...ys) - y + 12;
  return (
    <div className="area-view">
      <span className="eyebrow">YOUR AREA / {area.type.toUpperCase()}</span>
      <div className="place-title">
        <h1 tabIndex={-1}>{area.name}</h1>
        <Button
          className="button-outline"
          onClick={() =>
            go({
              view: "compare",
              area: null,
              compare: [],
              groups: [
                ...comparisonAreas(data, route).filter(
                  (a) => a.code !== area.code,
                ),
                area,
              ].slice(-3),
            })
          }
        >
          Compare this area <Icon name="plus" size={16} />
        </Button>
      </div>
      <AreaExplanation area={area} />
      <ScenarioSelect value={route.scenario} onChange={scenario => go({scenario})} />
      <div className="area-overview-layout">
        <figure className="area-locator"><h2>Click the map to explore</h2>
          <svg
            viewBox={`${x} ${y} ${w} ${h}`}
            role="group"
            aria-label={`Connected local economies for ${area.name}; not the administrative boundary`}
          >
            {data.boundaries.map((b) => (
              <path
                key={b.code}
                d={b.path}
                role={area.ttwas.includes(b.code) ? "link" : undefined}
                tabIndex={area.ttwas.includes(b.code) ? 0 : undefined}
                aria-label={area.ttwas.includes(b.code) ? `Explore ${b.name}` : undefined}
                onClick={() => { if (area.ttwas.includes(b.code)) go({place:b.code, area:null, industry:null}); }}
                onKeyDown={e => { if (area.ttwas.includes(b.code) && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go({place:b.code, area:null, industry:null}); } }}
                className={
                  area.ttwas.includes(b.code)
                    ? "area-connected"
                    : "area-neighbour"
                }
              />
            ))}
          </svg>
          <figcaption>
            Highlighted: whole connected local economies. This is not the{" "}
            {area.type.toLowerCase()} boundary.
          </figcaption>
        </figure>
      <div className="area-markets">
        {places.map((p) => (
          <MarketSummary key={p.code} place={p} {...props} />
        ))}
      </div>
      </div>
    </div>
  );
}
export function AreaComparison({
  areas,
  ...props
}: Props & { areas: AreaSelection[] }) {
  const counts = new Map<string, number>();
  areas.forEach((a) =>
    new Set(a.ttwas).forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)),
  );
  const shared = [...counts]
    .filter(([, n]) => n > 1)
    .map(([c]) => props.data.places.find((p) => p.code === c)!.name);
  return (
    <>
      <p className="scope-note">
        Compare each area’s connected local economies on the same scenario. We
        show the original whole-market figures separately; these are not council
        or constituency totals and should not be added across columns.
      </p>
      {!!shared.length && (
        <p className="comparison-overlap">
          Shared coverage: {shared.join(", ")}. The same local economy appears
          in more than one selection.
        </p>
      )}
      <div
        className="comparison-scroll"
        role="region"
        tabIndex={0}
        aria-label="Area comparison; scroll horizontally on small screens"
      >
        <div
          className="area-comparison"
          style={{
            gridTemplateColumns: `repeat(${areas.length},minmax(300px,1fr))`,
          }}
        >
          {areas.map((a) => (
            <section key={a.code} className="area-comparison-column">
              <header>
                <span className="eyebrow">{a.type === "Local labour market" ? "Local economy" : a.type}</span>
                <h2>{a.name}</h2>
                <AreaExplanation area={a} />
              </header>
              {a.ttwas.map((c) => (
                <MarketSummary
                  key={c}
                  place={props.data.places.find((p) => p.code === c)!}
                  {...props}
                />
              ))}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
