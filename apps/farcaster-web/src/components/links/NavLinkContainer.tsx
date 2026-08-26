import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

const selectedNavBackgroundClasses = 'bg-surface-secondary font-semibold';

type NavLinkContainerProps = {
  style?: 'default' | 'channel';
  isRelatedToCurrentRoute: boolean;
  children: ReactNode;
  isLoading: boolean;
};

const NavLinkContainer: FC<NavLinkContainerProps> = memo(
  ({ style, isRelatedToCurrentRoute, isLoading, children }) => {
    return (
      <div
        className={cn(
          'relative flex cursor-pointer flex-row items-center justify-center rounded-md pl-2 text-default xl:w-full xl:justify-start',
          style === 'channel' ? 'py-1.5 pr-1' : 'py-2 pr-2',
          isRelatedToCurrentRoute && selectedNavBackgroundClasses,
          !isRelatedToCurrentRoute && 'hover:bg-overlay-faint',
          isLoading && 'opacity-10',
        )}
      >
        {children}
      </div>
    );
  },
);
NavLinkContainer.displayName = 'NavLinkContainer';

export { NavLinkContainer };
