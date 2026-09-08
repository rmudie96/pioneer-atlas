import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  count,
  marketNames,
  money,
  range,
  rating,
  reviewLabels,
  SCENARIOS,
  scenarioNames,
  SHEFFIELD,
} from "./model";
import type { Dataset, Option, Place, Route, Scenario } from "./model";
import {
  Button,
  EvidenceTrack,
  Icon,
  Metric,
  ScenarioSelect,
  Search,
  SectionHeading,
} from "./ui";

export type Go = (update: Partial<Route>) => void;
export function AtlasLink({
  href,
  onClick,
  children,
  className = "",
  current = false,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  current?: boolean;
}) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onClick();
    }
  }
  return (
    <a
      className={className}
      href={href}
      onClick={handle}
      aria-current={current ? "page" : undefined}
    >
      {children}
    </a>
  );
}
export function ReviewNote({ option }: { option: Option }) {
  if (!option.reviewRequired) return null;
  return (
    <aside className="review-note">
      <div>
        <Icon name="info" size={18} />
        <strong>Read this opportunity with care</strong>
      </div>
      {option.reviewReasons.map((reason) => (
        <p key={reason}>
          {reviewLabels[reason] ?? reason.replaceAll("_", " ")}
        </p>
      ))}
    </aside>
  );
}
export function HomeView({
  data,
  go,
  route,
}: {
  data: Dataset;
  go: Go;
  route: Route;
}) {
  const values = data.national.scenarios[route.scenario];
  return (
    <div className="home-view">
      <span className="eyebrow">THE FUTURE ECONOMY, IN PLACE</span>
      <h1 tabIndex={-1}>Where could England’s next industries grow?</h1>
      <p className="standfirst">
        An atlas of industrial opportunities, the evidence behind them, and what
        they could mean for local economies.
      </p>
      <Search
        places={data.places}
        onSelect={(code) => go({ place: code, industry: null })}
      />
      <AtlasLink
        className="featured-link"
        href={`?place=${SHEFFIELD}&scenario=${route.scenario}`}
        onClick={() => go({ place: SHEFFIELD, industry: null })}
      >
        <span>
          <span className="eyebrow">BEGIN AN EXPLORATION</span>
          <strong>Sheffield, beyond the familiar</strong>
          <span>66 industrial candidates. One local economy.</span>
        </span>
        <Icon name="arrow" size={24} />
      </AtlasLink>
      <div className="home-foot">
        <span>
          <b>149</b> local labour markets
        </span>
        <span>
          <b>89</b> retained industries
        </span>
      </div>
      <p className="small-note">
        Conditional research scenarios. Not forecasts or investment
        recommendations.
      </p>
      <details className="supporting-detail national-account">
        <summary>England’s scenario outlook</summary>
        <ScenarioSelect
          value={route.scenario}
          onChange={(scenario) => go({ scenario })}
        />
        <Metric
          primary
          value={range(values.directFte, (n) => count(n, 100))}
          label="Direct FTE supported across England"
        />
        <Metric
          value={range(values.exports, money)}
          label="Allocated additional export potential"
        />
        <Metric
          value={range(values.supplyFte, (n) => count(n, 100))}
          label="Associated UK-wide supply-chain FTE"
        />
        {values.totalFte && (
          <Metric
            value={range(values.totalFte, (n) => count(n, 100))}
            label="Combined direct and UK supply-chain FTE"
          />
        )}
        <p className="scope-note">
          By {data.national.projectionHorizon}. Complete retained portfolio;
          conditional gross effects, not net new jobs. Supply-chain effects are
          UK-wide.
        </p>
      </details>
    </div>
  );
}
export function PlaceView({
  place,
  data,
  route,
  go,
  method,
  link,
}: {
  place: Place;
  data: Dataset;
  route: Route;
  go: Go;
  method: () => void;
  link: (update: Partial<Route>) => string;
}) {
  const [filter, setFilter] = useState("all");
  const [all, setAll] = useState(false);
  const options = data.options
    .filter((o) => o.ttwaCode === place.code)
    .sort((a, b) => a.rank - b.rank);
  const filtered = options.filter(
    (o) => filter === "all" || o.route === filter,
  );
  const visible = all || filter !== "all" ? filtered : filtered.slice(0, 3);
  const values = place.scenarios[route.scenario];
  return (
    <div className="place-view">
      <span className="eyebrow">
        TRAVEL TO WORK AREA <span className="code">/ {place.code}</span>
      </span>
      <h1 tabIndex={-1}>{place.name}</h1>
      <p className="standfirst">
        {place.candidateOptions} retained industrial candidates.{" "}
        <span>
          {place.expansionOptions} expansion opportunities and{" "}
          {place.diversificationOptions} routes into new industries.
        </span>
      </p>
      <ScenarioSelect
        value={route.scenario}
        onChange={(scenario) => go({ scenario })}
      />
      <Metric
        primary
        value={range(values.directFte, (n) => count(n, 10))}
        label="Direct FTE supported in this local economy"
      />
      <Metric
        value={range(values.exports, money)}
        label="Allocated additional export potential"
      />
      <p className="scope-note">
        Whole portfolio · {place.candidateOptions} candidates · by 2030.
        <br />
        Conditional gross effects, not net new jobs.{" "}
        <button className="inline-link" onClick={method}>
          What do the bounds mean?
        </button>
      </p>
      <>
        <SectionHeading
          number="01"
          aside={
            <label className="route-filter">
              <span className="sr-only">
                Filter displayed opportunities by route
              </span>
              <select
                aria-label="Filter displayed opportunities by route"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setAll(true);
                }}
              >
                <option value="all">All routes</option>
                <option value="expansion">Expansion</option>
                <option value="diversification">Diversification</option>
              </select>
            </label>
          }
        >
          Industrial opportunities
        </SectionHeading>
        <p className="section-intro">
          Ordered by lower policy-acceleration direct FTE. Rank stays fixed when
          the scenario changes.
        </p>
        <div className="opportunity-list">
          {visible.map((o) => (
            <AtlasLink
              key={o.sic4}
              href={link({ industry: o.sic4, section: "why" })}
              onClick={() => go({ industry: o.sic4, section: "why" })}
              className="opportunity-row"
            >
              <span className="rank">{String(o.rank).padStart(2, "0")}</span>
              <span className="opportunity-body">
                <strong>{o.industry}</strong>
                <span className="opportunity-meta">
                  {o.route} <span aria-hidden="true">·</span>{" "}
                  {range(o.scenarios[route.scenario].directFte, (n) =>
                    count(n, 5),
                  )}{" "}
                  direct FTE
                </span>
                {o.reviewRequired && (
                  <span className="review-tag">
                    Interpretation note <Icon name="info" size={14} />
                  </span>
                )}
              </span>
              <Icon name="arrow" />
            </AtlasLink>
          ))}
        </div>
        {!visible.length && (
          <p className="empty-result" role="status">
            No {filter} propositions in the {options.length} published rows.
            This does not mean there are none in the full{" "}
            {place.candidateOptions}
            -candidate portfolio.
          </p>
        )}
        {filter === "all" && options.length > 3 && (
          <Button className="show-more" onClick={() => setAll((v) => !v)}>
            {all
              ? "Show leading three"
              : `Explore all ${options.length} published propositions`}{" "}
            <Icon name={all ? "minus" : "plus"} />
          </Button>
        )}
        <p className="small-note">
          {filter === "all"
            ? `${visible.length} shown`
            : `${filtered.length} matching displayed rows`}{" "}
          · {options.length} published propositions available ·{" "}
          {place.candidateOptions} in the complete portfolio. Headlines include
          the full portfolio.
        </p>
      </>
      <details className="supporting-detail">
        <summary>Compare the published evidence</summary>
        <p className="small-note">
          Separate stored ratings; these stay fixed when the scenario changes.
          Showing the current route filter.
        </p>
        <div
          className="evidence-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Published evidence table; scroll horizontally on small screens"
        >
          <table className="portfolio-table">
            <caption>{place.name} · published propositions</caption>
            <thead>
              <tr>
                <th scope="col">Industry</th>
                <th scope="col">Direct FTE</th>
                <th scope="col">Current base</th>
                <th scope="col">Relatedness</th>
                <th scope="col">Workforce</th>
                <th scope="col">Exports</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.sic4}>
                  <th scope="row">
                    <AtlasLink
                      href={link({ industry: o.sic4, section: "why" })}
                      onClick={() => go({ industry: o.sic4, section: "why" })}
                    >
                      {o.rank}. {o.industry}
                    </AtlasLink>
                  </th>
                  <td>
                    {range(o.scenarios[route.scenario].directFte, (n) =>
                      count(n, 5),
                    )}
                  </td>
                  {[
                    o.ratings.comparativeAdvantage,
                    o.ratings.relatedness,
                    o.ratings.workforce,
                    o.ratings.export,
                  ].map((r, i) => (
                    <td key={i}>{rating(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <details className="supporting-detail">
        <summary>UK supply-chain effects and portfolio context</summary>
        <Metric
          value={range(values.supplyFte, (n) => count(n, 10))}
          label="Associated UK-wide supply-chain FTE"
        />
        <p>
          These effects are not jobs located in {place.name}. No employment has
          been assigned to neighbourhood residents.
        </p>
        <p>
          {place.jobsRatings.green} candidates have at least 100 direct FTE
          under the lower policy-acceleration scenario. This is a scale band,
          not an overall confidence rating.
        </p>
        <p>
          {place.jobsRatings.amber} candidates are in the 25–under 100 FTE band;{" "}
          {place.jobsRatings.red} are below 25 FTE. All three bands use lower
          policy-acceleration direct FTE.
        </p>
      </details>
    </div>
  );
}
export function ScenarioChart({
  option,
  scenario,
  placeName,
}: {
  option: Option;
  scenario: Scenario;
  placeName: string;
}) {
  const max = Math.max(
    ...SCENARIOS.map((s) => option.scenarios[s].directFte.upper),
  );
  return (
    <div className="scenario-chart">
      <p className="section-intro">
        Direct FTE supported in {placeName}. All three scenarios share the same
        zero-based scale.
      </p>
      {SCENARIOS.map((s) => {
        const b = option.scenarios[s].directFte;
        return (
          <div
            key={s}
            className={`scenario-row ${s === scenario ? "scenario-current" : ""}`}
          >
            <div>
              <span>
                {scenarioNames[s]}
                {s === scenario && <small>Selected</small>}
              </span>
              <strong>{range(b, (n) => count(n, 5))}</strong>
            </div>
            <div className="interval" aria-hidden="true">
              <span
                style={{
                  left: `${max ? (b.lower / max) * 100 : 0}%`,
                  width: `${max ? ((b.upper - b.lower) / max) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        );
      })}
      <div className="interval-axis" aria-hidden="true">
        <span>0</span>
        <span>{count(max, 5)} FTE</span>
      </div>
      <p className="small-note">
        A single marker means the lower and upper bounds coincide. Bounds
        describe the England opportunity envelope, not statistical uncertainty.
      </p>
    </div>
  );
}
export function IndustryView({
  option,
  placeName,
  route,
  go,
  link,
  method,
}: {
  option: Option;
  placeName: string;
  route: Route;
  go: Go;
  link: (u: Partial<Route>) => string;
  method: () => void;
}) {
  const values = option.scenarios[route.scenario];
  const tabs = [
    ["why", "Why here"],
    ["scenarios", "Scenarios"],
    ["markets", "Products & markets"],
  ] as const;
  return (
    <div className="industry-view">
      <span className="eyebrow">
        {placeName.toUpperCase()} / INDUSTRY EVIDENCE
      </span>
      <h1 tabIndex={-1}>{option.industry}</h1>
      <div className="dossier-meta">
        <span className="route-label">{option.route}</span>
        <span className="code">SIC {option.sic4}</span>
        <span>Rank {option.rank}</span>
      </div>
      <p className="small-note">
        Ranked by lower policy-acceleration direct FTE, not an overall
        opportunity score.
      </p>
      {option.reviewRequired && (
        <p className="dossier-review-summary">
          <Icon name="info" size={16} />
          {option.reviewReasons.includes(
            "precious_materials_trade_value_review",
          )
            ? "Precious-materials trade values require interpretation."
            : "This proposition has an interpretation condition."}
        </p>
      )}
      <nav className="local-tabs" aria-label="Industry evidence sections">
        {tabs.map(([section, title]) => (
          <AtlasLink
            key={section}
            href={link({ section })}
            onClick={() => go({ section })}
            className={route.section === section ? "current" : ""}
            current={route.section === section}
          >
            {title}
          </AtlasLink>
        ))}
      </nav>
      {route.section === "why" && (
        <>
          <SectionHeading number="01">
            The existing industrial base
          </SectionHeading>
          <div className="base-evidence">
            <Metric
              value={count(option.currentJobs, 5)}
              label="Recorded current jobs"
            />
            <Metric
              value={option.employmentRca.toFixed(2)}
              label="Employment RCA"
            />
          </div>
          <p>
            {option.employmentRca >= 1 && option.currentJobs > 0
              ? "The industry has an existing local employment base and accounts for at least as large a share of employment here as nationally."
              : option.currentJobs === 0
                ? "There is no recorded local employment in this industry. The opportunity must be read alongside the separate relatedness and workforce evidence."
                : "The industry has recorded local employment, but its share of employment is below the national share."}
          </p>
          <p className="small-note">
            Current-base evidence: {rating(option.ratings.comparativeAdvantage)}
            . The employment RCA compares the local industry share with the
            national share.
          </p>
          <SectionHeading number="02">The evidence of fit</SectionHeading>
          <div className="evidence-pair">
            <EvidenceTrack
              label="Industrial relatedness"
              value={option.relatedness}
              status={option.ratings.relatedness}
            />
            <EvidenceTrack
              label="Workforce fit"
              value={option.workforce}
              status={option.ratings.workforce}
            />
          </div>
          <p className="small-note">
            Percentiles compare TTWAs for this same industry. Workforce fit
            describes the occupational mix, not workers available for
            recruitment.
          </p>
          <div className="export-evidence">
            <span>National export opportunity evidence</span>
            <strong>{rating(option.ratings.export)}</strong>
          </div>
          <SectionHeading number="03">
            What the scenario could support
          </SectionHeading>
          <ScenarioSelect
            value={route.scenario}
            onChange={(scenario) => go({ scenario })}
          />
          <Metric
            primary
            value={range(values.directFte, (n) => count(n, 5))}
            label={`Direct FTE supported in ${placeName}`}
          />
          <div className="impact-secondary">
            <Metric
              value={range(values.exports, money)}
              label="Allocated export potential"
            />
            <Metric
              value={range(values.supplyFte, (n) => count(n, 5))}
              label="UK-wide supply-chain FTE"
            />
          </div>
          <p className="scope-note">
            Conditional gross effects, not net new jobs. Supply-chain effects
            are not local employment.{" "}
            <button className="inline-link" onClick={method}>
              Read the assumptions
            </button>
          </p>
          <ReviewNote option={option} />
          <AtlasLink
            href={link({ section: "markets" })}
            onClick={() => go({ section: "markets" })}
            className="next-section"
          >
            <span>
              <span className="eyebrow">CONTINUE THE EVIDENCE</span>
              <strong>Products and overseas markets</strong>
            </span>
            <Icon name="arrow" />
          </AtlasLink>
          <details className="supporting-detail">
            <summary>Underlying measures and source context</summary>
            <table>
              <caption>
                Existing stored evidence · {placeName} / SIC {option.sic4}
              </caption>
              <tbody>
                {[
                  ["Current jobs", option.currentJobs],
                  ["Local units", option.localUnits],
                  ["Employment RCA", option.employmentRca],
                  ["Relatedness percentile", option.relatedness],
                  ["Workforce percentile", option.workforce],
                  [
                    "Jobs-scale band (fixed policy acceleration)",
                    rating(option.jobsRating),
                  ],
                  [
                    "National transformational opportunity (£m)",
                    option.nationalOpportunity,
                  ],
                  [
                    "Policy-acceleration allocation share (%)",
                    option.allocationShare,
                  ],
                ].map(([key, value]) => (
                  <tr key={key}>
                    <th scope="row">{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small-note">
              Source: existing final place layer, research release f77e59d.
              These are stored web-data values; no additional precision or
              recalculation is implied.
            </p>
          </details>
        </>
      )}
      {route.section === "scenarios" && (
        <>
          <SectionHeading number="01">Three conditional futures</SectionHeading>
          <ScenarioSelect
            value={route.scenario}
            onChange={(scenario) => go({ scenario })}
          />
          <ScenarioChart
            option={option}
            scenario={route.scenario}
            placeName={placeName}
          />
          <div className="impact-secondary">
            <Metric
              value={range(values.exports, money)}
              label={`${scenarioNames[route.scenario]} · allocated exports`}
            />
            <Metric
              value={range(values.supplyFte, (n) => count(n, 5))}
              label="Associated UK-wide supply-chain FTE"
            />
          </div>
          <ReviewNote option={option} />
          <p className="scope-note">
            Gross conditional FTE supported, not net new jobs. The stored rank
            and evidence ratings remain fixed across these scenarios.
          </p>
          <Button className="button-outline" onClick={method}>
            How the scenarios are constructed <Icon name="info" />
          </Button>
        </>
      )}
      {route.section === "markets" && (
        <>
          <div className="national-context">
            <span className="eyebrow">
              NATIONAL EVIDENCE / NOT LOCAL PRODUCTION
            </span>
            <p>
              These products connect this SIC industry to overseas demand. They
              are not evidence that each named product is currently made in{" "}
              {placeName}.
            </p>
          </div>
          <SectionHeading number="01">Leading linked products</SectionHeading>
          <ul className="product-list">
            {option.products.length ? (
              option.products.map((product) => {
                const split = product.indexOf(" ");
                return (
                  <li key={product}>
                    <span className="code">{product.slice(0, split)}</span>
                    <span>{product.slice(split + 1)}</span>
                  </li>
                );
              })
            ) : (
              <li>No clean linked product detail is available.</li>
            )}
          </ul>
          <SectionHeading number="02">Overseas market context</SectionHeading>
          <div className="market-list">
            {marketNames(option.markets).length ? (
              marketNames(option.markets).map((market, i) => (
                <div key={market}>
                  <span className="market-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{market}</span>
                </div>
              ))
            ) : (
              <p>No market detail is available.</p>
            )}
          </div>
          <p className="scope-note">
            The existing leading-market context, with duplicate names removed.
            This is not a new aggregate ranking for the industry. The current
            display data do not identify which destination belongs to each
            product.
          </p>
          <ReviewNote option={option} />
          <button className="inline-link" onClick={method}>
            Product-to-industry evidence and limitations{" "}
            <Icon name="arrow" size={16} />
          </button>
        </>
      )}
    </div>
  );
}
