import { useEffect, useId, useRef, useState } from "react";
import type { AreaSelection, Place } from "./model";
import {
  containingAreas,
  isFullPostcode,
  matchesArea,
  searchTerms,
} from "./exploration";
import type { SearchArea, PointGeometry } from "./exploration";

type Result = SearchArea & {
  detail?: string;
  eastings?: number;
  northings?: number;
};
let index: Promise<SearchArea[]> | undefined;
let geometries:
  | Promise<{ code: string; geometry: PointGeometry }[]>
  | undefined;
async function json(url: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 10000);
  try {
    const r = await fetch(url, { signal: controller.signal });
    if (!r.ok) throw new Error(r.status === 404 ? "not-found" : "unavailable");
    return await r.json();
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}
export function loadIndex(): Promise<SearchArea[]> {
  return (index ??= import("../public/context/search-index.json")
    .then((m) => m.default)
    .catch((e) => {
      index = undefined;
      throw e;
    }));
}
export function Search({
  places,
  onSelect,
  onArea,
  exclude = [],
}: {
  places: Place[];
  onSelect: (code: string) => void;
  onArea?: (area: AreaSelection) => void;
  exclude?: string[];
}) {
  const id = useId(),
    ref = useRef<HTMLDivElement>(null),
    request = useRef(0);
  const submitPending = useRef(false),
    placesRef = useRef(places);
  placesRef.current = places;
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const [areas, setAreas] = useState<SearchArea[]>([]),
    [remote, setRemote] = useState<Result[]>([]),
    [choices, setChoices] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState(""),
    [context, setContext] = useState(""),
    [indexError, setIndexError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadIndex()
      .then((v) => {
        if (live) {
          setAreas(v);
          setIndexError(false);
        }
      })
      .catch(() => {
        if (live) setIndexError(true);
      });
    return () => {
      live = false;
    };
  }, [attempt]);
  useEffect(() => {
    const outside = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const q = query.trim();
    setRemote([]);
    setStatus("");
    setBusy(false);
    setActive(-1);
    if (q.length < 2 || searchTerms(q).type) return;
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        if (/^[a-z]{1,2}\d/i.test(q)) {
          const full = isFullPostcode(q),
            compact = q.replace(/\s/g, "").toUpperCase();
          const canonical = full
            ? compact.slice(0, -3) + " " + compact.slice(-3)
            : q.toUpperCase();
          const data = await json(
            full
              ? `https://api.postcodes.io/postcodes/${encodeURIComponent(canonical)}`
              : `https://api.postcodes.io/postcodes?query=${encodeURIComponent(canonical)}&limit=6`,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          const results: Result[] = (full ? [data.result] : (data.result ?? []))
            .filter(Boolean)
            .map(
              (p: {
                postcode: string;
                codes?: { ttwa: string };
                admin_district: string;
              }) => {
                const code = p.codes?.ttwa;
                return {
                  code: p.postcode,
                  name: p.postcode,
                  type: "Postcode",
                  ttwas:
                    code && placesRef.current.some((x) => x.code === code)
                      ? [code]
                      : [],
                  outsideAtlas: placesRef.current.some((x) => x.code === code)
                    ? []
                    : [code ?? "unknown"],
                  detail: p.admin_district,
                };
              },
            );
          setRemote(results);
          if (full && submitPending.current && results.length === 1) {
            submitPending.current = false;
            void choose(results[0]);
          }
        } else {
          const data = await json(
            `https://api.postcodes.io/places?q=${encodeURIComponent(q)}&limit=20`,
            controller.signal,
          );
          const results = (data.result ?? [])
            .filter((p: { country: string }) => p.country === "England")
            .map(
              (p: {
                code: string;
                name_1: string;
                local_type: string;
                district_borough: string;
                county_unitary: string;
                eastings: number;
                northings: number;
              }) => ({
                code: p.code,
                name: p.name_1,
                type: p.local_type,
                ttwas: [],
                detail: [p.district_borough, p.county_unitary]
                  .filter(Boolean)
                  .join(", "),
                eastings: p.eastings,
                northings: p.northings,
              }),
            );
          if (controller.signal.aborted) return;
          setRemote(
            results
              .sort(
                (a: Result, b: Result) =>
                  Number(b.name.toLowerCase() === q.toLowerCase()) -
                  Number(a.name.toLowerCase() === q.toLowerCase()),
              )
              .slice(0, 6),
          );
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setStatus(
            (e as Error).message === "not-found"
              ? "No matching postcode. Check the full postcode, including the final three characters."
              : "Live postcode and settlement search is unavailable. You can still search the local-economy and downloaded council/constituency names.",
          );
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, attempt]);
  const q = query.trim().toLowerCase();
  const local: Result[] = [
    ...places.map((p) => ({
      code: p.code,
      name: p.name,
      type: "Local economy",
      ttwas: [p.code],
    })),
    ...areas,
  ]
    .filter((p) => !exclude.includes(p.code) && matchesArea(p, q))
    .sort(
      (a, b) =>
        Number(b.name.toLowerCase() === q) -
          Number(a.name.toLowerCase() === q) ||
        Number(b.name.toLowerCase().startsWith(q)) -
          Number(a.name.toLowerCase().startsWith(q)) ||
        a.name.localeCompare(b.name),
    );
  const matches = choices ?? [
    ...local.slice(0, 12),
    ...remote.filter((r) => !exclude.includes(r.code)),
  ];
  useEffect(() => {
    if (open && active >= 0)
      document
        .getElementById(`${id}-result-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);
  async function choose(r: Result) {
    submitPending.current = false;
    if (r.type === "Local economy") {
      onSelect(r.code);
      setOpen(false);
      setQuery("");
      return;
    }
    const version = ++request.current;
    setBusy(true);
    setStatus("");
    try {
      let codes = r.ttwas;
      if (r.eastings !== undefined && r.northings !== undefined) {
        geometries ??= json("./context/ttwa-points.json").catch((e) => {
          geometries = undefined;
          throw e;
        });
        codes = containingAreas(r.eastings, r.northings, await geometries);
      }
      if (version !== request.current) return;
      if (onArea && codes.length) {
        onArea({
          code: r.code,
          name: r.name,
          type: r.type,
          ttwas: codes,
          outsideAtlas: r.outsideAtlas ?? [],
        });
        setOpen(false);
        setQuery("");
        return;
      }
      const options = places
        .filter((p) => codes.includes(p.code))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({
          code: p.code,
          name: p.name,
          type: "Local economy",
          ttwas: [p.code],
        }));
      setContext(`${r.name}${r.detail ? ` · ${r.detail}` : ""}`);
      setChoices(options);
      setActive(-1);
      setStatus(
        options.length
          ? r.eastings !== undefined
            ? "The mapped centre of this settlement lies in the local economy below. A full postcode gives a more precise location."
            : r.type === "Postcode"
              ? "This postcode is in the following local economy."
              : `This area includes parts of ${options.length} atlas local econom${options.length === 1 ? "y" : "ies"}. Choose one to explore. ONS output-area best-fit lookup; council boundaries: 2023, constituencies: July 2024.${r.outsideAtlas?.length ? " Part of this area lies outside the 149 local economies covered by the atlas." : ""}`
          : "This location is outside the 149 English local economies covered by this atlas. No nearby area has been substituted.",
      );
    } catch {
      setStatus(
        "The geographic lookup could not load. Try again, or search the local-economy name.",
      );
    } finally {
      if (version === request.current) setBusy(false);
    }
  }
  function submit() {
    setOpen(true);
    if (matches.length) void choose(matches[Math.max(0, active)]);
    else if (isFullPostcode(query)) {
      submitPending.current = true;
      setAttempt((x) => x + 1);
    } else if (!busy)
      setStatus("Choose a matching area below, or enter a full postcode.");
  }
  return (
    <div className="search geo-search" ref={ref}>
      <label htmlFor={`${id}-search`}>Find your area</label>
      <div className="search-input">
        <span aria-hidden="true">⌕</span>
        <input
          id={`${id}-search`}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          
          aria-activedescendant={
            open && active >= 0 && active < matches.length
              ? `${id}-result-${active}`
              : undefined
          }
          autoComplete="off"
          placeholder="Postcode, town, council or constituency"
          value={query}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onChange={(e) => {
            request.current++;
            submitPending.current = false;
            setRemote([]);
            setQuery(e.target.value);
            setChoices(null);
            setContext("");
            setOpen(!!e.target.value.trim());
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
              e.stopPropagation();
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            }
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          className="search-submit"
          onClick={submit}
          aria-label="Look up this area"
        >
          Go →
        </button>
      </div>
      {open && (
        <div className="search-results">
          {choices && (
            <div className="search-context">
              <strong>{context}</strong>
              <button
                type="button"
                className="inline-link"
                onClick={() => {
                  request.current++;
                  setChoices(null);
                  setContext("");
                  setStatus("");
                }}
              >
                Back to results
              </button>
            </div>
          )}
          <div role="listbox" id={`${id}-results`} aria-label="Matching areas">
            {matches.map((r, i) => (
              <div
                key={`${r.type}-${r.code}`}
                role="option"
                id={`${id}-result-${i}`}
                aria-selected={i === active}
                className={i === active ? "active" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choose(r)}
              >
                <span>
                  <strong>{r.name}</strong>
                  {r.detail && <small>{r.detail}</small>}
                  {(r.type === "Local authority" ||
                    r.type === "County council" ||
                    r.type === "Constituency") && (
                    <small>
                      {r.ttwas.length} connected local econom{r.ttwas.length === 1 ? "y" : "ies"}
                      {r.outsideAtlas?.length
                        ? " · some coverage outside Atlas"
                        : ""}
                    </small>
                  )}
                </span>
                <span className="result-type">{r.type}</span>
              </div>
            ))}
          </div>
          <p role="status" className="search-status">
            {busy
              ? "Looking up geography…"
              : status ||
                (!matches.length
                  ? "No matching areas. Try a longer name or a full postcode."
                  : `${matches.length} results. Use ↑ ↓ and Enter to select.`)}
          </p>
          {(indexError ||
            status.includes("unavailable") ||
            status.includes("could not")) && (
            <button
              className="inline-link"
              onClick={() => setAttempt((x) => x + 1)}
            >
              Retry search services
            </button>
          )}
          {indexError && (
            <p className="small-note">
              Council and constituency lookup is temporarily unavailable.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
