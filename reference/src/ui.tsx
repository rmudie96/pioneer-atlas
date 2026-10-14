import { useEffect, useId, useRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ordinal, rating, scenarioNames, SCENARIOS } from "./model";
import type { AreaSelection, Place, Scenario } from "./model";
import { Search } from "./GeoSearch";
export { Search } from "./GeoSearch";
import { scenarioDescriptions } from "./exploration";
import { horizonNote } from "./realisation";

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
  const id = useId();
  const picker = useRef<HTMLDetailsElement>(null);
  return (
    <div className="scenario-field">
      <span id={id}>Export scenario</span>
      <details ref={picker} className="scenario-picker" onKeyDown={e => {
        if (e.key === "Escape" && picker.current) {
          picker.current.open = false;
          picker.current.querySelector("summary")?.focus();
        }
      }}>
        <summary>{scenarioNames[value]}</summary>
        <div role="radiogroup" aria-labelledby={id}>
          {SCENARIOS.map(s => <label key={s}><input type="radio" name={id} checked={s === value} onChange={() => {
            onChange(s);
            if (picker.current) { picker.current.open = false; picker.current.querySelector("summary")?.focus(); }
          }} />{scenarioNames[s]}</label>)}
        </div>
      </details>
      <span className="scenario-year">by 2030</span>
      <p className="scenario-description">{scenarioDescriptions[value]}</p>
    </div>
  );
}
export function RagBadge({ value, label, nationalExport = false }: { value: string; label?: string; nationalExport?: boolean }) {
  const description = nationalExport ? rating(value).replace("Stronger", "Strong").replace("Weaker", "Weak") : rating(value);
  const colour = value.split("_")[0];
  const tone = ["green", "amber", "red"].includes(colour) ? colour : "grey";
  return (
    <span
      className={`rag-badge rag-${tone}`}
      title={`${label ? `${label}: ` : ""}${description} (${tone})`}
    >
      <i aria-hidden="true" />
      <span>
        {label && `${label}: `}
        {description}
      </span>
    </span>
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
        <RagBadge value={status} />
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
        local economies. These are research scenarios, not forecasts or
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
        The scenarios represent achieving one-third, two-thirds or all of the
        unrealised export potential covered by the model. Every place and industry
        keeps its original full-potential allocation; the smaller scenarios are
        exactly one-third and two-thirds of those export and employment figures.
        The full-potential allocation is split equally between expansion and
        diversification where both routes exist. Existing single-route exceptions
        are retained. The England figures cover the 89 industries (SIC) retained for this model,
        not every product in the ITC dataset.
      </p>
      <p>
        The lower envelope uses the existing England employment-share benchmark;
        the upper treats the full cleanly mapped national opportunity as
        contestable. Bounds are not confidence intervals. Conversion retains the
        fixed US$1 = £0.74 model assumption.
      </p>
      <h3>Order and evidence</h3>
      <p>
        Industries are ordered by employment or export opportunity in the selected
        scenario, using the lower estimate. Original research ranks remain in
        downloaded data for traceability; they are not confidence ratings. Relatedness and workforce percentiles
        compare places for the same industry. The four evidence ratings remain
        separate.
      </p>
      <h3>Geography and scope</h3>
      <p>
        The map retains the original 149 TTWA boundaries (2011). National need
        is the percentile of the share of residents in the most deprived 20% of
        English neighbourhoods, not an official TTWA IMD decile. Place totals
        cover each complete candidate portfolio. Lists show the original leading
        expansion propositions and all existing modelled diversification candidates.
        Ten further industries per place are presented separately for exploration:
        they have no local export or employment estimates and add nothing to totals.
        Neighbourhood detail uses the existing
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
        2025. Research release f77e59d. Original full-potential allocations and
        analytical thresholds are retained; smaller scenarios now use fixed
        realisation shares.
      </p>
      <p>{horizonNote}</p>
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
  onArea,
}: {
  places: Place[];
  onClose: () => void;
  onSelect: (code: string) => void;
  onArea: (area: AreaSelection) => void;
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
      <Search places={places} onSelect={onSelect} onArea={onArea} />
      <p className="small-note">
        Search by postcode, settlement, constituency, council or local-economy
        name.
      </p>
    </dialog>
  );
}
