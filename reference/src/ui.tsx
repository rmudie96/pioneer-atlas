import { useEffect, useId, useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { count, ordinal, rating, scenarioNames, SCENARIOS } from "./model";
import type { Place, Scenario } from "./model";

export function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "back"
    | "search"
    | "plus"
    | "minus"
    | "close"
    | "download"
    | "external"
    | "map"
    | "info"
    | "fit";
  size?: number;
}) {
  const paths = {
    arrow: "M4 10h12M11 5l5 5-5 5",
    back: "M16 10H4M9 5l-5 5 5 5",
    search: "M13 13l4 4M8.5 3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11",
    plus: "M10 4v12M4 10h12",
    minus: "M4 10h12",
    close: "M5 5l10 10M15 5 5 15",
    download: "M10 3v10M6 9l4 4 4-4M4 14v3h12v-3",
    external: "M11 3h6v6M17 3 8 12M8 4H4v12h12v-4",
    map: "M2 5l5-2 6 2 5-2v12l-5 2-6-2-5 2ZM7 3v12M13 5v12",
    info: "M10 9v5M10 6v.1M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16",
    fit: "M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Button({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`button ${className}`} {...props}>
      {children}
    </button>
  );
}
export function SectionHeading({
  number,
  children,
  aside,
}: {
  number?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>
        {number && <span className="section-number">{number}</span>}
        {children}
      </h2>
      {aside}
    </div>
  );
}
export function Metric({
  value,
  label,
  primary = false,
  note,
}: {
  value: string;
  label: string;
  primary?: boolean;
  note?: ReactNode;
}) {
  return (
    <div className={`metric ${primary ? "metric-primary" : ""}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {note && <div className="metric-note">{note}</div>}
    </div>
  );
}
export function StateMessage({
  title,
  children,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <div className="state-message" role={busy ? "status" : undefined}>
      <span className="eyebrow">PIONEER ATLAS</span>
      <h1 tabIndex={-1}>{title}</h1>
      <div>{children}</div>
    </div>
  );
}
export function ScenarioSelect({
  value,
  onChange,
}: {
  value: Scenario;
  onChange: (s: Scenario) => void;
}) {
  return (
    <div className="scenario-field">
      <label htmlFor="scenario">Export scenario</label>
      <select
        id="scenario"
        value={value}
        onChange={(e) => onChange(e.target.value as Scenario)}
      >
        {SCENARIOS.map((s) => (
          <option key={s} value={s}>
            {scenarioNames[s]}
          </option>
        ))}
      </select>
      <span className="scenario-year">by 2030</span>
    </div>
  );
}
export function EvidenceTrack({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: string;
}) {
  return (
    <div className="evidence-track">
      <div className="track-heading">
        <h3>{label}</h3>
        <span>{rating(status)}</span>
      </div>
      <div className="track-value">
        {ordinal(value)} <span>percentile</span>
      </div>
      <div className="track" aria-hidden="true">
        <span
          className="track-fill"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <div className="track-axis" aria-hidden="true">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  );
}
export function Search({
  places,
  onSelect,
}: {
  places: Place[];
  onSelect: (code: string) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const matches = places
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);
  function choose(p: Place) {
    onSelect(p.code);
    setQuery("");
    setOpen(false);
    setActive(-1);
  }
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <div className="search" ref={ref}>
      <label htmlFor={`${id}-search`}>Find a local economy</label>
      <div className="search-input">
        <Icon name="search" />
        <input
          id={`${id}-search`}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            open && active >= 0 ? `${id}-result-${active}` : undefined
          }
          autoComplete="off"
          placeholder="Search for a place…"
          value={query}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(!!e.target.value.trim());
            setActive(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, matches.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Enter" && open && matches.length) {
              e.preventDefault();
              choose(matches[Math.max(active, 0)]);
            }
          }}
        />
      </div>
      {open && (
        <div className="search-results">
          <div
            id={`${id}-results`}
            role="listbox"
            aria-label="Matching local economies"
          >
            {matches.map((p, i) => (
              <div
                id={`${id}-result-${i}`}
                role="option"
                aria-selected={active === i}
                key={p.code}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p)}
                className={i === active ? "active" : ""}
              >
                <span>{p.name}</span>
                <span className="result-count">
                  {count(p.candidateOptions)} candidates{" "}
                  <Icon name="arrow" size={16} />
                </span>
              </div>
            ))}
          </div>
          {!matches.length && (
            <p role="status">
              No matching TTWA name. Try “Sheffield” or another local economy.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
export function MethodDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    else if (!open && ref.current?.open) ref.current.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="method-dialog"
      aria-labelledby="method-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <span className="eyebrow">A GUIDE TO THE EVIDENCE</span>
        <Button onClick={onClose} aria-label="Close model guide">
          <Icon name="close" />
        </Button>
      </div>
      <h2 id="method-title">How to read PIONEER</h2>
      <p>
        PIONEER identifies conditional industrial opportunities in England’s
        local labour markets. These are research scenarios, not forecasts or
        investment recommendations.
      </p>
      <h3>What the numbers mean</h3>
      <p>
        Direct employment is gross full-time-equivalent employment supported in
        the TTWA if its allocated export scenario is realised. It is not net new
        jobs. Associated supply-chain FTE is UK-wide and is not located in the
        selected place.
      </p>
      <h3>Three scenarios, two bounds</h3>
      <p>
        Existing trajectory uses reference export growth. Policy acceleration
        adds half the remaining ITC gap. Transformational uses the full
        unrealised opportunity. Where both routes exist,
        expansion/diversification shares are 80/20, 65/35 and 50/50
        respectively.
      </p>
      <p>
        The lower envelope uses the existing England employment-share benchmark;
        the upper treats the full cleanly mapped national opportunity as
        contestable. Bounds are not confidence intervals. Conversion retains the
        fixed US$1 = £0.74 model assumption.
      </p>
      <h3>Rank is not confidence</h3>
      <p>
        Canonical rank is lower policy-acceleration direct FTE. It does not
        change with the selected scenario. Relatedness and workforce percentiles
        compare places for the same industry. The four evidence ratings remain
        separate.
      </p>
      <h3>Geography and scope</h3>
      <p>
        The map retains the original 149 TTWA boundaries (2011). National need
        is the percentile of the share of residents in the most deprived 20% of
        English neighbourhoods, not an official TTWA IMD decile. Place totals
        cover each complete candidate portfolio; lists expose up to 20 published
        leading propositions per place. Neighbourhood detail uses the existing
        2021 LSOAs and IoD 2025 deciles, not an allocation of jobs to residents.
      </p>
      <h3>Products and markets</h3>
      <p>
        Products are linked national markets, not proof of local production. The
        displayed market names are the existing leading-market context, not a
        new aggregate ranking or a product-specific destination table.
      </p>
      <p className="source-note">
        Sources: existing PIONEER final place layer; ITC export potential; ONS
        employment, geography and 2023 input-output employment effects; IoD
        2025. Research release f77e59d. The original model and all thresholds
        are unchanged.
      </p>
      <Button className="button-primary" onClick={onClose}>
        Return to the atlas <Icon name="arrow" />
      </Button>
    </dialog>
  );
}

export function PlaceSearchDialog({
  places,
  onClose,
  onSelect,
}: {
  places: Place[];
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    ref.current?.querySelector("input")?.focus();
  }, []);
  return (
    <dialog
      className="method-dialog search-dialog"
      ref={ref}
      onClose={onClose}
      aria-labelledby="search-dialog-title"
    >
      <div className="dialog-heading">
        <h2 id="search-dialog-title">Find a local economy</h2>
        <Button aria-label="Close place search" onClick={onClose}>
          <Icon name="close" />
        </Button>
      </div>
      <Search places={places} onSelect={onSelect} />
      <p className="small-note">Search the 149 English Travel to Work Areas.</p>
    </dialog>
  );
}
