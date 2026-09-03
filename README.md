# The PIONEER Atlas prototype

This static prototype presents the final-model place layer through an interactive England TTWA map. It covers all 149 English TTWAs and the leading 2,643 expansion and diversification propositions selected for display.

The interface reports three export scenarios, ranges for direct TTWA jobs and UK supply-chain jobs, separate evidence ratings, and linked national product and market context. Current comparative advantage is based on employment RCA. Selecting a TTWA replaces the national map with its 2021 LSOAs, shaded by English Index of Multiple Deprivation 2025 decile. The prototype does not yet assign industry jobs to neighbourhood residents. GVA is not included.

Run `python -m http.server 8765` from this directory and open `http://127.0.0.1:8765/`.

Web data are rebuilt by running `python src/prepare_pioneer_atlas_web_data_v1.py` and `python src/prepare_pioneer_atlas_neighbourhood_maps_v1.py` from the project root. The source tables are `Data/processed/pioneer_atlas_ttwa_headline_v1.csv` and `Data/processed/pioneer_atlas_ttwa_industry_propositions_v1.csv`.

The TTWA geometry is the ONS Travel to Work Areas (December 2011) generalised clipped boundary dataset. The prototype has no data-download function and no server-side database.
