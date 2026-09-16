import { FC, memo, ReactNode } from 'react';

type NavLinkIconProps = {
  children: ReactNode;
};
const NavLinkIcon: FC<NavLinkIconProps> = memo(({ children }) => {
  return <div className="flex shrink-0 leading-4">{children}</div>;
});

NavLinkIcon.displayName = 'NavLinkIcon';

export { NavLinkIcon };
