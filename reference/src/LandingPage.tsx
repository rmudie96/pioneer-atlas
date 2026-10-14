import type { RefObject } from "react";
import type { Dataset, Route } from "./model";
import { count, money, range, SCENARIOS, scenarioNames } from "./model";
import { boundsNote } from "./exploration";
import { AtlasMap } from "./AtlasMap";
import { AtlasLink, type Go } from "./views";
import { Button, Icon, Search } from "./ui";
import "./landing.css";
import { employmentNote } from "./realisation";

export function LandingPage({ data, route, go, link, method, reading, download }: {
  data: Dataset; route: Route; go: Go; link: (u: Partial<Route>) => string;
  method: () => void; reading: RefObject<HTMLElement | null>; download: () => void;
}) {
  const value = data.national.scenarios[route.scenario];
  const maximum = data.national.scenarios.transformational.exports.upper;
  const low = 100 * value.exports.lower / maximum;
  const high = 100 * value.exports.upper / maximum;
  return (
    <main className="atlas-front" id="reading" ref={reading} tabIndex={-1}>
      <header className="front-intro">
        <div>
          <h1 tabIndex={-1}><span>PIONEER:</span> A new economic<br className="front-title-break" /> atlas for England</h1>
          <p className="front-credit">Created by the <strong>Independent Commission on Neighbourhoods</strong></p>
        </div>
        <p className="front-purpose"><span>A map of industrial opportunity for England.</span> The PIONEER Atlas is a place-based, sector and product-level scenario model which links the International Trade Centre (ITC)’s assessments of the UK’s unrealised export potential in goods, to local economies in every corner of the nation.</p>
        <nav className="front-jump" aria-label="Front page sections"><a href="#front-map">Explore the map ↓</a><a href="#front-summary">England’s opportunity ↓</a></nav>
      </header>

      <div className="front-explore">
        <section className="front-search" aria-labelledby="front-search-title">
          <span className="eyebrow">START WITH A PLACE</span>
          <h2 id="front-search-title">What could grow near you?</h2>
          <Search places={data.places} onSelect={(code) => go({ place: code, industry: null })} onArea={(area) => go({ area })} />
          <details className="front-directory">
            <summary>Browse the {data.places.length} local economies (Travel to Work Areas)</summary>
            <ul>{[...data.places].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <li key={p.code}><AtlasLink href={link({ place: p.code, industry: null })} onClick={() => go({ place: p.code, industry: null })}>{p.name}<Icon name="arrow" size={14} /></AtlasLink></li>
            ))}</ul>
          </details>
        </section>

        <div className="front-map" id="front-map">
          <div className="front-map-invite"><Icon name="map" size={19} /><p>Click an area to explore its industrial opportunities.</p></div>
          <AtlasMap data={data} selected={null} lens={route.lens} scenario={route.scenario} reading={false}
            onSelect={(code) => go({ place: code, industry: null, section: "why" })} onLens={(lens) => go({ lens })} />
        </div>

        <section className="front-outlook" id="front-summary" aria-labelledby="front-outlook-title">
          <div className="front-section-label"><span className="eyebrow">THE NATIONAL PICTURE</span><span className="eyebrow">BY {data.national.projectionHorizon}</span></div>
          <h2 id="front-outlook-title">England’s scenario outlook</h2>
          <fieldset className="front-scenarios">
            <legend>Choose an export scenario</legend>
            <div>{SCENARIOS.map((s, i) => <button key={s} aria-pressed={route.scenario === s} onClick={() => go({ scenario: s })}>
              <span className="front-scenario-index">0{i + 1}</span>
              <span>{scenarioNames[s]}</span>
            </button>)}</div>
          </fieldset>
          <div className="front-results" aria-live="polite" aria-atomic="true">
            <p className="front-scenario-description">If we achieved {route.scenario === 'existing_trajectory' ? 'one third' : route.scenario === 'policy_acceleration' ? 'two thirds' : 'all'} of each industry's unrealised export potential, according to the International Trade Centre, that would be worth</p>
            <div className="front-prize"><strong>{range(value.exports, money)}</strong><span>In additional annual exports to England’s economy</span></div>
            <div className="front-range" aria-hidden="true">
              <div className="front-range-track"><i style={{ width: `${low}%` }} /><b style={{ left: `${low}%`, width: `${high - low}%` }} /></div>
              <div className="front-range-axis"><span>£0</span><span>{money(maximum)} · full upper estimate</span></div>
            </div>
            <p className="support-intro">That would support</p><div className="employment-breakdown"><div className="front-jobs"><strong>{range(value.directFte, (n) => count(n, 100))}</strong><span>Direct employment (FTE) in England</span></div><div className="front-jobs"><strong>{range(value.supplyFte, (n) => count(n, 100))}</strong><span>Indirect employment (FTE) · UK-wide supply chain</span></div></div>
          </div>
          <details className="front-interpretation">
            <summary>What do the ranges mean?</summary><p>Employment estimates across the complete retained portfolio. {employmentNote} Indirect employment is UK-wide, not allocated to individual places.</p>
            <p>{boundsNote} The solid bar reaches the lower estimate; the hatched section extends to the upper. Each scenario uses the same scale.</p>
            <p>These are additional annual exports by 2030, not a cumulative total. Employment is gross direct FTE supported, not a count of new vacancies. The figures cover England’s allocation across the 89 industries (SIC) we have retained for this model.</p>
            <p>Selected scenario: {scenarioNames[route.scenario]}.</p>
            <Button onClick={method}>Read about the model <Icon name="arrow" size={16} /></Button>
          </details>
        </section>
      </div>

      <section className="front-reading" aria-labelledby="front-reading-title">
        <div className="front-reading-intro"><h2 id="front-reading-title">Opportunity has a geography.</h2></div>
        <div className="front-reading-item"><span className="eyebrow">01 / EXAMINE</span><h3>Follow the evidence.</h3><p>PIONEER shows each area's industrial strengths and how related its workers and current industries are to expand and diversify into new products, for new global markets.</p></div>
        <div className="front-reading-item"><span className="eyebrow">02 / EXPAND</span><h3>Build on what is already there.</h3><p>Find opportunities to grow industries that already exist locally.</p></div>
        <div className="front-reading-item"><span className="eyebrow">03 / DIVERSIFY</span><h3>See what could come next.</h3><p>Explore new industries connected to a place’s existing capabilities and occupational strengths.</p></div>
      </section>
      <footer className="front-footer"><span>Independent Commission on Neighbourhoods</span><div><Button onClick={download}><Icon name="download" size={16} />England data</Button><Button onClick={method}>Sources & interpretation <Icon name="arrow" size={16} /></Button></div></footer>
    </main>
  );
}
