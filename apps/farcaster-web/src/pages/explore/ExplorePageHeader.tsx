import { usePrefetchDiscoverChannels } from 'farcaster-client-hooks';
import { FC, memo, useEffect } from 'react';

import { Link } from '~/components/links/Link';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { ExploreTab } from '~/types';

type ExplorePageHeaderProps = {
  focusedTab: ExploreTab;
};

const ExplorePageHeader: FC<ExplorePageHeaderProps> = memo(({ focusedTab }) => {
  const prefetchDiscoverChannels = usePrefetchDiscoverChannels();

  useEffect(() => {
    prefetchDiscoverChannels();
  }, [prefetchDiscoverChannels]);

  return (
    <Tabs>
      <Link
        title={`Users for you to follow`}
        to="users"
        params={{}}
        searchParams={{}}
        className="flex size-full items-center justify-center text-inherit"
      >
        <Tab isFocused={focusedTab === 'forYou'}>Users</Tab>
      </Link>
      <Link
        title={`Channels for you to follow`}
        to="channels"
        params={{}}
        searchParams={{}}
        className="flex size-full items-center justify-center text-inherit"
      >
        <Tab isFocused={focusedTab === 'channels'}>Channels</Tab>
      </Link>
      {focusedTab === 'apps' && (
        <Link
          title={`Explore Farcaster`}
          to="channels"
          params={{}}
          searchParams={{}}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'apps'}>Apps</Tab>
        </Link>
      )}
    </Tabs>
  );
});

ExplorePageHeader.displayName = 'ExplorePageHeader';

export { ExplorePageHeader };
