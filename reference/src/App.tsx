import { useEffect, useRef, useState } from "react";
import { AtlasMap } from "./AtlasMap";
import { NeighbourhoodMap } from "./NeighbourhoodMap";
import { fetchDataset, readRoute, routeSearch, validateRoute } from "./model";
import type { Dataset, Route } from "./model";
import {
  Button,
  Icon,
  MethodDialog,
  StateMessage,
  PlaceSearchDialog,
} from "./ui";
import { AtlasLink, HomeView, IndustryView, PlaceView } from "./views";

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    readRoute(window.location.search),
  );
  const [data, setData] = useState<Dataset | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapOnMobile, setMapOnMobile] = useState(!route.place);
  const [shareText, setShareText] = useState("");
  const reading = useRef<HTMLElement>(null);
  const first = useRef(true);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetchDataset(controller.signal)
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const pop = () => {
      const next = readRoute(window.location.search);
      setRoute(next);
      setMapOnMobile(!next.place);
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function link(update: Partial<Route>) {
    const next = { ...route, ...update, error: undefined };
    if (update.place === null) {
      next.industry = null;
      next.section = "why";
      if (next.lens === "neighbourhoods") next.lens = "need";
    }
    return `./${routeSearch(next)}`;
  }
  function go(update: Partial<Route>) {
    const next = { ...route, ...update, error: undefined };
    if (update.place === null) {
      next.industry = null;
      next.section = "why";
      if (next.lens === "neighbourhoods") next.lens = "need";
    }
    window.history.pushState({}, "", link(next));
    setRoute(next);
    setShareText("");
    if (update.place !== undefined || update.industry !== undefined)
      setMapOnMobile(!next.place);
  }
  useEffect(() => {
    if (!data) return;
    const place = data.places.find((p) => p.code === route.place);
    const option = data.options.find(
      (o) => o.sic4 === route.industry && o.ttwaCode === route.place,
    );
    document.title = `${option && route.industry ? `${option.industry} · ` : ""}${place?.name ?? "England’s industrial possibilities"} — PIONEER Atlas`;
    if (first.current) {
      first.current = false;
      return;
    }
    reading.current?.scrollTo({ top: 0 });
    reading.current
      ?.querySelector<HTMLElement>("h1")
      ?.focus({ preventScroll: true });
  }, [route.place, route.industry, route.section, data]);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareText("Link copied");
    } catch {
      setShareText(window.location.href);
    }
  }
  function exportData() {
    if (!data) return;
    const place = data.places.find((p) => p.code === route.place);
    const options = data.options.filter(
      (o) =>
        o.ttwaCode === route.place &&
        (!route.industry || o.sic4 === route.industry),
    );
    const payload = {
      metadata: {
        source: data.manifest,
        url: window.location.href,
        scenario: route.scenario,
        exportedAt: new Date().toISOString(),
        scope: route.industry
          ? "One stored place-industry proposition; national product/market context"
          : "Complete place summary; published leading propositions, not necessarily the complete candidate portfolio",
        interpretation:
          "Conditional gross direct TTWA FTE; associated indirect FTE is UK-wide. Not net new jobs, forecasts or evidence of local product manufacture.",
      },
      place,
      propositions: options,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `pioneer-${route.place}-${route.industry ?? "place"}-${route.scenario}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const place = data?.places.find((p) => p.code === route.place);
  const option = data?.options.find(
    (o) => o.sic4 === route.industry && o.ttwaCode === route.place,
  );
  const routeError = data ? validateRoute(route, data) : undefined;
  return (
    <>
      <a href="#reading" className="skip-link">
        Skip map to content
      </a>
      <header className="site-header">
        <AtlasLink
          className="brand"
          href={link({ place: null, industry: null, lens: "opportunities" })}
          onClick={() =>
            go({ place: null, industry: null, lens: "opportunities" })
          }
        >
          <strong>
            PIONEER<span className="brand-stop">.</span>
          </strong>
          <span className="brand-descriptor">
            AN ECONOMIC
            <br />
            ATLAS FOR ENGLAND
          </span>
        </AtlasLink>
        <nav aria-label="Main navigation">
          <AtlasLink
            className={!route.place ? "nav-current" : ""}
            href={link({ place: null, industry: null })}
            onClick={() => go({ place: null, industry: null })}
          >
            Explore
          </AtlasLink>
          <button onClick={() => setMethod(true)}>
            The model <Icon name="info" size={16} />
          </button>
          {data && (
            <button onClick={() => setSearchOpen(true)}>
              Find a place <Icon name="search" size={16} />
            </button>
          )}
        </nav>
      </header>
      <div className="location-rail">
        <nav aria-label="Breadcrumb">
          <AtlasLink
            href={link({ place: null, industry: null })}
            onClick={() => go({ place: null, industry: null })}
          >
            England
          </AtlasLink>
          {place && (
            <>
              <span aria-hidden="true">/</span>
              <AtlasLink
                href={link({ industry: null, section: "why" })}
                onClick={() => go({ industry: null, section: "why" })}
              >
                {place.name}
              </AtlasLink>
            </>
          )}
          {option && (
            <>
              <span aria-hidden="true">/</span>
              <span className="code">SIC {option.sic4}</span>
            </>
          )}
        </nav>
        <div className="rail-actions">
          {place && (
            <>
              <Button
                className="mobile-switch"
                onClick={() => setMapOnMobile((v) => !v)}
              >
                <Icon name="map" size={16} />
                {mapOnMobile ? "Profile" : "Map"}
              </Button>
              <Button
                onClick={copyLink}
                aria-label="Copy link to this analytical state"
              >
                Share <Icon name="external" size={16} />
              </Button>
              {place && (
                <Button
                  onClick={exportData}
                  aria-label="Download current research data"
                >
                  <Icon name="download" size={16} />
                  <span className="export-label">Data</span>
                </Button>
              )}
            </>
          )}
          {!place && <span className="edition">PIONEER / ENGLAND</span>}
        </div>
      </div>
      {shareText && (
        <div className="share-status" role="status">
          {shareText}
          <Button
            onClick={() => setShareText("")}
            aria-label="Dismiss share message"
          >
            <Icon name="close" size={16} />
          </Button>
        </div>
      )}
      {!data ? (
        <main className="loading-shell">
          <StateMessage
            title={error ? "The atlas could not load." : "Opening the atlas…"}
            busy={!error}
          >
            <p>
              {error ||
                "Preparing England’s geography and existing industrial evidence."}
            </p>
            {error && (
              <Button
                className="button-primary"
                onClick={() => setAttempt((a) => a + 1)}
              >
                Try again <Icon name="arrow" />
              </Button>
            )}
          </StateMessage>
        </main>
      ) : routeError ? (
        <main className="loading-shell">
          <StateMessage title="This view is unavailable.">
            <p>{routeError}</p>
            <Button
              className="button-primary"
              onClick={() =>
                go({
                  place: null,
                  industry: null,
                  scenario: "policy_acceleration",
                  section: "why",
                  lens: "opportunities",
                })
              }
            >
              Return to England <Icon name="arrow" />
            </Button>
          </StateMessage>
        </main>
      ) : (
        <main
          className={`workspace ${option ? "workspace-dossier" : ""} ${place ? "has-place" : "is-home"} ${mapOnMobile ? "mobile-map" : "mobile-reading"}`}
        >
          {route.lens === "neighbourhoods" && place ? (
            <NeighbourhoodMap
              key={place.code}
              place={place}
              onLens={(lens) => go({ lens })}
            />
          ) : (
            <AtlasMap
              data={data}
              selected={route.place}
              lens={route.lens}
              onSelect={(code) =>
                go({ place: code, industry: null, section: "why" })
              }
              onLens={(lens) => go({ lens })}
              reading={!!option}
            />
          )}
          <section
            className="reading-panel"
            id="reading"
            tabIndex={-1}
            ref={reading}
            aria-label={
              option
                ? `${option.industry} evidence`
                : place
                  ? `${place.name} economic profile`
                  : "Explore England"
            }
          >
            {option ? (
              <IndustryView
                option={option}
                placeName={place!.name}
                route={route}
                go={go}
                link={link}
                method={() => setMethod(true)}
              />
            ) : place ? (
              <PlaceView
                key={place.code}
                place={place}
                data={data}
                route={route}
                go={go}
                link={link}
                method={() => setMethod(true)}
              />
            ) : (
              <HomeView data={data} go={go} route={route} />
            )}
            <footer className="reading-footer">
              <span>Independent Commission on Neighbourhoods</span>
              <button onClick={() => setMethod(true)}>
                Sources & interpretation <Icon name="arrow" size={14} />
              </button>
            </footer>
          </section>
        </main>
      )}
      <MethodDialog open={method} onClose={() => setMethod(false)} />
      {searchOpen && data && (
        <PlaceSearchDialog
          places={data.places}
          onClose={() => setSearchOpen(false)}
          onSelect={(code) => {
            setSearchOpen(false);
            go({ place: code, industry: null, section: "why" });
          }}
        />
      )}
    </>
  );
}
