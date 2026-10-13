# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Adding a country

Country boards live in `src/lib/countries.ts`. To generate a new one from real borders:

```
pip install shapely pyproj numpy
curl -LO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson
python scripts/country_grid.py ne_50m_admin_0_countries.geojson Poland
```

Add the country to `GAME_COUNTRIES` in the script first so it shares the grid with the others. Paste the output into `countries.ts`, then set `mines` (roughly 20–25% of cells) and `adjacent` on both sides.
