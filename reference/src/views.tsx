import { useState } from "react";
import { EstimateNote, FurtherIndustries } from "./FurtherIndustries";
import type { MouseEvent, ReactNode } from "react";
import {
  count,
  marketNames,
  money,
  range,
  reviewLabels,
  SCENARIOS,
  scenarioNames,
  SHEFFIELD,
} from "./model";
import type { Dataset, Option, Place, Route, Scenario } from "./model";
import {
  Button,
  Icon,
  Search,
  SectionHeading,
} from "./ui";

import {
  areaForPlace,
  comparisonAreas,
  industryName,
  visibleOptions,
  whyHere,
} from "./exploration";
import { IndustryLead, OpportunityFilters, PlaceOutlook } from "./ExploreViews";
import {
  EvidenceKey,
  EvidenceHeadings,
  EvidenceSignals,
} from "./EvidenceSignals";

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
  return (
    <div className="home-view">
      <span className="eyebrow">
        ENGLAND / AN ATLAS OF INDUSTRIAL POSSIBILITY
      </span>
      <h1 tabIndex={-1}>Where could England’s next industries grow?</h1>
      <p className="standfirst">
        PIONEER is an atlas that maps industrial opportunities for every corner
        of England, reconnecting every community with the world’s economy.
      </p>
      <Search
        places={data.places}
        onSelect={(code) => go({ place: code, industry: null })}
        onArea={(area) => go({ area })}
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
      <button
        className="industry-entry"
        onClick={() =>
          go({
            view: "industries",
            place: null,
            industry: null,
            sector: null,
            filter: "all",
            query: "",
          })
        }
      >
        <span>
          <small>OR FOLLOW AN INDUSTRY</small>
          <strong>What could we make next?</strong>
        </span>
        <Icon name="arrow" />
      </button>
      <details className="supporting-detail place-directory">
        <summary>Browse all 149 local economies</summary>
        <ul>
          {[...data.places]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <li key={p.code}>
                <AtlasLink
                  href={`?place=${p.code}&scenario=${route.scenario}`}
                  onClick={() => go({ place: p.code, industry: null })}
                >
                  {p.name}
                  <Icon name="arrow" size={14} />
                </AtlasLink>
              </li>
            ))}
        </ul>
      </details>
      <div className="home-foot">
        <span>
          <b>149</b> local economies
        </span>
        <span>
          <b>89</b> retained industries
        </span>
      </div>
      <p className="small-note">
        Conditional research scenarios. Not forecasts or investment
        recommendations.
      </p>
    </div>
  );
}
export function PlaceBanner({place, data, route, go}: {place: Place; data: Dataset; route: Route; go: Go; link: (u: Partial<Route>) => string}) {
  return <section className="place-banner" aria-label={`${place.name} scenario outlook`}>
      <div className="place-title">
        <div>
          <span className="eyebrow">
            LOCAL ECONOMY / 2011 TRAVEL TO WORK AREA
          </span>
          <h1 tabIndex={-1}>{place.name}</h1>
        </div>
        <Button
          className="button-outline"
          onClick={() =>
            go({
              view: "compare",
              place: null,
              industry: null,
              compare: [],
              groups: [
                ...comparisonAreas(data, route).filter(
                  (a) => a.code !== place.code,
                ),
                areaForPlace(place),
              ].slice(-3),
              filter: "all",
              query: "",
              sector: null,
            })
          }
        >
          Compare this place <Icon name="plus" size={16} />
        </Button>
      </div>
      <div className="route-summary">
        <span>
          <strong>{place.expansionOptions}</strong> expansion candidates
        </span>
        <span>
          <strong>{place.diversificationOptions}</strong> candidates for
          diversification
        </span>
      </div>
      <PlaceOutlook place={place} route={route} go={go} />
  </section>;
}
export function PlaceView({
  place,
  data,
  route,
  go,
  link,
}: {
  place: Place;
  data: Dataset;
  route: Route;
  go: Go;
  method: () => void;
  link: (update: Partial<Route>) => string;
}) {
  const filter = route.filter ?? "all";
  const [all, setAll] = useState(false);
  const options = data.options
    .filter((o) => o.ttwaCode === place.code)
    .sort((a, b) => a.rank - b.rank);
  const filtered = visibleOptions(data, route);
  const visible =
    all || filter !== "all" || route.query ? filtered : filtered.slice(0, 6);
  return (
    <div className="place-view">
      <EvidenceKey />

      <>
        <SectionHeading number="01">Industrial opportunities</SectionHeading>
        <OpportunityFilters route={route} go={go} />
        {route.filter === "exploration" ? <FurtherIndustries data={data} route={route} /> : <>

        <EvidenceHeadings />
        <div className="opportunity-list">
          {visible.map((o) => (
            <AtlasLink
              key={o.sic4}
              href={link({ industry: o.sic4, section: "why" })}
              onClick={() => go({ industry: o.sic4, section: "why" })}
              className="opportunity-row"
            >
              <span className="opportunity-body">
                <strong>{industryName(o.industry)}</strong>
                <span className="opportunity-why">{whyHere(o)}</span>
                <span className="opportunity-meta">
                  {o.route} <span aria-hidden="true">·</span>{" "}
                  {range(o.scenarios[route.scenario].directFte, (n) =>
                    count(n, 5),
                  )}{" "}
                  gross direct FTE <span aria-hidden="true">·</span>{" "}
                  {range(o.scenarios[route.scenario].exports, money)} exports
                </span>
                {o.reviewRequired && (
                  <span className="review-tag">
                    Interpretation note <Icon name="info" size={14} />
                  </span>
                )}
              </span>
              <EvidenceSignals option={o} />
              <Icon name="arrow" />
            </AtlasLink>
          ))}
        </div>
        {!visible.length && (
          <p className="empty-result" role="status">
            {filter === "diversification" && !route.query
              ? "No industries meet the quantified model’s diversification rules here. Select Further industries to explore above for additional, unquantified options."
              : "No modelled opportunities in this view match your filters. Try another industry name or route."}
          </p>
        )}
        {filter === "all" && options.length > 6 && (
          <Button className="show-more" onClick={() => setAll((v) => !v)}>
            {all
              ? "Show leading six"
              : "Explore more"}{" "}
            <Icon name={all ? "minus" : "plus"} />
          </Button>
        )}
        </>}
        <EstimateNote />
      </>
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
export function IndustryView({option, placeName, route, go, method}: {
  option: Option; placeName: string; route: Route; go: Go;
  link: (u: Partial<Route>) => string; method: () => void;
}) {
  return <div className="industry-view">
    <header className="dossier-introduction">
      <span className="eyebrow">{placeName.toUpperCase()} / INDUSTRY EVIDENCE</span>
      <h1 tabIndex={-1}>{industryName(option.industry)}</h1>
      <p className="industry-definition">{whyHere(option)}</p>
      <p className="small-note">Official classification: {option.industry} · SIC {option.sic4}</p>
    </header>
    <EvidenceKey />
    <EvidenceSignals option={option} headings />
    <div className="dossier-data">
      <IndustryLead option={option} placeName={placeName} route={route} go={go} />
      <section className="dossier-markets" id="industry-markets" aria-label="Main products and overseas markets">
          <h2>Main products and overseas markets</h2>
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
      </section>
    </div>
  </div>;
}
