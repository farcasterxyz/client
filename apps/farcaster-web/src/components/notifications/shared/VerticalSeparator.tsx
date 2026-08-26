import React, { FC, memo } from 'react';

const VerticalSeparator: FC = memo(() => {
  return <div className="mx-1 h-6 w-px border-l border-default"></div>;
});

VerticalSeparator.displayName = 'VerticalSeparator';

export { VerticalSeparator };
