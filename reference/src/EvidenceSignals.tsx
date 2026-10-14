import type { Option } from "./model";
import { money, ordinal, rating } from "./model";

const labels = [
  "Existing strength · RCA",
  "Industrial relatedness",
  "Workforce readiness",
  "National export potential",
];
function SignalIcon({ index }: { index: number }) {
  const paths = [
    <>
      <path d="M3 21V10l6 3V9l6 4V3h4l2 18H3Z" />
      <path d="M7 17h1m4 0h1m4 0h1" />
    </>,
    <>
      <circle cx="5" cy="12" r="3" />
      <circle cx="18" cy="5" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8 11 7-4M8 13l7 4" />
    </>,
    <>
      <circle cx="12" cy="6" r="3" />
      <path d="M6 22v-6a6 6 0 0 1 12 0v6M3 12l-2 6m22-6 2 6" />
    </>,
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18M5 7h14M5 17h14" />
    </>,
  ];
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[index]}
    </svg>
  );
}
export function EvidenceKey() {
  return (
    <aside className="evidence-key" aria-label="Evidence rating key">
      <div className="evidence-key-top">
        <strong>What does this area have that can help it expand, or develop, industry?</strong>
        <span>
          <i className="key-green" />
          Stronger <i className="key-amber" />
          Moderate <i className="key-red" />
          Weaker <i className="key-grey" />
          Unavailable
        </span>
      </div>
      <div className="signal-definitions">
        <p>
          <SignalIcon index={0} />
          <span>
            <b>Existing strength (RCA)</b>Is the industry already a local
            specialism?
          </span>
        </p>
        <p>
          <SignalIcon index={1} />
          <span>
            <b>Industrial relatedness</b>Does the wider industrial base support
            this opportunity?
          </span>
        </p>
        <p>
          <SignalIcon index={2} />
          <span>
            <b>Workforce readiness</b>Do local workers have the right skills to help this industry grow?
          </span>
        </p>
        <p>
          <SignalIcon index={3} />
          <span>
            <b>Export potential</b>How large is the linked national export
            opportunity?
          </span>
        </p>
      </div>
      <details>
        <summary>Definitions</summary>
        <p>
          Existing strength: green means an employment share at least as high as
          nationally (RCA ≥1); amber means employment is present but below that
          share; red means no recorded employment. An RCA of 2 means twice the
          national employment share.
        </p>
        <p>
          Relatedness and workforce readiness: green ≥75th percentile, amber
          ≥50th and below 75th, red below 50th, comparing local economies for the
          same industry. Workforce readiness is the existing occupational-fit
          measure: it does not establish that people are available, fully
          qualified or able to reach these jobs.
        </p>
        <p>
          National export ratings read Strong, Moderate or Weak. Export colours use the same 75th/50th percentile cut-offs, comparing
          the national opportunities across industries; the value is the
          full-potential national industry amount, not the local allocation.
          These are separate signals, not a combined score, a probability of
          success or an eligibility test. They stay fixed across scenarios.
        </p>
      </details>
    </aside>
  );
}
export function EvidenceSignals({
  option,
  headings = false,
}: {
  option: Pick<Option, "employmentRca" | "relatedness" | "workforce" | "nationalOpportunity" | "ratings">;
  headings?: boolean;
}) {
  const values = [
    `${option.employmentRca.toFixed(2)}×`,
    `${ordinal(option.relatedness)}`,
    `${ordinal(option.workforce)}`,
    money(option.nationalOpportunity),
  ];
  const ratings = [
    option.ratings.comparativeAdvantage,
    option.ratings.relatedness,
    option.ratings.workforce,
    option.ratings.export,
  ];
  return (
    <span
      className={`evidence-signals ${headings ? "with-headings" : ""}`}
      role="group"
      aria-label="Industry evidence signals"
    >
      {ratings.map((r, i) => {
        const tone = ["green", "amber", "red"].includes(r) ? r : "grey";
        const description = i === 3 ? rating(r).replace("Stronger", "Strong").replace("Weaker", "Weak") : rating(r);
        return (
          <span
            className={`evidence-signal signal-${tone}`}
            key={labels[i]}
            title={`${labels[i]}: ${description}. ${values[i]}${i === 1 || i === 2 ? " percentile" : ""}`}
          >
            <span className="signal-label">{labels[i]}</span>
            <SignalIcon index={i} />
            <strong>{values[i]}</strong>
            <small>{description}</small>
          </span>
        );
      })}
    </span>
  );
}
export function EvidenceHeadings() {
  return (
    <div className="opportunity-grid-heading" aria-hidden="true">
      <span className="industry-column-title">Industry <small>(Click to see product and global export market options)</small></span>
      <div>
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
