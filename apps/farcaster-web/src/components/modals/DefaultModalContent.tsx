import cn from 'classnames';
import type React from 'react';

const DefaultModalContent = ({
  children,
  maximizeHeight = false,
  maxHeightPxTarget = '1000px',
  minHeightPx = 300,
}: {
  children: React.ReactNode;
  maximizeHeight?: boolean;
  maxHeightPxTarget?: '1000px' | '678px';
  minHeightPx?: number;
}) => {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div
        className={cn(
          'flex w-[420px] max-w-[420px] flex-col items-start justify-center rounded-xl border bg-app border-default',
        )}
        style={{
          minHeight: minHeightPx,
          maxHeight: `min(${maxHeightPxTarget}, 80vh)`,
          height: maximizeHeight
            ? `min(${maxHeightPxTarget}, 80vh)`
            : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};

export { DefaultModalContent };
