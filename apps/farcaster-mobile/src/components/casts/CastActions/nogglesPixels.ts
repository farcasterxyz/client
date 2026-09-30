// Pixel grid for the Noggles reaction icon, split by color. Kept in a
// dependency-free module (no React/RN imports) so the pure path-building logic
// can be unit-tested without pulling in the component tree.

export const NOGGLES_RED_PIXELS = [
  [0, 7],
  [1, 7],
  [2, 7],
  [3, 7],
  [8, 7],
  [10, 7],
  [15, 7],
  [9, 7],
  [3, 10],
  [3, 6],
  [8, 6],
  [10, 6],
  [15, 6],
  [3, 9],
  [8, 9],
  [10, 9],
  [15, 9],
  [3, 5],
  [4, 5],
  [11, 5],
  [4, 10],
  [11, 10],
  [5, 5],
  [12, 5],
  [5, 10],
  [12, 10],
  [6, 5],
  [13, 5],
  [6, 10],
  [13, 10],
  [7, 5],
  [14, 5],
  [7, 10],
  [14, 10],
  [8, 5],
  [10, 5],
  [15, 5],
  [8, 10],
  [10, 10],
  [15, 10],
  [3, 8],
  [8, 8],
  [10, 8],
  [15, 8],
  [0, 8],
  [0, 9],
] as const;

export const NOGGLES_BLACK_PIXELS = [
  [7, 7],
  [6, 7],
  [7, 6],
  [6, 6],
  [7, 9],
  [6, 9],
  [7, 8],
  [6, 8],
  [14, 7],
  [13, 7],
  [14, 6],
  [13, 6],
  [14, 9],
  [13, 9],
  [14, 8],
  [13, 8],
] as const;

export const NOGGLES_WHITE_PIXELS = [
  [5, 7],
  [4, 7],
  [5, 6],
  [4, 6],
  [5, 9],
  [4, 9],
  [5, 8],
  [4, 8],
  [12, 7],
  [11, 7],
  [12, 6],
  [11, 6],
  [12, 9],
  [11, 9],
  [12, 8],
  [11, 8],
] as const;

// Collapse a pixel grid into a single path of non-overlapping unit-square
// subpaths. Each `M x y h1 v1 h-1 Z` draws exactly the same 1x1 area as the
// original `<Rect x y width=1 height=1>`, so the rendered output is identical
// while reducing the node count from one `<Rect>` per pixel to one `<Path>`
// per color. Derived programmatically from the coordinate arrays so the path
// data stays in sync with the pixel grid.
export const buildPixelPath = (
  pixels: ReadonlyArray<readonly [number, number]>,
): string => pixels.map(([x, y]) => `M${x} ${y}h1v1h-1Z`).join('');

export const NOGGLES_RED_PATH = buildPixelPath(NOGGLES_RED_PIXELS);
export const NOGGLES_BLACK_PATH = buildPixelPath(NOGGLES_BLACK_PIXELS);
export const NOGGLES_WHITE_PATH = buildPixelPath(NOGGLES_WHITE_PIXELS);
