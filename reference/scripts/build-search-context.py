"""Presentation-only geographic index. Never writes model inputs or research data.

ONS OA21 -> PCON July 2024 best-fit joined to the existing OA21 -> TTWA11
lookup. LA22 -> LA23 handles the 2023 council mergers. No nearest-name matches.
Run manually with Python; cached source downloads are outside the Git repository.
"""
import csv, json, hashlib, urllib.request, urllib.parse
from pathlib import Path
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

REPO = Path(__file__).resolve().parents[2]
WORK = REPO.parents[1]
OUT = REPO / 'reference/public/context'
OUT.mkdir(parents=True, exist_ok=True)
CACHE = WORK / 'Data/raw/geography/pioneer_search'
CACHE.mkdir(parents=True, exist_ok=True)
BASE = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/'
PCON = BASE + 'OA21_PCON25_LAD21_EW_LU/FeatureServer/0/query'
LAD = BASE + 'LAD22_LAD23_UK_LU_v1/FeatureServer/0/query'
COUNTY = BASE + 'LAD23_CTY23_EN_LU/FeatureServer/0/query'
def query(url, **params):
    with urllib.request.urlopen(url + '?' + urllib.parse.urlencode({'f':'json',**params}), timeout=90) as r:
        obj=json.load(r)
    if 'error' in obj: raise RuntimeError(obj['error'])
    return obj
def load_pcon():
    path=CACHE/'oa21_pcon24.json'
    if path.exists(): return json.loads(path.read_text())
    n=query(PCON,where='1=1',returnCountOnly='true')['count']
    def page(offset):
        return [f['attributes'] for f in query(PCON,where='1=1',outFields='OA21CD,PCON25CD,PCON25NM',returnGeometry='false',orderByFields='ObjectId',resultOffset=offset,resultRecordCount=1000)['features']]
    with ThreadPoolExecutor(max_workers=8) as pool:
        rows=[r for batch in pool.map(page,range(0,n,1000)) for r in batch]
    assert len(rows)==n and len({r['OA21CD'] for r in rows})==n
    path.write_text(json.dumps(rows),encoding='utf8')
    return rows
places=json.loads((REPO/'data/ttwa-summary.json').read_text())
codes={p['code'] for p in places}
ttwa_path=WORK/'Data/raw/geography/Output_Area_(2021)_to_TTWAs_(2011)_to_LAD_(2022)_Lookup_for_England_and_Wales.csv'
oa=list(csv.DictReader(ttwa_path.open(encoding='utf-8-sig')))
by_oa={r['OA21CD']:r['TTWA11CD'] for r in oa}
lad_rows=[f['attributes'] for f in query(LAD,where='1=1',outFields='*',returnGeometry='false')['features']]
(CACHE/'lad22_lad23.json').write_text(json.dumps(lad_rows),encoding='utf8')
lad={r['LAD22CD']:(r['LAD23CD'],r['LAD23NM']) for r in lad_rows}
groups=defaultdict(set)
names={}
for row in oa:
    code,name=lad[row['LAD22CD']]
    if not code.startswith('E'): continue
    key=('Local authority',code)
    groups[key].add(row['TTWA11CD']);names[key]=name
county_rows=[f['attributes'] for f in query(COUNTY,where='1=1',outFields='*',returnGeometry='false')['features']]
(CACHE/'lad23_cty23.json').write_text(json.dumps(county_rows),encoding='utf8')
for row in county_rows:
    # E10 counties have county councils; do not label metropolitan counties as councils.
    if not (row.get('CTY23CD') or '').startswith('E10'): continue
    key=('County council',row['CTY23CD'])
    groups[key].update(groups[('Local authority',row['LAD23CD'])]);names[key]=row['CTY23NM']
pcon=load_pcon()
assert all(r['OA21CD'] in by_oa for r in pcon)
for row in pcon:
    if not row['PCON25CD'].startswith('E'): continue
    key=('Constituency',row['PCON25CD'])
    groups[key].add(by_oa[row['OA21CD']]);names[key]=row['PCON25NM']
entries=[dict(code=c,name=names[(t,c)],type=t,ttwas=sorted(v & codes),outsideAtlas=sorted(v-codes)) for (t,c),v in groups.items()]
entries.sort(key=lambda x:(x['name'],x['type']))
assert sum(x['type']=='Constituency' for x in entries)==543
assert sum(x['type']=='Local authority' for x in entries)==296
need_path=WORK/'Data/processed/ttwa_neighbourhood_need_v1.csv'
need={r['ttwa_code']:r for r in csv.DictReader(need_path.open(encoding='utf-8-sig'))}
for p in places:
    assert abs(p['localDeprivationPercentile']-float(need[p['code']]['neighbourhood_need_percentile']))<0.051
shares={p['code']:100*float(need[p['code']]['share_population_in_imd_most_deprived_20_pct']) for p in places}
def dump(name,obj): (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':')),encoding='utf8')
dump('search-index.json',entries)
dump('neighbourhood-need.json',shares)
geo=json.loads((REPO/'ttwa-uk.geojson').read_text())
dump('ttwa-points.json',[dict(code=f['properties']['TTWA11CD'],geometry=f['geometry']) for f in geo['features'] if f['properties']['TTWA11CD'] in codes])
dump('provenance.json',dict(retrieved='2026-10-13',sources=[PCON,LAD,COUNTY],method='OA21 best-fit crosswalk. July 2024 constituencies; April 2023 local authorities. Every represented TTWA retained, including explicit outside-atlas codes. Named places use OS Open Names representative points tested against original TTWA polygons in British National Grid. Postcodes use Postcodes.io ONS TTWA codes.',needMethod='Existing IMD2025 neighbourhood population share, mid-2022 population. LSOAs crossing TTWAs allocated by constituent OA shares. Fraction multiplied by 100 for display only.',sourceHashes={str(p.relative_to(WORK)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ttwa_path,need_path,REPO/'ttwa-uk.geojson']},licence='Contains public sector information licensed under the Open Government Licence v3.0. Contains OS data © Crown copyright and database right 2026.'))
print(f'Prepared {len(entries)} search areas, {len(shares)} verified need shares; research files untouched.')

