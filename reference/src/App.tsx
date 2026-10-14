import { useEffect, useRef, useState } from "react";
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
import { AtlasLink, IndustryView, PlaceView, PlaceBanner } from "./views";
import {
  CompareView,
  IndustryExplore,
  PlaceCoverage,
  NationalOutlook,
} from "./ExploreViews";
import { AreaView } from "./AreaViews";
import { exportSelection, industryName } from "./exploration";
import employmentBase from "../public/context/employment-base.json";
import { LandingPage } from "./LandingPage";

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    readRoute(window.location.search),
  );
  const [data, setData] = useState<Dataset | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  const [method, setMethod] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [shareText, setShareText] = useState("");
  const [contextExpanded, setContextExpanded] = useState(false);
  const reading = useRef<HTMLElement>(null),
    first = useRef(true);
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
    const pop = () => setRoute(readRoute(window.location.search));
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  function nextRoute(update: Partial<Route>): Route {
    const next = { ...route, ...update, error: undefined };
    if (update.view && update.view !== "explore") {
      if (next.filter === "exploration") next.filter = "all";
      next.area = null;
      next.place = null;
      next.industry = null;
      next.lens = "need";
    }
    if (update.place) {
      next.area = null;
      next.view = "explore";
      if (update.lens === undefined) next.lens = "neighbourhoods";
      if (update.place !== route.place) {
        next.filter = update.filter ?? "all";
        next.sort = "jobs";
        next.query = "";
        next.sector = null;
      }
    }
    if (update.place === null) {
      next.industry = null;
      next.section = "why";
      if (next.lens === "neighbourhoods") next.lens = "need";
    }
    if (update.view === "explore" && update.place === null) {
      if (!update.area) next.area = null;
      next.sector = null;
      next.filter = "all";
      next.query = "";
      next.sort = "jobs";
    }
    if (update.area) {
      next.view = "explore";
      next.place = null;
      next.industry = null;
      next.lens = "need";
      next.sector = null;
      next.filter = "all";
      next.query = "";
      next.sort = "jobs";
    }
    return next;
  }
  function link(update: Partial<Route>) {
    return `./${routeSearch(nextRoute(update))}`;
  }
  function go(update: Partial<Route>) {
    const next = nextRoute(update);
    if (Object.keys(update).length === 1 && update.query !== undefined)
      window.history.replaceState({}, "", `./${routeSearch(next)}`);
    else window.history.pushState({}, "", `./${routeSearch(next)}`);
    setRoute(next);
    setShareText("");
    if (update.place !== undefined) setContextExpanded(false);
  }
  const place = data?.places.find((p) => p.code === route.place);
  const option = data?.options.find(
    (o) => o.ttwaCode === route.place && o.sic4 === route.industry,
  );
  useEffect(() => {
    document.title = `${option ? `${industryName(option.industry)} · ` : ""}${place?.name ?? route.area?.name ?? (route.view === "compare" ? "Compare local economies" : route.view === "industries" ? "Explore industries" : "England’s industrial possibilities")} — PIONEER Atlas`;
    if (!data) return;
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    reading.current?.scrollTo({ top: 0 });
      (reading.current?.querySelector<HTMLElement>("h1") ??
        document.querySelector<HTMLElement>(".place-banner h1"))
        ?.focus({ preventScroll: true });
  }, [
    route.place,
    route.industry,
    route.section,
    route.view,
    route.sector,
    route.area,
    data,
  ]);
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
    const selected = exportSelection(data, route);
    const payload = {
      ...selected,
      employmentScale: {
        ...employmentBase,
        totals: Object.fromEntries(
          selected.places.map((p) => [
            p.code,
            (employmentBase.totals as Record<string, number>)[p.code],
          ]),
        ),
      },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `pioneer-${route.place ?? route.view ?? "england"}-${route.industry ?? route.sector ?? "portfolio"}-${route.scenario}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const routeError = data ? validateRoute(route, data) : undefined;
  const view = route.view ?? "explore",
    home = !place && !route.area && view === "explore";
  return (
    <>
      <a href="#reading" className="skip-link">
        Skip map to content
      </a>
      <header className="site-header">
        <AtlasLink
          className="brand"
          href={link({ view: "explore", place: null, lens: "need" })}
          onClick={() => go({ view: "explore", place: null, lens: "need" })}
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
          {(["explore", "industries", "compare"] as const).map((v, i) => (
            <AtlasLink
              key={v}
              className={view === v ? "nav-current" : ""}
              href={link({
                view: v,
                place: null,
                sector: null,
                query: "",
                filter: "all",
                sort: "jobs",
              })}
              onClick={() =>
                go({
                  view: v,
                  place: null,
                  sector: null,
                  query: "",
                  filter: "all",
                  sort: "jobs",
                })
              }
            >
              {["Explore", "Industries", "Compare"][i]}
            </AtlasLink>
          ))}
          <button onClick={() => setMethod(true)}>The model</button>
          <button
            className="header-search"
            aria-label="Find your area"
            onClick={() => setSearchOpen(true)}
          >
            <Icon name="search" size={18} />
            <span>Find your area</span>
          </button>
        </nav>
      </header>
      {data && !routeError && !home && !place && !route.area && (
        <NationalOutlook data={data} route={route} go={go} />
      )}
      {data && place && !option && !routeError && <PlaceBanner place={place} data={data} route={route} go={go} link={link} />}
      {!home && <div className="location-rail">
        <nav aria-label="Breadcrumb">
          <AtlasLink
            href={link({ view: "explore", place: null })}
            onClick={() => go({ view: "explore", place: null })}
          >
            England
          </AtlasLink>
          {place && (
            <>
              <span>/</span>
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
              <span>/</span>
              <span className="code">SIC {option.sic4}</span>
            </>
          )}
          {route.area && (
            <>
              <span>/</span>
              <span>{route.area.name}</span>
            </>
          )}
          {!place && view !== "explore" && (
            <>
              <span>/</span>
              <span>
                {view === "compare" ? "Compare places" : "Explore industries"}
              </span>
            </>
          )}
        </nav>
        <div className="rail-actions">
          <Button
            onClick={copyLink}
            aria-label="Copy link to this analytical state"
          >
            Share <Icon name="external" size={16} />
          </Button>
          <Button
            onClick={exportData}
            disabled={!data || !!routeError}
            aria-label="Download current research data"
          >
            <Icon name="download" size={16} />
            <span className="export-label">Data</span>
          </Button>
        </div>
      </div>}
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
                "Preparing England’s geography and industrial evidence."}
            </p>
            {error && (
              <Button
                className="button-primary"
                onClick={() => setAttempt((a) => a + 1)}
              >
                Try again
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
                  view: "explore",
                  place: null,
                  industry: null,
                  sector: null,
                  compare: [],
                  filter: "all",
                  sort: "jobs",
                  query: "",
                  scenario: "policy_acceleration",
                  section: "why",
                  lens: "need",
                })
              }
            >
              Return to England
            </Button>
          </StateMessage>
        </main>
      ) : home ? (
        <LandingPage data={data} route={route} go={go} link={link}
          method={() => setMethod(true)} reading={reading} download={exportData} />
      ) : (
        <main
          className={`workspace ${place && !option ? "has-place" : "wide-page"} ${option ? "workspace-dossier" : ""} ${contextExpanded ? "context-expanded" : ""}`}
        >
          {place && !option && (
            <aside className="place-context">
              <div className="context-title">
                <span className="eyebrow">
                  THE PLACE BEHIND THE OPPORTUNITIES
                </span>
                <h2>Neighbourhood context</h2>
                <PlaceCoverage code={place.code} />
                <p>
                  Deprivation map of {place.name}. ICON recommends that local policymakers prioritise routes into work from areas that have high levels of deprivation, into new industrial opportunities.
                </p>
                <Button
                  className="button-outline"
                  onClick={() => setContextExpanded((v) => !v)}
                >
                  {contextExpanded ? "Compact map" : "Enlarge map"}
                  <Icon name="map" size={16} />
                </Button>
              </div>
              <NeighbourhoodMap key={place.code} place={place} />
            </aside>
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
                  : route.area
                    ? `${route.area.name} connected local economies`
                    : view === "compare"
                      ? "Compare places"
                      : view === "industries"
                        ? "Explore industries"
                        : "Explore England"
            }
          >
            {view === "compare" ? (
              <CompareView data={data} route={route} go={go} link={link} />
            ) : view === "industries" ? (
              <IndustryExplore data={data} route={route} go={go} link={link} />
            ) : route.area ? (
              <AreaView data={data} route={route} go={go} link={link} />
            ) : option ? (
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
            ) : null}
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
            go({
              view: "explore",
              place: code,
              industry: null,
              section: "why",
            });
          }}
          onArea={(area) => {
            setSearchOpen(false);
            go({ area });
          }}
        />
      )}
    </>
  );
}
