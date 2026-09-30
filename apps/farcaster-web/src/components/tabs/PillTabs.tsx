import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type PillTabsProps = {
  children: ReactNode;
  className?: string;
};

const PillTabs: FC<PillTabsProps> = memo(({ children, className }) => {
  return (
    <div
      className={cn(
        'lg:gap[10px] flex h-14 flex-row items-center gap-[8px] border-b pl-4 border-faint',
        className,
      )}
    >
      {children}
    </div>
  );
});

PillTabs.displayName = 'PillTabs';

export { PillTabs };
