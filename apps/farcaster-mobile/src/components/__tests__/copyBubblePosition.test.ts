import {
  computeCopyBubbleLeft,
  computeCopyBubbleTop,
  COPY_BUBBLE_EDGE_MARGIN,
  COPY_BUBBLE_FINGER_GAP,
  COPY_BUBBLE_HEIGHT,
  COPY_BUBBLE_WIDTH,
} from '../copyBubblePosition';

describe('computeCopyBubbleTop', () => {
  const topInset = 48; // typical Android status bar / cutout height

  it('sits a finger-gap above the press when there is room', () => {
    const pressY = 500;

    expect(computeCopyBubbleTop({ pressY, topInset })).toBe(
      pressY - COPY_BUBBLE_FINGER_GAP - COPY_BUBBLE_HEIGHT,
    );
  });

  it('clamps below the status bar / cutout when the press is near the top', () => {
    // After a scroll leaves the long-press near the top of the screen, the raw
    // position would land above (or under) the status bar. The regression this
    // guards: clamping to a flat 8px used to tuck the bubble under the status
    // bar; it must now clamp to the top safe-area inset instead.
    const pressY = 20;

    expect(computeCopyBubbleTop({ pressY, topInset })).toBe(
      topInset + COPY_BUBBLE_EDGE_MARGIN,
    );
  });

  it('never places the bubble under the status bar / cutout', () => {
    for (let pressY = 0; pressY <= 200; pressY += 5) {
      expect(computeCopyBubbleTop({ pressY, topInset })).toBeGreaterThanOrEqual(
        topInset + COPY_BUBBLE_EDGE_MARGIN,
      );
    }
  });

  it('falls back to the edge margin when there is no top inset', () => {
    expect(computeCopyBubbleTop({ pressY: 0, topInset: 0 })).toBe(
      COPY_BUBBLE_EDGE_MARGIN,
    );
  });
});

describe('computeCopyBubbleLeft', () => {
  const windowWidth = 400;

  it('centers the bubble on the press when it fits', () => {
    const pressX = 200;

    expect(computeCopyBubbleLeft({ pressX, windowWidth })).toBe(
      pressX - COPY_BUBBLE_WIDTH / 2,
    );
  });

  it('clamps to the left edge margin', () => {
    expect(computeCopyBubbleLeft({ pressX: 0, windowWidth })).toBe(
      COPY_BUBBLE_EDGE_MARGIN,
    );
  });

  it('clamps to the right edge margin', () => {
    expect(computeCopyBubbleLeft({ pressX: windowWidth, windowWidth })).toBe(
      windowWidth - COPY_BUBBLE_WIDTH - COPY_BUBBLE_EDGE_MARGIN,
    );
  });
});
