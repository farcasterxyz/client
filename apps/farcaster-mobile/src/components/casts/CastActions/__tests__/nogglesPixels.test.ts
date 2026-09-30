import {
  buildPixelPath,
  NOGGLES_BLACK_PIXELS,
  NOGGLES_RED_PIXELS,
  NOGGLES_WHITE_PIXELS,
} from '../nogglesPixels';

describe('buildPixelPath', () => {
  it('emits one unit-square subpath per pixel, identical to a 1x1 <Rect>', () => {
    // `M x y h1 v1 h-1 Z` traces (x,y)→(x+1,y)→(x+1,y+1)→(x,y+1)→close, i.e. the
    // exact area of `<Rect x y width=1 height=1>`. Pinning the format guards the
    // PR's byte-for-byte-identical claim against an accidental helper refactor.
    expect(buildPixelPath([[3, 5]])).toBe('M3 5h1v1h-1Z');
    expect(
      buildPixelPath([
        [3, 5],
        [10, 0],
      ]),
    ).toBe('M3 5h1v1h-1ZM10 0h1v1h-1Z');
  });

  it('returns an empty path for no pixels', () => {
    expect(buildPixelPath([])).toBe('');
  });
});

describe('Noggles pixel grid', () => {
  it('has no overlapping pixels across the red/black/white paths', () => {
    // The rect→path collapse only renders identically to the original per-pixel
    // <Rect>s if no two subpaths overlap: overlapping subpaths would make
    // nonzero vs evenodd fill-rule diverge, and cross-color overlap would change
    // which color wins. This invariant is the silent-failure risk if anyone
    // edits the coordinate arrays, so assert it directly.
    const allPixels = [
      ...NOGGLES_RED_PIXELS,
      ...NOGGLES_BLACK_PIXELS,
      ...NOGGLES_WHITE_PIXELS,
    ];
    const uniqueKeys = new Set(allPixels.map(([x, y]) => `${x},${y}`));

    expect(uniqueKeys.size).toBe(allPixels.length);
  });
});
