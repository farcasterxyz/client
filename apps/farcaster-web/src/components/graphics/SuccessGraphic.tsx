import React from 'react';

export function SuccessGraphic({ size = 100 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 100 100"
    >
      <circle cx="50" cy="50" r="50" fill="#14BE44" fillOpacity="0.1"></circle>
      <path
        fill="#14BE44"
        fillRule="evenodd"
        d="M50 70.8a20.8 20.8 0 100-41.6 20.8 20.8 0 000 41.6zm10.028-25.503a1.95 1.95 0 00-3.156-2.294l-9.056 12.454-4.888-4.888a1.95 1.95 0 10-2.756 2.759l6.5 6.5a1.948 1.948 0 002.956-.232l10.4-14.3z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
