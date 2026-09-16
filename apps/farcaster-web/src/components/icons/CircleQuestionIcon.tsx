import React, { FC } from 'react';

interface CircleQuestionIconProps {
  size?: number;
}

const CircleQuestionIcon: FC<CircleQuestionIconProps> = ({ size = 14 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block"
    >
      <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
      <path d="M7 6.5V10M7 4V4.5" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
};

CircleQuestionIcon.displayName = 'CircleQuestionIcon';

export { CircleQuestionIcon };
