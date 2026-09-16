import * as React from 'react';

export const PersonXIcon = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 20 20"
  >
    <path
      className="stroke-current"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M1.667 17.5a6.666 6.666 0 0 1 9.894-5.833"
    />
    <path
      className="stroke-current"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8.333 10.833a4.167 4.167 0 1 0 0-8.333 4.167 4.167 0 0 0 0 8.333ZM14.167 14.167l4.166 4.166M18.333 14.167l-4.166 4.166"
    />
  </svg>
);
