import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { count, needClass, ordinal, quantiles, SHEFFIELD } from "./model";
import type { Dataset, Route } from "./model";
import { Button, Icon } from "./ui";

type Box = [number, number, number, number];
const ENGLAND: Box = [0, 0, 620, 760];
function bounds(path: string): Box {
  const n = path.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
  const xs: number[] = [],
    ys: number[] = [];
  n.forEach((v, i) => (i % 2 ? ys : xs).push(v));
  const x = Math.min(...xs),
    y = Math.min(...ys);
  return [x, y, Math.max(...xs) - x, Math.max(...ys) - y];
}
export function AtlasMap({
  data,
  selected,
  lens,
  onSelect,
  onLens,
  reading,
}: {
  data: Dataset;
  selected: string | null;
  lens: Route["lens"];
  onSelect: (code: string) => void;
  onLens: (lens: Route["lens"]) => void;
  reading: boolean;
}) {
  const [view, setView] = useState<Box>(ENGLAND);
  const viewRef = useRef<Box>(view);
  viewRef.current = view;
  const [hovered, setHovered] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const frame = useRef(0);
  const drag = useRef<{
    x: number;
    y: number;
    view: Box;
    moved: boolean;
  } | null>(null);
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const byCode = useMemo(
    () => new Map(data.places.map((p) => [p.code, p])),
    [data],
  );
  const boxes = useMemo(
    () => new Map(data.boundaries.map((p) => [p.code, bounds(p.path)])),
    [data],
  );
  const breaks = useMemo(() => quantiles(data.places), [data]);
  const preview = hovered ? byCode.get(hovered) : null;
  const selectedBoundary = data.boundaries.find((b) => b.code === selected);
  function fitTarget(): Box {
    if (!selected) return ENGLAND;
    const b = boxes.get(selected)!;
    const w = Math.max(b[2] * 4, 210),
      h = (w * 760) / 620;
    return [b[0] + b[2] / 2 - w / 2, b[1] + b[3] / 2 - h / 2, w, h];
  }
  function animate(target: Box) {
    cancelAnimationFrame(frame.current);
    if (reduced.current) {
      setView(target);
      return;
    }
    const start = performance.now(),
      from = viewRef.current;
    function tick(now: number) {
      const t = Math.min((now - start) / 320, 1),
        ease = 1 - Math.pow(1 - t, 3);
      setView(from.map((v, i) => v + (target[i] - v) * ease) as Box);
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
  }
  useEffect(() => {
    animate(fitTarget());
    setHovered(null);
    return () => cancelAnimationFrame(frame.current);
  }, [selected]); // Selection is the camera destination; scenario is deliberately absent.
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduced.current = media.matches;
      if (media.matches) cancelAnimationFrame(frame.current);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  function zoom(factor: number) {
    const [x, y, w, h] = viewRef.current;
    const nw = Math.max(90, Math.min(850, w * factor));
    animate([x + (w - nw) / 2, y + (h - (nw * h) / w) / 2, nw, (nw * h) / w]);
  }
  function point(e: ReactPointerEvent<SVGSVGElement>) {
    const p = new DOMPoint(e.clientX, e.clientY);
    const matrix = svg.current?.getScreenCTM();
    return matrix ? p.matrixTransform(matrix.inverse()) : p;
  }
  const labelCodes = selected
    ? [selected]
    : [SHEFFIELD, "E30000275", "E30000261"];
  const uniqueLabels = [...new Set(labelCodes)];
  return (
    <section
      className={`atlas-map ${reading ? "map-context" : ""}`}
      aria-label="England economic atlas"
    >
      <div className="map-head">
        <div>
          <span className="eyebrow">
            {selected
              ? "LOCAL ECONOMY / 2011 TTWA"
              : "ENGLAND / 149 LOCAL LABOUR MARKETS"}
          </span>
          <h2>
            {selected
              ? byCode.get(selected)?.name
              : "A geography of possibility"}
          </h2>
        </div>
        <label className="lens-control">
          <span className="sr-only">Map layer</span>
          <select
            aria-label="Map layer"
            value={lens}
            onChange={(e) => onLens(e.target.value as typeof lens)}
          >
            <option value="opportunities">Opportunities</option>
            <option value="need">Neighbourhood need</option>
            {selected && (
              <option value="neighbourhoods">Local IMD deciles</option>
            )}
          </select>
        </label>
      </div>
      <div className={`map-stage ${dragging ? "dragging" : ""}`}>
        <svg
          ref={svg}
          className="geography"
          viewBox={view.join(" ")}
          aria-label="Travel to Work Areas in England. Select an area or use place search."
          role="group"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            cancelAnimationFrame(frame.current);
            const p = point(e);
            drag.current = {
              x: p.x,
              y: p.y,
              view: viewRef.current,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const p = point(e);
            if (
              Math.abs(p.x - drag.current.x) + Math.abs(p.y - drag.current.y) >
              3
            ) {
              drag.current.moved = true;
              setDragging(true);
              setHovered(null);
              const b = viewRef.current;
              setView([
                b[0] + drag.current.x - p.x,
                b[1] + drag.current.y - p.y,
                b[2],
                b[3],
              ]);
            }
          }}
          onPointerUp={() => {
            setDragging(false);
            setTimeout(() => {
              drag.current = null;
            }, 0);
          }}
          onPointerLeave={() => {
            drag.current = null;
            setDragging(false);
            setHovered(null);
          }}
        >
          {data.boundaries.map((b) => (
            <path
              key={b.code}
              d={b.path}
              className={`ttwa ${b.code === selected ? "is-selected" : ""} ${hovered === b.code ? "is-hovered" : ""} ${lens === "need" ? `need-${needClass(byCode.get(b.code)!.localDeprivationPercentile, breaks)}` : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${b.name}, ${byCode.get(b.code)!.candidateOptions} candidate industries`}
              aria-pressed={selected === b.code}
              onPointerEnter={() => {
                if (!drag.current?.moved) setHovered(b.code);
              }}
              onPointerMove={() => {
                if (!drag.current) setHovered(b.code);
              }}
              onFocus={() => setHovered(b.code)}
              onBlur={() => setHovered(null)}
              onClick={() => {
                if (!drag.current?.moved) onSelect(b.code);
                drag.current = null;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b.code);
                }
              }}
            />
          ))}
          {selectedBoundary && (
            <path className="selected-halo" d={selectedBoundary.path} />
          )}
          {selectedBoundary && (
            <path className="selected-outline" d={selectedBoundary.path} />
          )}
          {uniqueLabels.map((code) => {
            const b = boxes.get(code);
            if (!b) return null;
            const x = b[0] + b[2] / 2,
              y = b[1] + b[3] / 2;
            const size = view[2] / 620;
            const name = byCode.get(code)?.name ?? "";
            const lines: string[] = [];
            for (const word of name.split(" ")) {
              if (
                !lines.length ||
                `${lines[lines.length - 1]} ${word}`.length > 22
              )
                lines.push(word);
              else lines[lines.length - 1] += ` ${word}`;
            }
            return (
              <g
                key={code}
                transform={`translate(${x},${y}) scale(${size})`}
                className="map-label"
                aria-hidden="true"
              >
                <path d={lines.length > 1 ? "M0 0v8" : "M0 0h26"} />
                <circle r="3" />
                <text
                  x={lines.length > 1 ? 0 : 32}
                  y={lines.length > 1 ? 23 : 4}
                  textAnchor={lines.length > 1 ? "middle" : "start"}
                >
                  {lines.map((line, i) => (
                    <tspan
                      key={i}
                      x={lines.length > 1 ? 0 : 32}
                      dy={i ? 16 : 0}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
        {!selected && (
          <div className="map-direction" aria-hidden="true">
            <span>N</span>
            <span>↑</span>
          </div>
        )}
        <div className="map-zoom">
          <Button onClick={() => zoom(0.75)} aria-label="Zoom in">
            <Icon name="plus" />
          </Button>
          <Button onClick={() => zoom(1.33)} aria-label="Zoom out">
            <Icon name="minus" />
          </Button>
          <Button
            onClick={() => animate(fitTarget())}
            aria-label={selected ? "Fit selected place" : "Fit England"}
          >
            <Icon name="fit" />
          </Button>
        </div>
        {preview && (
          <div className="map-tooltip" role="status">
            <span className="eyebrow">TRAVEL TO WORK AREA</span>
            <strong>{preview.name}</strong>
            <span>
              {lens === "need"
                ? `${ordinal(preview.localDeprivationPercentile)} percentile · neighbourhood need`
                : `${count(preview.candidateOptions)} retained industrial candidates`}
            </span>
          </div>
        )}
        {selected && (
          <svg
            className="locator"
            viewBox="0 0 620 760"
            aria-label="Selected place within England"
            role="img"
          >
            {data.boundaries.map((b) => (
              <path
                d={b.path}
                key={b.code}
                className={b.code === selected ? "locator-selected" : ""}
              />
            ))}
          </svg>
        )}
      </div>
      <div className="map-bottom">
        {lens === "need" ? (
          <>
            <div className="legend">
              <span>Lower need</span>
              <span className="legend-swatches">
                {[1, 2, 3, 4, 5].map((i) => (
                  <i key={i} className={`need-${i}`} />
                ))}
              </span>
              <span>Higher need</span>
            </div>
            <details>
              <summary>Percentile class boundaries</summary>
              <p>
                {breaks.map((x) => x.toFixed(1)).join(" / ")}. Existing quantile
                classification. Need ranks the share of residents in England’s
                most deprived 20% of neighbourhoods.
              </p>
            </details>
          </>
        ) : (
          <p>
            <i className="map-key" /> Select a local economy to explore its
            opportunities.
          </p>
        )}
        <span className="map-source">
          ONS TTWA 2011 · Existing PIONEER geography
        </span>
      </div>
    </section>
  );
}
