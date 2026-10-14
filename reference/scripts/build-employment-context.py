"""Copy official all-industry BRES totals for a display-only employment ratio.

Never edits the research release or re-estimates any scenario.
"""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
PUBLIC = Path(__file__).resolve().parents[1] / 'public'
codes = {p['code'] for p in json.loads((PUBLIC / 'data/ttwa-summary.json').read_text(encoding='utf8'))}
totals, sources = {}, []
for source in sorted((ROOT / 'outputs/local_export_base_v1/inputs').glob('bres_ttwa_divisions_counts_2024_*.csv')):
    sources.append({'file': str(source.relative_to(ROOT)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})
    for row in csv.DictReader(source.open(encoding='utf-8-sig', newline='')):
        if row['INDUSTRY_NAME'] != 'Total' or row['GEOGRAPHY_CODE'] not in codes:
            continue
        assert row['DATE_NAME'] == '2024' and row['EMPLOYMENT_STATUS_NAME'] == 'Employment' and row['MEASURE_NAME'] == 'Count'
        code, value = row['GEOGRAPHY_CODE'], float(row['OBS_VALUE'])
        assert value > 0 and code not in totals
        totals[code] = value
assert set(totals) == codes
result = {'year': 2024, 'source': 'ONS Business Register and Employment Survey, Nomis NM_189_1',
          'url': 'https://www.nomisweb.co.uk/datasets/newbres6pub', 'downloaded': '2026-10-12',
          'measure': 'Workplace employment count, all industries; not full-time equivalents. Excludes farm agriculture (SIC subclass 01000). BRES coverage and rounding apply.',
          'formula': '100 * selected scenario lower-bound gross direct FTE / BRES total workplace employment',
          'interpretation': 'Supported FTE per 100 existing jobs. A relative scale comparison, not a forecast percentage increase in employment or resident employment rate.',
          'sources': sources, 'totals': dict(sorted(totals.items()))}
(PUBLIC / 'context/employment-base.json').write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf8')
print(f'Copied {len(totals)} official employment totals; research files untouched.')
