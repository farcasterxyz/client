// Positioning math for the Android "Copy" bubble rendered by
// `LongPressCopyText`. Extracted as pure functions so the clamping
// behavior can be unit-tested without spinning up the Android UI.

export const COPY_BUBBLE_WIDTH = 96;
export const COPY_BUBBLE_HEIGHT = 44;
export const COPY_BUBBLE_FINGER_GAP = 60;
export const COPY_BUBBLE_EDGE_MARGIN = 8;

/**
 * Horizontal position for the copy bubble, clamped so it never overhangs the
 * left/right screen edges.
 */
export const computeCopyBubbleLeft = ({
  pressX,
  windowWidth,
}: {
  pressX: number;
  windowWidth: number;
}): number =>
  Math.min(
    Math.max(pressX - COPY_BUBBLE_WIDTH / 2, COPY_BUBBLE_EDGE_MARGIN),
    Math.max(
      COPY_BUBBLE_EDGE_MARGIN,
      windowWidth - COPY_BUBBLE_WIDTH - COPY_BUBBLE_EDGE_MARGIN,
    ),
  );

/**
 * Vertical position for the copy bubble.
 *
 * The bubble renders inside a `statusBarTranslucent` Modal, so its coordinate
 * origin is the very top of the screen (behind the status bar / display
 * cutout). Clamping to `topInset + COPY_BUBBLE_EDGE_MARGIN` (rather than a flat
 * 8px) keeps a long-press near the top of the screen from tucking the bubble
 * under the status bar where it's hard to hit or partly hidden.
 */
export const computeCopyBubbleTop = ({
  pressY,
  topInset,
}: {
  pressY: number;
  topInset: number;
}): number =>
  Math.max(
    pressY - COPY_BUBBLE_FINGER_GAP - COPY_BUBBLE_HEIGHT,
    topInset + COPY_BUBBLE_EDGE_MARGIN,
  );
