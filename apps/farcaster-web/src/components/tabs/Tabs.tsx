import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type TabsProps = {
  children: ReactNode;
  className?: string;
};

const Tabs: FC<TabsProps> = memo(({ children, className }) => {
  return (
    <div
      className={cn(
        'scrollbar-hide flex h-14 flex-row items-center overflow-x-auto border-b border-faint',
        className,
      )}
    >
      {children}
    </div>
  );
});

Tabs.displayName = 'Tabs';

export { Tabs };
