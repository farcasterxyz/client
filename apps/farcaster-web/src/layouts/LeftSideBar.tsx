import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

type LeftSideBarProps = {
  children: ReactNode;
  className?: string;
};
const LeftSideBar: FC<LeftSideBarProps> = memo(({ className, children }) => {
  return (
    <aside className="sticky top-0 hidden h-screen shrink-0 sm:block xl:w-[220px]">
      <div
        className={cn(
          className,
          'mx-2 flex min-h-screen flex-col items-end xl:items-start',
        )}
      >
        {children}
      </div>
    </aside>
  );
});

LeftSideBar.displayName = 'LeftSideBar';

export { LeftSideBar };
