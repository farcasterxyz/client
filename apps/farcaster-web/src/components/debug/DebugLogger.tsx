import cn from 'classnames';
import { FC, memo } from 'react';

import { useDebug } from '~/contexts/DebugProvider';

type DebugLoggerProps = {
  data: unknown;
  name: string;
  position?: 'top-right' | 'top-left';
};

const DebugLogger: FC<DebugLoggerProps> = memo(
  ({ data, name, position = 'top-right' }) => {
    const { isEnabled } = useDebug();

    if (!isEnabled) {
      return null;
    }

    return (
      <div
        className={cn(
          'absolute z-50 cursor-pointer p-1 bg-action text-light',
          position === 'top-right' && 'right-0 top-0',
          position === 'top-left' && 'left-0 top-0',
        )}
        style={{ fontSize: 6 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          // eslint-disable-next-line no-console
          console.log(`Debug ${name}`, data);
          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        }}
      >
        Debug {name}
      </div>
    );
  },
);

DebugLogger.displayName = 'DebugLogger';

export { DebugLogger };
