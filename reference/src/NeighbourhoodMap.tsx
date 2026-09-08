import { useEffect, useRef, useState } from "react";
import type {
  Neighbourhood,
  NeighbourhoodMapData,
  Place,
  Route,
} from "./model";
import { Button, Icon } from "./ui";

export function NeighbourhoodMap({
  place,
  onLens,
}: {
  place: Place;
  onLens: (lens: Route["lens"]) => void;
}) {
  const [data, setData] = useState<NeighbourhoodMapData | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Neighbourhood | null>(null);
  const [view, setView] = useState([0, 0, 620, 760]);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(false);
    setSelected(null);
    setView([0, 0, 620, 760]);
    fetch(`./data/neighbourhoods/${place.code}.json`, {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((value: NeighbourhoodMapData) => {
        if (value.ttwaCode !== place.code || !value.neighbourhoods?.length)
          throw new Error();
        setData(value);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [place.code, attempt]);
  function zoom(factor: number) {
    setView(([x, y, w, h]) => {
      const nw = Math.max(80, Math.min(1000, w * factor)),
        nh = (nw * h) / w;
      return [x + (w - nw) / 2, y + (h - nh) / 2, nw, nh];
    });
  }
  return (
    <section
      className="atlas-map neighbourhood-map"
      aria-label={`${place.name} neighbourhood deprivation`}
    >
      <div className="map-head">
        <div>
          <span className="eyebrow">LOCAL CONTEXT / 2021 LSOA</span>
          <h2>{place.name}</h2>
        </div>
        <label className="lens-control">
          <span className="sr-only">Map layer</span>
          <select
            aria-label="Map layer"
            value="neighbourhoods"
            onChange={(e) => onLens(e.target.value as Route["lens"])}
          >
            <option value="opportunities">Opportunities</option>
            <option value="need">Neighbourhood need</option>
            <option value="neighbourhoods">Local IMD deciles</option>
          </select>
        </label>
      </div>
      <div className="map-stage">
        {!data ? (
          <div className="map-load" role="status">
            <p>
              {error
                ? "The neighbourhood map could not load."
                : "Loading neighbourhood geography…"}
            </p>
            {error && (
              <Button
                className="button-outline"
                onClick={() => setAttempt((a) => a + 1)}
              >
                Try again
              </Button>
            )}
            <Button onClick={() => onLens("need")}>
              Return to TTWA context
            </Button>
          </div>
        ) : (
          <>
            <svg
              ref={svg}
              className="geography"
              viewBox={view.join(" ")}
              role="group"
              aria-label={`${data.neighbourhoods.length} neighbourhoods, coloured by national IMD decile`}
              onPointerDown={(e) => {
                if (e.button === 0)
                  drag.current = { x: e.clientX, y: e.clientY, moved: false };
              }}
              onPointerMove={(e) => {
                if (!drag.current) return;
                const dx = e.clientX - drag.current.x,
                  dy = e.clientY - drag.current.y;
                if (Math.abs(dx) + Math.abs(dy) > 3) {
                  drag.current.moved = true;
                  const scale = svg.current?.getScreenCTM()?.a ?? 1;
                  setView(([x, y, w, h]) => [
                    x - dx / scale,
                    y - dy / scale,
                    w,
                    h,
                  ]);
                  drag.current.x = e.clientX;
                  drag.current.y = e.clientY;
                  setSelected(null);
                }
              }}
              onPointerUp={() =>
                setTimeout(() => {
                  drag.current = null;
                }, 0)
              }
              onPointerLeave={() => {
                drag.current = null;
              }}
            >
              {data.neighbourhoods.map((n) => (
                <path
                  key={n.code}
                  d={n.path}
                  className={`lsoa imd-${n.imdDecile}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.name}: IMD decile ${n.imdDecile} of 10`}
                  onPointerEnter={() => {
                    if (!drag.current) setSelected(n);
                  }}
                  onFocus={() => setSelected(n)}
                  onClick={() => {
                    if (!drag.current?.moved) setSelected(n);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(n);
                    }
                  }}
                />
              ))}
              {selected && (
                <>
                  <path d={selected.path} className="selected-halo" />
                  <path d={selected.path} className="selected-outline" />
                </>
              )}
            </svg>
            <div className="map-zoom">
              <Button aria-label="Zoom in" onClick={() => zoom(0.75)}>
                <Icon name="plus" />
              </Button>
              <Button aria-label="Zoom out" onClick={() => zoom(1.33)}>
                <Icon name="minus" />
              </Button>
              <Button
                aria-label="Fit neighbourhoods"
                onClick={() => setView([0, 0, 620, 760])}
              >
                <Icon name="fit" />
              </Button>
            </div>
            {selected && (
              <div className="map-tooltip" role="status">
                <span className="eyebrow">{selected.code}</span>
                <strong>{selected.name}</strong>
                <span>IMD decile {selected.imdDecile} of 10</span>
                <Button
                  aria-label="Dismiss neighbourhood detail"
                  onClick={() => setSelected(null)}
                >
                  <Icon name="close" size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="neighbourhood-legend">
        <div className="imd-swatches">
          {Array.from({ length: 10 }, (_, i) => (
            <span className={`imd-${i + 1}`} key={i}>
              {i + 1}
            </span>
          ))}
        </div>
        <div>
          <span>Most deprived</span>
          <span>Least deprived</span>
        </div>
        <p>
          IMD 2025 national deciles · 2021 LSOAs. Context about need, not an
          allocation of industry jobs to residents.
        </p>
      </div>
    </section>
  );
}
