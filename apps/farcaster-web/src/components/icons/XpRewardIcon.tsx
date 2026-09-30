import React from 'react';

export function XpRewardIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg height={size} width={size} viewBox="0 0 24 25" fill={color}>
      <path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
        fill={color}
        stroke={color}
      />

      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" stroke="white" />
      <path d="M12 18V6" stroke="white" />
    </svg>
  );
}
