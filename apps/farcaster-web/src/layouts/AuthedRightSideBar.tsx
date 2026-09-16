import { FC, memo, Suspense, useMemo } from 'react';

import {
  MinimizableWindowHost,
  MinimizableWindowHostVariant,
} from '~/components/MinimizableWindowHost';
import { ClankerSpotlight } from '~/components/news/ClankerSpotlight';
import { LiveNowSpaces } from '~/components/rightSidebar/LiveNowSpaces';
import { MiniApps } from '~/components/rightSidebar/MiniApps';
import { TrendingTopics } from '~/components/rightSidebar/TrendingTopics';
import { Search } from '~/components/search/Search';
import { useCurrentRoute } from '~/hooks/navigation/useCurrentRoute';
import { RightSideBar } from '~/layouts/RightSideBar';
import { SupportAndTermsLinks } from '~/layouts/SupportAndTermsLinks';
import { cn } from '~/lib/utils';

const AuthedRightSideBar: FC = memo(() => {
  const currentRoute = useCurrentRoute();
  const routeFamily = currentRoute?.routeDefinition.family;
  const routeName = currentRoute?.routeName;

  const onDevelopersPage = routeName?.startsWith('developers');

  const shouldHideRightSidebar =
    routeFamily === 'settings' ||
    routeFamily === 'invites' ||
    routeFamily === 'directCasts' ||
    onDevelopersPage;

  const items = useMemo(() => {
    if (shouldHideRightSidebar) {
      return null;
    }
    return (
      <>
        <RightSideBar as="div">
          {routeFamily === 'search' ? <></> : <Search showClearIcon={false} />}
          {routeFamily !== 'profile' && routeFamily !== 'news' && (
            <Suspense>
              <ClankerSpotlight />
            </Suspense>
          )}
          <MiniApps />
          {routeName === 'homeFeed' && <LiveNowSpaces />}
          <TrendingTopics />
          <SupportAndTermsLinks />
        </RightSideBar>
      </>
    );
  }, [routeFamily, routeName, shouldHideRightSidebar]);

  let variant: MinimizableWindowHostVariant = 'sidebar';
  if (onDevelopersPage || routeFamily === 'settings') {
    variant = 'screen-right';
  } else if (routeFamily === 'directCasts') {
    variant = 'direct-casts';
  }

  return (
    <aside
      className={cn([
        'max-w-[393px] grow',
        { ['max-w-0']: variant === 'screen-right' },
      ])}
    >
      {items}
      <div
        className={cn([
          { hidden: variant === 'sidebar' && shouldHideRightSidebar },
        ])}
      >
        <MinimizableWindowHost variant={variant} />
      </div>
    </aside>
  );
});

export { AuthedRightSideBar };
