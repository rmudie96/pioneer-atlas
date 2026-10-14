import { useEffect, useId, useState } from "react";
import { employmentNote } from "./realisation";
import { loadIndex } from "./GeoSearch";
import type {
  AreaSelection,
  Dataset,
  Impacts,
  Option,
  Place,
  Route,
  Scenario,
} from "./model";
import { SCENARIOS, count, money, range, scenarioNames } from "./model";
import {
  boundsNote,
  industryName,
  scenarioDescriptions,
  visibleOptions,
  comparisonAreas,
  areaForPlace,
} from "./exploration";
import { AreaComparison } from "./AreaViews";
import { AtlasLink } from "./views";
import { Button, Icon, Metric, ScenarioSelect, Search } from "./ui";

type Navigation = {
  data: Dataset;
  route: Route;
  go: (u: Partial<Route>) => void;
  link: (u: Partial<Route>) => string;
};
export function NationalOutlook({ data, route, go }: Omit<Navigation, "link">) {
  const v = data.national.scenarios[route.scenario];
  return (
    <section
      className="national-outlook"
      aria-label="England’s scenario outlook"
    >
      <div className="national-outlook-heading">
        <span className="eyebrow">ENGLAND / THE SCALE OF THE OPPORTUNITY</span>
        <ScenarioSelect
          value={route.scenario}
          onChange={(scenario) => go({ scenario })}
        />
      </div>
      <div className="national-outlook-number">
        <strong>{range(v.exports, money)}</strong>
        <span>Additional annual exports to England’s economy</span>
      </div>
      <div className="national-outlook-number">
        <strong>{range(v.directFte, (n) => count(n, 100))}</strong>
        <span>Direct employment (FTE) in England</span>
      </div>
      <div className="national-outlook-number"><strong>{range(v.supplyFte, (n) => count(n, 100))}</strong><span>Indirect employment (FTE) · UK-wide supply chain</span></div>
      <details className="national-scenario-guide">
        <summary>What do the three scenarios assume?</summary><p>{employmentNote}</p>
        <div className="national-scenario-choices">
          {SCENARIOS.map((s) => {
            return (
              <button
                key={s}
                aria-pressed={route.scenario === s}
                onClick={() => go({ scenario: s })}
              >
                <strong>{scenarioNames[s]}</strong>
                <span>{scenarioDescriptions[s]}</span>
                <b>
                  {{existing_trajectory: "33⅓%", policy_acceleration: "66⅔%", transformational: "100%"}[s]}{" "}
                  of the full England export allocation
                </b>
              </button>
            );
          })}
        </div>
        <p>
          The scenarios realise one-third, two-thirds or all of each industry’s
          unrealised export potential. The original full-potential allocation
          between places and industries stays fixed. Every smaller local estimate
          is the same fraction of its full-potential estimate. Where both routes
          exist, the original full-potential 50/50 expansion/diversification
          allocation is retained; existing single-route exceptions are unchanged.
        </p>
        <p>{boundsNote}</p>
        <p>
          Associated UK-wide supply-chain employment:{" "}
          <strong>{range(v.supplyFte, (n) => count(n, 100))} FTE</strong>.
          {v.totalFte && (
            <>
              {" "}
              Combined direct and UK supply-chain employment:{" "}
              <strong>{range(v.totalFte, (n) => count(n, 100))} FTE</strong>.
            </>
          )}{" "}
          Supply-chain effects are not assigned to the selected place.
        </p>
      </details>
    </section>
  );
}
export function ScenarioStrip({
  scenarios,
  selected,
  onChange,
}: {
  scenarios: Record<Scenario, Impacts>;
  selected: Scenario;
  onChange: (s: Scenario) => void;
}) {
  return <details className="scenario-comparison">
    <summary>Compare all three export scenarios</summary>
    <div className="scenario-strip">{SCENARIOS.map(s => <button key={s} onClick={() => onChange(s)} aria-pressed={s === selected} className={s === selected ? "selected" : ""}>
      <span>{scenarioNames[s]}</span>
      <div className="scenario-amount"><strong>{range(scenarios[s].exports, money)}</strong><span>Additional annual exports</span></div>
      <div className="scenario-amount"><strong>{range(scenarios[s].directFte, n => count(n, 5))}</strong><span>Direct employment (FTE)</span></div>
      <div className="scenario-amount"><strong>{range(scenarios[s].supplyFte, n => count(n, 5))}</strong><span>Indirect employment (FTE) · UK-wide supply chain</span></div>
    </button>)}</div>
    <p className="small-note">{employmentNote} Indirect employment is UK-wide, not assigned to this place. {boundsNote}</p>
  </details>;
}

