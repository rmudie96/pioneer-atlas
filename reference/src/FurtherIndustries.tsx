import type { Dataset, Route } from "./model";
import { employmentNote, horizonNote } from "./realisation";
import { industryName } from "./exploration";
import { EvidenceHeadings, EvidenceSignals } from "./EvidenceSignals";
import "./further-industries.css";

export function EstimateNote() {
  return <aside className="estimate-note"><p>{horizonNote}</p><p>{employmentNote}</p></aside>;
}

export function FurtherIndustries({ data, route }: { data: Dataset; route: Route }) {
  const all = (data.further ?? []).filter(o => o.ttwaCode === route.place);
  const rows = all.filter(o => !route.query || o.industry.toLowerCase().includes(route.query.toLowerCase()) || o.sic4.includes(route.query));
  if (!all.length) return null;
  return <section className="further-industries" aria-labelledby="further-industries-title">
    <span className="eyebrow">ADDITIONAL OPTIONS · NO LOCAL ESTIMATES</span>
    <h2 id="further-industries-title">Further industries to explore</h2>
    <p>These industries sit outside the quantified model. They offer starting points for investigating what this place could develop, including where new capabilities would need to be built.</p>
    <p className="further-boundary"><strong>Local export and employment estimates not modelled.</strong> These options add nothing to the scenario totals. National export potential is market context, not an allocation to this place.</p>
    <details className="exploration-method"><summary>How were these options chosen?</summary>
      <p>Ten additional manufacturing industries with no recorded local employment, a clean link to ITC products and evidence on relatedness and occupations. We prioritise the weaker of those two evidence measures, then the stronger, and include no more than two industries from the same two-digit industry division. This provides variety without changing any evidence rating.</p>
      <p>These are options to investigate, not ten validated investment recommendations. Low scores remain visible. Existing industry exclusions are retained; this first list also excludes coke, petroleum refining and nuclear-fuel processing. Local assessment of sites, energy, transport, finance and regulation is still needed.</p>
    </details>
    {rows.length === 0 && <p role="status">No further industries match this search.</p>}
    <EvidenceHeadings />
    <div className="further-list opportunity-list">{rows.map(o => <details className="further-option" key={o.sic4}>
      <summary className="opportunity-row"><span className="opportunity-body"><strong>{industryName(o.industry)}</strong><span className="opportunity-meta">SIC {o.sic4} · Local estimates not modelled</span></span><EvidenceSignals option={o} /><span className="further-open" aria-hidden="true" /></summary>
      <div className="further-evidence">
        <h3>Why it sits outside the quantified model</h3>
        <ul>
          {o.selectionReason.includes("relatedness_and_workforce_threshold_not_met") && <li>It does not meet the model’s combined relatedness and workforce threshold: one measure at or above the 70th percentile and the other at or above the 50th.</li>}
          {o.selectionReason.includes("national_transformational_export_opportunity_below_gbp250m") && <li>Its mapped national export potential is below the model’s £250m threshold.</li>}
        </ul>
        <h3>Existing industries with similar occupational requirements</h3><p>{o.adjacentIndustries || "No comparison available."}</p>
        <h3>Relevant local occupational strengths</h3><p>{o.occupationalStrengths || "No above-average occupational strengths identified in this comparison."}</p>
        <h3>Occupations less represented locally</h3><p>{o.occupationalGaps || "No occupational gaps listed in the source."}</p>
        <p className="small-note">Workforce evidence compares local occupations with a national industry profile, sometimes shared across several industries. It does not establish that workers are available to move jobs, fully qualified or able to reach a new workplace.</p>
        <h3>Linked products · national evidence</h3><ul>{o.products.map(p => <li key={p}>{p}</li>)}</ul>
        <p className="small-note">Product links do not establish existing local manufacture or local export values.</p>
      </div>
    </details>)}</div>
  </section>;
}
