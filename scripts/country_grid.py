"""Turn country borders into EuroSweeper grids for src/lib/countries.ts.

Rebuilt from the original mines_map_generator.py. Takes the largest polygon of each
country (the mainland, or more via PARTS), projects it to Web Mercator, rasterises it on a 50 km grid
(a cell is land if it touches the country), trims empty rows/columns and records
where the board sits on the shared Europe map.
The grid origin comes from the original eight countries, so new countries line
up with the existing ones.

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
from shapely.ops import transform, unary_union

# The first eight anchor the grid, so adding countries never shifts existing boards.
ANCHOR_COUNTRIES = ["Portugal", "Spain", "France", "Belgium", "Luxembourg",
                    "Germany", "Switzerland", "Italy"]
GAME_COUNTRIES = ANCHOR_COUNTRIES + ["Poland", "Netherlands", "Denmark", "Austria",
                                     "Czechia", "United Kingdom", "Ireland"]
# How many of a country's largest polygons to keep (default 1, the mainland).
PARTS = {
    "United Kingdom": 2,  # Great Britain + Northern Ireland
    "Denmark": 4,  # Jutland, Zealand, Funen, Lolland (no Bornholm)
}
CELL_SIZE = 50000  # 50 km cells

to_mercator = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True).transform


def mainland(geom, parts=1):
    if isinstance(geom, Polygon):
        return geom
    return unary_union(sorted(geom.geoms, key=lambda p: p.area, reverse=True)[:parts])


def load(path):
    with open(path) as f:
        features = json.load(f)["features"]
    geoms = {}
    for feat in features:
        name = feat["properties"]["NAME"]
        if name in GAME_COUNTRIES:
            geoms[name] = transform(to_mercator, mainland(shape(feat["geometry"]), PARTS.get(name, 1)))
    return geoms


def rasterise(geom, xs, ys):
    """Returns the trimmed grid and the [row, col] of its top-left cell in the full grid."""
    half = CELL_SIZE / 2
    arr = np.array([[1 if geom.intersects(box(x - half, y - half, x + half, y + half)) else 0
                     for x in xs] for y in ys])
    rows, cols = np.nonzero(arr)
    grid = arr[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
    return grid.tolist(), (int(rows.min()), int(cols.min()))


def grid_axes(geoms):
    """Cell centres covering every country, anchored to the original eight.

    Positions are counted from the anchor's top-left cell, so they stay stable as
    countries are added (countries further north or west get negative values).
    """
    anchor = [geoms[n].bounds for n in ANCHOR_COUNTRIES]
    ox, oy = min(b[0] for b in anchor), min(b[1] for b in anchor)
    top = oy + np.ceil((max(b[3] for b in anchor) - oy) / CELL_SIZE) * CELL_SIZE
    bounds = [g.bounds for g in geoms.values()]

    def axis(origin, lo, hi):
        first = np.floor((min(lo) - origin) / CELL_SIZE)
        return origin + np.arange(first, np.ceil((max(hi) - origin) / CELL_SIZE)) * CELL_SIZE

    xs = axis(ox, [b[0] for b in bounds], [b[2] for b in bounds])
    ys = axis(oy, [b[1] for b in bounds], [b[3] for b in bounds])[::-1]
    row0 = int(round((top - ys[0]) / CELL_SIZE))
    col0 = int(round((xs[0] - ox) / CELL_SIZE))
    return xs, ys, row0, col0


def main(path, names):
    geoms = load(path)
    xs, ys, row0, col0 = grid_axes(geoms)
    for name in names:
        grid, (r, c) = rasterise(geoms[name], xs, ys)
        rows = ", \n            ".join(json.dumps(r) for r in grid)
        print(f'  "{name.lower()}": {{')
        print(f'    name: "{name}",')
        print(f'    shape: [{rows}],')
        print(f'    position: [{r + row0}, {c + col0}],')
        print(f'    // {sum(map(sum, grid))} cells')
        print("  },")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:] or GAME_COUNTRIES)
