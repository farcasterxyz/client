import React from 'react';

const NOGGLES_RED_PIXELS = [
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

const NOGGLES_BLACK_PIXELS = [
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

const NOGGLES_WHITE_PIXELS = [
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

const NOGGLES_WRAPPER_STYLE: React.CSSProperties = {
  width: '18px',
  height: '18px',
};

const NOGGLES_VIEWBOX_X = 0;
const NOGGLES_VIEWBOX_Y = 5;
const NOGGLES_VIEWBOX_WIDTH = 16;
const NOGGLES_VIEWBOX_HEIGHT = 6;
const NOGGLES_ASPECT_RATIO = NOGGLES_VIEWBOX_WIDTH / NOGGLES_VIEWBOX_HEIGHT;
const NOGGLES_WIDTH_SCALE = 0.55;

const renderPixels = (
  pixels: readonly (readonly [number, number])[],
  fill: string,
) => {
  return pixels.map(([x, y]) => (
    <rect
      key={`${fill}-${x}-${y}`}
      x={x}
      y={y}
      width="1"
      height="1"
      fill={fill}
    />
  ));
};

const NogglesReactionArt = ({
  preserveColors,
}: {
  preserveColors: boolean;
}) => {
  return (
    <span
      className="inline-flex items-center justify-center self-center overflow-visible"
      style={NOGGLES_WRAPPER_STYLE}
    >
      <svg
        aria-hidden
        className="overflow-visible"
        width={16 * NOGGLES_ASPECT_RATIO * NOGGLES_WIDTH_SCALE}
        height="16"
        viewBox={`${NOGGLES_VIEWBOX_X} ${NOGGLES_VIEWBOX_Y} ${NOGGLES_VIEWBOX_WIDTH} ${NOGGLES_VIEWBOX_HEIGHT}`}
        fill="none"
        shapeRendering="crispEdges"
      >
        {preserveColors ? (
          <>
            {renderPixels(NOGGLES_RED_PIXELS, '#F3322C')}
            {renderPixels(NOGGLES_BLACK_PIXELS, '#000000')}
            {renderPixels(NOGGLES_WHITE_PIXELS, '#FFFFFF')}
          </>
        ) : (
          <>
            {renderPixels(NOGGLES_RED_PIXELS, 'currentColor')}
            {renderPixels(NOGGLES_BLACK_PIXELS, '#000000')}
            {renderPixels(NOGGLES_WHITE_PIXELS, '#FFFFFF')}
          </>
        )}
      </svg>
    </span>
  );
};

export { NogglesReactionArt };
