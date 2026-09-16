import cn from 'classnames';
import { sleep } from 'farcaster-client-hooks';
import { memo, MouseEventHandler, ReactNode, useState } from 'react';

import { Link } from '~/components/links/Link';
import { NavLinkContainer } from '~/components/links/NavLinkContainer';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { routes } from '~/constants/routes';
import { useOnCurrentNavLinkClicked } from '~/contexts/OnCurrentNavLinkClickedProvider';
import { useIsCurrentRoute } from '~/hooks/navigation/useIsCurrentRoute';
import { useIsRelatedToCurrentRoute } from '~/hooks/navigation/useIsRelatedToRoute';
import { useScrollToTopOfRoot } from '~/hooks/useScrollToTopOfRoot';
import { RouteName, Routes } from '~/types';

interface NavLinkProps<Name extends RouteName> {
  children?: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  params: Routes[Name]['params'];
  searchParams: Routes[Name]['search'];
  title: string;
  to: Name;
  onMouseOver?: MouseEventHandler<HTMLAnchorElement>;
  style?: 'default' | 'channel';
  newTab?: boolean;
}

const NavLink = <Name extends RouteName>({
  children,
  className,
  onClick,
  params,
  searchParams,
  title,
  to,
  onMouseOver,
  style = 'default',
  newTab,
}: NavLinkProps<Name>) => {
  const route = routes[to];
  const isCurrentRoute = useIsCurrentRoute({ path: route.path });
  const isRelatedToCurrentRoute = useIsRelatedToCurrentRoute({
    path: route.path,
    params,
    family: route.family,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { onCurrentNavLinkClicked } = useOnCurrentNavLinkClicked();

  const scrollToTopOfRoot = useScrollToTopOfRoot();

  return (
    <Link
      to={to}
      params={params}
      searchParams={searchParams}
      title={title}
      onClick={async (e) => {
        if (onClick) {
          onClick(e);
          return;
        }

        // Why check `isRelatedToCurrentRoute`?
        // This guarantees that when clicked navigation link is already active.
        // Otherwise: when user visits a profile, any future profile nav clicks
        // will just reload instead of navigating to current user's profile.
        if (
          isCurrentRoute &&
          isRelatedToCurrentRoute &&
          onCurrentNavLinkClicked
        ) {
          try {
            setIsLoading(true);

            // Add brief artificial delay to ensure UI updates to show loading spinner.
            // Without this, we occasionally see a minor stutter in the UI if there is a lot of content on the feed.
            await sleep(50);

            await Promise.all([
              onCurrentNavLinkClicked().then(async () => {
                // We chain the scroll behavior to the `onCurrentNavClicked` promise,
                // rather than the `Promise.all` which includes the artificial delay,
                // because we want to start scrolling as soon as new content is rendered.
                scrollToTopOfRoot(true);
              }),
              sleep(500), // Ensure that we show the loading indicator for a minimum amount of time, so the UX doesn't appear janky in the event that the API request is very fast.
            ]);
          } finally {
            setIsLoading(false);
          }
        }
      }}
      className={cn('relative', className)}
      onMouseOver={onMouseOver}
      newTab={newTab}
    >
      {isLoading && (
        <div className="absolute inset-0 mt-0.5 flex flex-row items-center justify-center px-2">
          <LoadingIndicator size="sm" />
        </div>
      )}
      <NavLinkContainer
        style={style}
        isRelatedToCurrentRoute={isRelatedToCurrentRoute}
        isLoading={isLoading}
      >
        {children}
      </NavLinkContainer>
    </Link>
  );
};

NavLink.displayName = 'NavLink';

const MemoizedNavLink = memo(NavLink);

export { MemoizedNavLink as NavLink };
