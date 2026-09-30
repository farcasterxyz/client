import cn from 'classnames';
import { FC, memo } from 'react';

type NavLinkLabelProps = {
  children: string;
  bold?: boolean;
};
const NavLinkLabel: FC<NavLinkLabelProps> = memo(
  ({ children, bold = false }) => {
    return (
      <div
        className={cn(
          'ml-3 mr-0.5 hidden grow overflow-hidden text-ellipsis whitespace-nowrap xl:block',
          // Using bold in dark mode as semibold is not different enough from normal
          bold ? 'font-bold dark:font-extrabold' : 'font-normal',
        )}
      >
        {children}
      </div>
    );
  },
);

NavLinkLabel.displayName = 'NavLinkLabel';

export { NavLinkLabel };
