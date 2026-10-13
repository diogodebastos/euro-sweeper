"""Turn country borders into EuroSweeper grids for src/lib/countries.ts.

Rebuilt from the original mines_map_generator.py. Takes the largest polygon of each
country (the mainland), projects it to Web Mercator, rasterises it on a 50 km grid
(a cell is land if it touches the country) and trims empty rows/columns.
The grid origin comes from the bounds of every country in the game, so new
countries line up with the existing ones.

Borders: Natural Earth 1:50m admin-0 countries GeoJSON
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_admin_0_countries.geojson

Usage:
  pip install shapely pyproj numpy
  python scripts/country_grid.py ne_50m_admin_0_countries.geojson Poland
"""
import json
import sys

import numpy as np
from pyproj import Transformer
from shapely.geometry import Polygon, box, shape
from shapely.ops import transform

GAME_COUNTRIES = ["Portugal", "Spain", "France", "Belgium", "Luxembourg",
                  "Germany", "Switzerland", "Italy", "Poland"]
CELL_SIZE = 50000  # 50 km cells

to_mercator = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform


def mainland(geom):
    if isinstance(geom, Polygon):
        return geom
    return max(geom.geoms, key=lambda p: p.area)


def load(path):
    with open(path) as f:
        features = json.load(f)["features"]
    geoms = {}
    for feat in features:
        name = feat["properties"]["NAME"]
        if name in GAME_COUNTRIES:
            geoms[name] = transform(to_mercator, mainland(shape(feat["geometry"])))
    return geoms


def rasterise(geom, xs, ys):
    half = CELL_SIZE / 2
    arr = np.array([[1 if geom.intersects(box(x - half, y - half, x + half, y + half)) else 0
                     for x in xs] for y in ys])
    arr = arr[~np.all(arr == 0, axis=1)]
    arr = arr[:, ~np.all(arr == 0, axis=0)]
    return arr.tolist()


def main(path, names):
    geoms = load(path)
    bounds = [g.bounds for g in geoms.values()]
    xs = np.arange(min(b[0] for b in bounds), max(b[2] for b in bounds), CELL_SIZE)
    ys = np.arange(min(b[1] for b in bounds), max(b[3] for b in bounds), CELL_SIZE)[::-1]
    for name in names:
        grid = rasterise(geoms[name], xs, ys)
        rows = ", \n            ".join(json.dumps(r) for r in grid)
        print(f'  "{name.lower()}": {{')
        print(f'    name: "{name}",')
        print(f'    shape: [{rows}],')
        print(f'    // {sum(map(sum, grid))} cells')
        print("  },")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:] or GAME_COUNTRIES)
