// Flag colour for a board cell, so cleared tiles paint the country's flag.
// u and v run from 0 to 1 across and down the board; x and y are the same
// position in cells from the centre, for shapes that should stay square.

type Painter = (p: { u: number; v: number; x: number; y: number; size: number }) => string;

const stripes = (axis: 'u' | 'v', colors: string[]): Painter => p =>
  colors[Math.min(colors.length - 1, Math.floor(p[axis] * colors.length))];

const flags: Record<string, Painter> = {
  portugal: ({ u, v }) => {
    if (Math.abs(u - 0.4) < 0.12 && Math.abs(v - 0.5) < 0.1) return '#FFE900';
    return u < 0.4 ? '#046A38' : '#DA291C';
  },
  spain: ({ v }) => (v < 0.25 || v >= 0.75 ? '#AA151B' : '#F1BF00'),
  france: stripes('u', ['#002654', '#FFFFFF', '#ED2939']),
  belgium: stripes('u', ['#000000', '#FDDA24', '#EF3340']),
  luxembourg: stripes('v', ['#EF3340', '#FFFFFF', '#00A3E0']),
  germany: stripes('v', ['#000000', '#DD0000', '#FFCE00']),
  switzerland: ({ x, y, size }) => {
    const arm = size * 0.1, len = size * 0.32;
    const cross = (Math.abs(x) < arm && Math.abs(y) < len) || (Math.abs(y) < arm && Math.abs(x) < len);
    return cross ? '#FFFFFF' : '#DA291C';
  },
  italy: stripes('u', ['#009246', '#FFFFFF', '#CE2B37']),
  poland: stripes('v', ['#FFFFFF', '#DC143C']),
  netherlands: stripes('v', ['#AE1C28', '#FFFFFF', '#21468B']),
  denmark: ({ u, y, size }) => {
    const arm = Math.max(0.5, size * 0.07);
    return Math.abs(u - 0.37) * size * 1.3 < arm || Math.abs(y) < arm ? '#FFFFFF' : '#C8102E';
  },
  austria: stripes('v', ['#C8102E', '#FFFFFF', '#C8102E']),
  czechia: ({ u, v }) => {
    if (u < 0.5 * (1 - Math.abs(2 * v - 1))) return '#11457E';
    return v < 0.5 ? '#FFFFFF' : '#D7141A';
  },
  'united kingdom': ({ u, v }) => {
    const cross = Math.min(Math.abs(u - 0.5), Math.abs(v - 0.5));
    if (cross < 0.06) return '#C8102E';
    if (cross < 0.1) return '#FFFFFF';
    const diagonal = Math.min(Math.abs(u - v), Math.abs(u - (1 - v)));
    if (diagonal < 0.04) return '#C8102E';
    if (diagonal < 0.09) return '#FFFFFF';
    return '#012169';
  },
  ireland: stripes('u', ['#169B62', '#FFFFFF', '#FF883E']),
};

export function flagColor(countryKey: string, row: number, col: number, rows: number, cols: number) {
  const paint = flags[countryKey];
  if (!paint) return undefined;
  return paint({
    u: (col + 0.5) / cols,
    v: (row + 0.5) / rows,
    x: col + 0.5 - cols / 2,
    y: row + 0.5 - rows / 2,
    size: Math.min(rows, cols),
  });
}
