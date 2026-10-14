"""Publish existing diversification evidence and a separately unquantified exploration list.

Never writes original research files or allocates any exports/jobs to exploration options.
Run from any directory with Python 3 (standard library only).
"""
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PUBLIC = Path(__file__).resolve().parents[1] / "public/context"
SOURCES = {
    "ranked": ROOT / "Data/processed/ttwa_industry_ranked_propositions_v1.csv",
    "audit": ROOT / "outputs/diagnostics/ttwa_industry_candidate_selection_audit_v1.csv",
    "workforce": ROOT / "Data/processed/ttwa_sic4_workforce_fit_v1.csv",
}
def read(path):
    with path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))
def number(r, name, digits=1):
    return round(float(r[name]), digits)
def items(text):
    return [s.strip() for s in text.split(";") if s.strip()][:6]
def evidence(r):
    return dict(ttwaCode=r["ttwa_code"], sic4=r["sic4_code"], industry=r["sic4_description"],
        currentJobs=number(r,"current_industry_jobs"), employmentRca=number(r,"employment_rca",2),
        relatedness=number(r,"industrial_relatedness_percentile_for_SIC_across_TTWAs"),
        workforce=number(r,"occupation_fit_percentile_for_SIC_across_TTWAs"),
        nationalOpportunity=number(r,"national_transformational_export_opportunity_gbp_million"),
        ratings=dict(comparativeAdvantage="red", relatedness=r["industrial_relatedness_rating"],
            workforce=r["workforce_compatibility_rating"], export=r["export_opportunity_rating"]),
        products=items(r["leading_itc_products"]), productFamilies=items(r["itc_product_families"]), markets=r["leading_export_markets"])

published = json.loads((ROOT / "web/pioneer-atlas/data/industry-options.json").read_text(encoding="utf-8"))
keys = {(o["ttwaCode"],o["sic4"]) for o in published}
ranked = read(SOURCES["ranked"])
extras = []
for r in ranked:
    if r["candidate_route"] != "diversification" or (r["ttwa_code"],r["sic4_code"]) in keys:
        continue
    o = evidence(r)
    reasons = []
    jobs = float(r["policy_acceleration_lower_direct_jobs"])
    if jobs >= 1000: reasons.append("very_large_direct_jobs_estimate")
    if jobs >= 500: reasons.append("large_diversification_scale")
    if r["allocation_concentration_flag"] != "no_concentration_flag": reasons.append(r["allocation_concentration_flag"])
    if r["industrial_relatedness_rating"] == "red": reasons.append("weaker_industrial_relatedness")
    if r["workforce_compatibility_rating"] == "red": reasons.append("weaker_workforce_compatibility")
    if r["sic4_code"] in {"2441","3212"}: reasons.append("precious_materials_trade_value_review")
    if r["sic4_code"] in {"3821","3822","3831","3832"}: reasons.append("waste_and_circular_economy_scope_review")
    if jobs < 25: reasons.append("small_direct_jobs_effect")
    o.update(rank=int(r["jobs_rank_within_ttwa"]),routeRank=int(r["jobs_rank_within_ttwa_and_route"]),
        route="diversification",jobsRating=r["jobs_scale_rating"],localUnits=number(r,"current_local_units"),
        allocationShare=round(float(r["policy_acceleration_allocation_share"])*100,1),
        reviewRequired=bool(reasons),reviewReasons=reasons or ["no_automatic_review_flag"],scenarios={})
    for s in ["existing_trajectory","policy_acceleration","transformational"]:
        o["scenarios"][s] = {k:{b:number(r,f"{s}_{b}_{col}",digits) for b in ["lower","upper"]}
            for k,col,digits in [("exports","exports_gbp_million",3),("directFte","direct_jobs",1),("supplyFte","uk_supply_chain_jobs",1)]}
    extras.append(o)

workforce = {(r["ttwa_code"],r["sic4_code"]):r for r in read(SOURCES["workforce"])}
pools = defaultdict(list)
for r in read(SOURCES["audit"]):
    # Restrict this first exploratory release to manufacturing, excluding coke,
    # petroleum refining, nuclear-fuel processing and the original precious-metal exclusion.
    if (r["sic_section"] == "C" and r["industrial_opportunity_type"] == "diversification"
        and r["passes_clean_itc_product_mapping"] == "True" and r["passes_industry_scope_rule"] == "True"
        and r["selected_for_candidate_shortlist"] != "True" and r["sic4_code"] not in {"1910","1920","2446"}):
        pools[r["ttwa_code"]].append(r)
further = []
for code, rows in sorted(pools.items()):
    # Rank by the weaker evidence dimension, then the stronger; no new public score.
    # Limit two per SIC2 division to avoid filling the list with near-identical industries.
    def ordering(r):
        a,b = float(r["industrial_relatedness_percentile_for_SIC_across_TTWAs"]),float(r["occupation_fit_percentile_for_SIC_across_TTWAs"])
        return (-min(a,b),-max(a,b),r["sic4_code"])
    divisions = Counter()
    chosen = 0
    for r in sorted(rows,key=ordering):
        division = r["sic4_code"][:2]
        if divisions[division] >= 2: continue
        o = evidence(r)
        w = workforce[(code,r["sic4_code"])]
        o.update(estimateStatus="not_modelled",selectionReason=r["candidate_selection_reason"],
            occupationalStrengths=w["strong_local_required_occupations"],occupationalGaps=w["largest_required_occupation_gaps"],
            adjacentIndustries=w["most_occupationally_similar_existing_local_industries"],
            requiredOccupations=w["top_10_required_occupations"],workforceResolution=w["workforce_profile_resolution"])
        further.append(o)
        divisions[division] += 1
        chosen += 1
        if chosen == 10: break
    assert chosen == 10, (code,chosen)

assert len(extras) == 1195
assert len(further) == 1490
assert all(o["sic4"] != "2441" for o in extras+further)
assert not any((o["ttwaCode"],o["sic4"]) in {(r["ttwa_code"],r["sic4_code"]) for r in ranked} for o in further)
payload = dict(version="exploration-2026-10-14",additionalDiversification=extras,further=further,
    provenance=dict(sourceHashes={k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in SOURCES.items()},
        method="Ten unquantified manufacturing options per TTWA. Outside the complete quantified shortlist; clean ITC mapping; existing scope rules retained; coke, petroleum refining and nuclear fuel excluded. Ordered by the lower of relatedness/workforce percentiles, then the higher, then SIC code; at most two per SIC2 division. Existing ratings are unchanged. No local estimates, no contribution to any total. These are investigation prompts, not validated investment recommendations. Sites, energy, transport, finance and regulatory feasibility require local assessment."))
PUBLIC.mkdir(parents=True,exist_ok=True)
path = PUBLIC / "exploration-extension.json"
path.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
print(f"Added {len(extras)} existing diversification candidates and {len(further)} unquantified exploration options: {path.stat().st_size:,} bytes")
