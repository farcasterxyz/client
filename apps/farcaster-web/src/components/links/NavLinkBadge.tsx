import cn from 'classnames';
import { FC, memo } from 'react';

type NavLinkBadgeProps = {
  className?: string;
  count: number;
  subtle: boolean;
};

const NavLinkBadge: FC<NavLinkBadgeProps> = memo(
  ({ className, count, subtle }) => {
    if (count === 0) {
      return <></>;
    }

    return (
      <div
        className={cn(
          ' shadow-xs absolute flex items-center justify-center rounded-full',
          'xl:right-0 xl:top-auto xl:ml-0 xl:mr-2 xl:min-h-[14px] xl:w-auto xl:min-w-[14px] xl:px-[0.175rem] xl:py-[.025rem]',
          !subtle && 'top-1.5 ml-3 h-2 w-2',
          subtle ? 'bg-overlay-medium' : 'bg-action-danger',
          className,
        )}
      >
        <span
          className={cn(
            'hidden text-[9px] font-normal xl:flex',
            subtle ? 'text-default' : 'text-white',
          )}
        >
          {count}
        </span>
      </div>
    );
  },
);

NavLinkBadge.displayName = 'NavLinkBadge';

export { NavLinkBadge };
