import React from 'react';

type CircleProgressIndicatorProps = {
  progress: number;
  stroke: string;
  strokeAlternate: string;
};

const CircleProgressIndicator: React.FC<CircleProgressIndicatorProps> =
  React.memo(({ progress, stroke, strokeAlternate }) => {
    const center = 16;
    const strokeWidth = 4;
    const r = 16 - strokeWidth;
    const c = 2 * r * Math.PI;

    return (
      <svg
        width={24}
        height={24}
        viewBox="0 0 32 32"
        className="fill-none"
        strokeWidth={strokeWidth}
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke={strokeAlternate}
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (progress / 100) * c}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
      </svg>
    );
  });

CircleProgressIndicator.displayName = 'CircleProgressIndicator';

export { CircleProgressIndicator };
