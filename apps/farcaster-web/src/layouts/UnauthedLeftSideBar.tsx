import { FC, memo } from 'react';

import { HomeIcon } from '~/components/icons/HomeIcon';
import { NavLink } from '~/components/links/NavLink';
import { NavLinkIcon } from '~/components/links/NavLinkIcon';
import { NavLinkLabel } from '~/components/links/NavLinkLabel';
import { useCurrentRouteFamily } from '~/hooks/navigation/useCurrentRouteFamily';
import { LeftSideBar } from '~/layouts/LeftSideBar';
import { LeftSideBarLogo } from '~/layouts/LeftSideBarLogo';

const UnauthedLeftSideBar: FC = memo(() => {
  const routeFamily = useCurrentRouteFamily();

  if (routeFamily === 'invites') {
    return null;
  }

  return (
    <LeftSideBar className="justify-between pb-4">
      <div className="flex flex-col space-y-1 lg:w-full">
        <LeftSideBarLogo title="Home feed" />
        <NavLink
          to="homeFeed"
          params={{}}
          searchParams={{}}
          title="Home"
          // Overriding background to transparent as this is the only tab
          className="!bg-transparent"
        >
          <NavLinkIcon>
            <div className="translate-y-[-1.75px]">
              <HomeIcon />
            </div>
          </NavLinkIcon>
          <NavLinkLabel>Home</NavLinkLabel>
        </NavLink>
      </div>
    </LeftSideBar>
  );
});

UnauthedLeftSideBar.displayName = 'UnauthedLeftSideBar';

export { UnauthedLeftSideBar };
