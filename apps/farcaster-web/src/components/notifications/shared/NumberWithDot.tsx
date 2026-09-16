import cn from 'classnames';
import { formatShorthandNumber } from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

interface NumberWithDotProps {
  num: number;
  color: 'green' | 'red' | 'gray';
}

const NumberWithDot: FC<NumberWithDotProps> = memo(({ num, color }) => {
  let colorStyles: string[] = [];
  switch (color) {
    case 'green':
      colorStyles = ['border-green-500/30', 'bg-green-500'];
      break;
    case 'red':
      colorStyles = ['border-red-500/30', 'bg-red-500'];
      break;
    case 'gray':
      colorStyles = ['border-gray-500/30', 'bg-gray-500'];
      break;
    default:
      throw new Error(`Unknown color ${color}`);
  }

  return (
    <>
      <div
        className={cn([
          'h-[12px]',
          'w-[12px]',
          'rounded-full',
          'border-2',
          'bg-clip-padding',
          ...colorStyles,
        ])}
      />
      <span className="text-md text-muted">{formatShorthandNumber(num)}</span>
    </>
  );
});

NumberWithDot.displayName = 'NumberWithDot';

export { NumberWithDot };