export function OpportunityFilters({
  route,
  go,
}: {
  route: Route;
  go: (u: Partial<Route>) => void;
}) {
  const id = useId();
  return (
    <div className="portfolio-controls">
      <div className="segmented" role="group" aria-label="Opportunity route">
        {(route.place ? ["all", "expansion", "diversification", "exploration"] as const : ["all", "expansion", "diversification"] as const).map((f, i) => (
          <button
            key={f}
            aria-pressed={(route.filter ?? "all") === f}
            onClick={() => go({ filter: f })}
          >
            {
              [
                "All opportunities",
                "Grow existing industries",
                "Develop new industries",
                "Further industries to explore",
              ][i]
            }
          </button>
        ))}
      </div>
      <details className="refine-opportunities">
        <summary>Find an industry & change the order</summary>
        <div className="portfolio-fields">
          <label htmlFor={`${id}-query`}>
            Find an industry
            <input
              id={`${id}-query`}
              type="search"
              value={route.query ?? ""}
              placeholder="Industry name or SIC code"
              onChange={(e) => go({ query: e.target.value })}
            />
          </label>
          <label htmlFor={`${id}-sort`}>
            Order by
            <select
              id={`${id}-sort`}
              value={route.sort === "exports" ? "exports" : "jobs"}
              onChange={(e) => go({ sort: e.target.value as Route["sort"] })}
            >
              <option value="jobs">Employment: selected scenario</option>
              <option value="exports">Exports: selected scenario</option>
            </select>
          </label>
        </div>
      </details>
    </div>
  );
}
export function IndustryExplore({ data, route, go, link }: Navigation) {
  const search = route.query ?? "";
  const unique = [
    ...new Map(data.options.map((o) => [o.sic4, o])).values(),
  ].sort((a, b) =>
    industryName(a.industry).localeCompare(industryName(b.industry)),
  );
  const chosen = unique.find((o) => o.sic4 === route.sector);
  const rows = chosen ? visibleOptions(data, route) : [];
  return (
    <div className="industry-explore">
      <span className="eyebrow">ANOTHER WAY INTO THE ATLAS / INDUSTRIES</span>
      <h1 tabIndex={-1}>
        {chosen
          ? industryName(chosen.industry)
          : "Start with what we could make."}
      </h1>
      <p className="standfirst">
        {chosen
          ? "Explore the local economies where this industry appears among the published opportunities."
          : "From steel and medicines to machinery and food: find an industry, then discover the places behind its potential."}
      </p>
      {chosen ? (
        <>
          <Button
            className="button-outline"
            onClick={() => go({ sector: null, filter: "all", query: "" })}
          >
            All industries <Icon name="back" />
          </Button>
          <p className="small-note">
            {chosen.industry} · SIC {chosen.sic4}. Published propositions only:
            absence here does not mean absence from the full model.
          </p>
          <ScenarioSelect
            value={route.scenario}
            onChange={(scenario) => go({ scenario })}
          />
          <OpportunityFilters route={route} go={go} />
          <p className="section-intro">
            {rows.length} matching local economies. The order follows your
            selected measure; research ranks refer to each place’s own
            portfolio.
          </p>
          <div className="industry-place-list">
            {rows.map((o) => (
              <AtlasLink
                key={o.ttwaCode}
                className="industry-place-row"
                href={link({
                  view: "explore",
                  place: o.ttwaCode,
                  industry: o.sic4,
                  sector: null,
                  section: "why",
                })}
                onClick={() =>
                  go({
                    view: "explore",
                    place: o.ttwaCode,
                    industry: o.sic4,
                    sector: null,
                    section: "why",
                  })
                }
              >
                <span>
                  <strong>
                    {data.places.find((p) => p.code === o.ttwaCode)?.name}
                  </strong>
                  <small>
                    {o.route === "expansion"
                      ? "Grow an existing industry"
                      : "Develop a new industry"}{" "}
                    · local rank {o.rank}
                    {o.reviewRequired ? " · interpretation note" : ""}
                  </small>
                </span>
                <span>
                  <b>
                    {range(o.scenarios[route.scenario].directFte, (n) =>
                      count(n, 5),
                    )}
                  </b>
                  <small>gross direct FTE</small>
                </span>
                <Icon name="arrow" />
              </AtlasLink>
            ))}
          </div>
        </>
      ) : (
        <>
          <label className="industry-search">
            Find an industry
            <input
              type="search"
              value={search}
              onChange={(e) => go({ query: e.target.value })}
              placeholder="Try steel, pharmaceuticals, or a SIC code"
            />
          </label>
          <div className="industry-index">
            {unique
              .filter((o) =>
                `${o.industry} ${o.sic4}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((o) => (
                <AtlasLink
                  key={o.sic4}
                  href={link({ sector: o.sic4, sort: "jobs" })}
                  onClick={() => go({ sector: o.sic4, sort: "jobs" })}
                >
                  <span className="code">{o.sic4}</span>
                  <strong>{industryName(o.industry)}</strong>
                  <Icon name="arrow" size={18} />
                </AtlasLink>
              ))}
          </div>
          {!unique.some((o) =>
            `${o.industry} ${o.sic4}`
              .toLowerCase()
              .includes(search.toLowerCase()),
          ) && (
            <p role="status">
              No published industry matches. Try a broader term or SIC code.
            </p>
          )}
        </>
      )}
    </div>
  );
}
export function CompareView({ data, route, go, link }: Navigation) {
  const areas = comparisonAreas(data, route);
  const places = areas
    .flatMap((a) => a.ttwas)
    .map((c) => data.places.find((p) => p.code === c)!)
    .filter(Boolean);
  function add(code: string) {
    addArea(areaForPlace(data.places.find((p) => p.code === code)!));
  }
  function addArea(area: AreaSelection) {
    if (!areas.some((a) => a.code === area.code) && areas.length < 3)
      go({ compare: [], groups: [...areas, area] });
  }
  const measures: { label: string; value: (p: Place) => string }[] = [
    {
      label: "Gross direct FTE supported",
      value: (p) =>
        range(p.scenarios[route.scenario].directFte, (n) => count(n, 10)),
    },
    {
      label: "Allocated additional exports",
      value: (p) => range(p.scenarios[route.scenario].exports, money),
    },
    {
      label: "Grow existing industries · candidates",
      value: (p) => count(p.expansionOptions),
    },
    {
      label: "Develop new industries · candidates",
      value: (p) => count(p.diversificationOptions),
    },
    {
      label: "Complete candidate portfolio",
      value: (p) => count(p.candidateOptions),
    },
  ];
  const top = (p: Place) =>
    data.options
      .filter((o) => o.ttwaCode === p.code)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);
  const shared =
    places.length >= 2
      ? [
          ...new Set(
            data.options
              .filter((o) => o.ttwaCode === places[0].code)
              .map((o) => o.sic4),
          ),
        ].filter((sic) =>
          places.every((p) =>
            data.options.some((o) => o.ttwaCode === p.code && o.sic4 === sic),
          ),
        )
      : [];
  return (
    <div className="compare-view">
      <span className="eyebrow">
        PLACES SIDE BY SIDE / UP TO THREE LOCAL ECONOMIES
      </span>
      <h1 tabIndex={-1}>
        Different places.
        <br />
        Different possibilities.
      </h1>
      <p className="standfirst">
        Compare the scale and shape of industrial opportunity on the same
        assumptions.
      </p>
      {areas.length < 3 && (
        <Search
          places={data.places}
          exclude={areas.map((a) => a.code)}
          onSelect={add}
          onArea={addArea}
        />
      )}
      <div className="compare-selected">
        {areas.map((p) => (
          <Button
            key={p.code}
            className="button-outline"
            onClick={() =>
              go({
                compare: [],
                groups: areas.filter((x) => x.code !== p.code),
              })
            }
            aria-label={`Remove ${p.name} from comparison`}
          >
            {p.name}
            <Icon name="close" size={16} />
          </Button>
        ))}
      </div>
      {!areas.length ? (
        <p className="empty-result">
          Add a local economy above to begin. All places use the same scenario
          and complete-portfolio measures.
        </p>
      ) : areas.some((a) => a.type !== "Local economy") ? (
        <AreaComparison
          areas={areas}
          data={data}
          route={route}
          go={go}
          link={link}
        />
      ) : (
        <>
          <ScenarioSelect
            value={route.scenario}
            onChange={(scenario) => go({ scenario })}
          />
          <div
            className="comparison-scroll"
            role="region"
            aria-label="Place comparison; scroll horizontally on smaller screens"
            tabIndex={0}
          >
            <table className="comparison-table">
              <caption>{scenarioNames[route.scenario]} · by 2030</caption>
              <thead>
                <tr>
                  <th scope="col">Complete portfolios</th>
                  {places.map((p) => (
                    <th key={p.code} scope="col">
                      <AtlasLink
                        href={link({ view: "explore", place: p.code })}
                        onClick={() => go({ view: "explore", place: p.code })}
                      >
                        {p.name} ↗
                      </AtlasLink>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measures.map((m) => (
                  <tr key={m.label}>
                    <th scope="row">{m.label}</th>
                    {places.map((p) => (
                      <td key={p.code}>{m.value(p)}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">
                    Leading published industries
                    <small>Original research order</small>
                  </th>
                  {places.map((p) => (
                    <td key={p.code}>
                      <ol>
                        {top(p).map((o) => (
                          <li key={o.sic4}>
                            <AtlasLink
                              href={link({
                                view: "explore",
                                place: p.code,
                                industry: o.sic4,
                                section: "why",
                              })}
                              onClick={() =>
                                go({
                                  view: "explore",
                                  place: p.code,
                                  industry: o.sic4,
                                  section: "why",
                                })
                              }
                            >
                              {industryName(o.industry)}
                              {o.reviewRequired ? " †" : ""}
                            </AtlasLink>
                          </li>
                        ))}
                      </ol>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="scope-note">
            Gross supported employment is not net new jobs. Larger economies can
            support larger totals: this is not a performance league table.
            Candidate counts do not measure quality. † Interpretation note in
            the industry dossier.
          </p>
          <details className="supporting-detail">
            <summary>How to read the ranges</summary>
            <p>{boundsNote}</p>
          </details>
          {places.length >= 2 && (
            <section className="shared-industries">
              <h2>
                {shared.length
                  ? `${shared.length} industries appear in every selected place`
                  : "No industries appear in every selected published list"}
              </h2>
              <p className="small-note">
                This compares the published lists, not the complete candidate
                portfolios.
              </p>
              <div className="shared-links">
                {shared.map((sic) => {
                  const o = data.options.find((o) => o.sic4 === sic)!;
                  return (
                    <AtlasLink
                      key={sic}
                      href={link({
                        view: "industries",
                        place: null,
                        industry: null,
                        sector: sic,
                        query: "",
                        filter: "all",
                      })}
                      onClick={() =>
                        go({
                          view: "industries",
                          place: null,
                          industry: null,
                          sector: sic,
                          query: "",
                          filter: "all",
                        })
                      }
                    >
                      {industryName(o.industry)} ↗
                    </AtlasLink>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function PlaceOutlook({
  place,
  route,
  go,
}: {
  place: Place;
  route: Route;
  go: (u: Partial<Route>) => void;
}) {
  const v = place.scenarios[route.scenario];
  return (
    <section className="place-outlook" aria-label="Whole portfolio scenario">
      <ScenarioSelect
        value={route.scenario}
        onChange={(scenario) => go({ scenario })}
      />
      <Metric primary value={range(v.exports, money)} label="Allocated additional export potential · annually by 2030" />
      <p className="support-intro">That would support</p>
      <div className="headline-metrics employment-breakdown">
        <Metric value={range(v.directFte, n => count(n, 5))} label={`Direct employment (FTE) in ${place.name}`} />
        <Metric value={range(v.supplyFte, n => count(n, 5))} label="Indirect employment (FTE) · UK-wide supply chain" />
      </div>
      <ScenarioStrip
        scenarios={place.scenarios}
        selected={route.scenario}
        onChange={(scenario) => go({ scenario })}
      />
    </section>
  );
}

export function IndustryLead({
  option,
  placeName,
  route,
  go,
}: {
  option: Option;
  placeName: string;
  route: Route;
  go: (u: Partial<Route>) => void;
}) {
  const v = option.scenarios[route.scenario];
  return (
    <div className="industry-lead">
      <div>
        <span className="eyebrow">
          WHAT THIS SCENARIO COULD SUPPORT IN {placeName.toUpperCase()}
        </span>
        <ScenarioSelect
          value={route.scenario}
          onChange={(scenario) => go({ scenario })}
        />
        <div className="headline-metrics">
          <Metric
            primary
            value={range(v.directFte, (n) => count(n, 5))}
            label="Direct employment (FTE) supported"
          />
          <Metric
            value={range(v.exports, money)}
            label="Allocated export potential"
          />
        </div>
        <Metric value={range(v.supplyFte, n => count(n, 5))} label="Indirect employment (FTE) · UK-wide supply chain" />
        <details className="bounds-detail">
          <summary>How to read these bounds</summary><p>{employmentNote} Indirect employment is not located in the selected place.</p>
          <p>{boundsNote}</p>
        </details>
      </div>
      <ScenarioStrip
        scenarios={option.scenarios}
        selected={route.scenario}
        onChange={(scenario) => go({ scenario })}
      />
    </div>
  );
}

export function PlaceCoverage({ code }: { code: string }) {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    let live = true;
    loadIndex()
      .then((rows) => {
        if (live)
          setNames(
            rows
              .filter(
                (r) => r.type === "Local authority" && r.ttwas.includes(code),
              )
              .map((r) => r.name),
          );
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [code]);
  return names.length ? (
    <details className="coverage-detail">
      <summary>Which council areas does this local economy overlap?</summary>
      <p>
        Includes parts or all of {names.join(", ")}. Based on the ONS
        output-area lookup and 2023 council boundaries; this is not a claim that
        every council is wholly inside the local economy.
      </p>
    </details>
  ) : null;
}
