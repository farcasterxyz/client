import React, { memo } from 'react';

import { cn } from '~/lib/utils';

export type RowProps = {
  className?: string;
  children: React.ReactNode;
};

export const Row = memo(({ children, className }: RowProps) => {
  return <div className={cn('flex flex-row', className)}>{children}</div>;
});

Row.displayName = 'Row';
