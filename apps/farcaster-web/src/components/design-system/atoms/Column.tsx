import React, { memo } from 'react';

import { cn } from '~/lib/utils';

export type ColumnProps = {
  className?: string;
  children: React.ReactNode;
};

export const Column = memo(({ children, className }: ColumnProps) => {
  return <div className={cn('flex flex-col', className)}>{children}</div>;
});

Column.displayName = 'Column';
