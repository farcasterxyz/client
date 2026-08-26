import cn from 'classnames';
import React from 'react';

type WellSize = 'sm' | 'md' | 'lg' | 'xl';

export interface WellProps extends Omit<
  React.HTMLProps<HTMLDivElement>,
  'size'
> {
  size?: WellSize;
}

export function Well({ size = 'md', className, children, ...rest }: WellProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-overlay-light border-default',
        paddingClass[size],
        roundedClass[size],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

const paddingClass: Record<WellSize, string> = {
  sm: 'px-2 py-3',
  md: 'px-[14px] py-[12.5px]',
  lg: 'px-5 py-8',
  xl: 'px-8 py-12',
};

const roundedClass: Record<WellSize, string> = {
  sm: 'rounded-xs',
  md: 'rounded-[12px]',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
};
