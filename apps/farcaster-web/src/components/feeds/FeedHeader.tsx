import { ApiDefaultFeedPreference } from 'farcaster-client-data';
import { FC, memo, useMemo } from 'react';

import { LinkToHomeFeed } from '~/components/links/LinkToHomeFeed';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useHomeLastSelectedTab } from '~/contexts/HomeLastSelectedTabProvider';
import { FeedTab } from '~/types';

export const FOLLOWING_CHANNEL_KEY = 'following';

type FeedHeaderProps = {
  defaultFeedTab: ApiDefaultFeedPreference;
  tab: FeedTab;
};

const FeedHeader: FC<FeedHeaderProps> = memo(({ defaultFeedTab, tab }) => {
  const { setFeedKey } = useHomeLastSelectedTab();

  const tabs = useMemo(() => {
    if (defaultFeedTab === 'following') {
      return [
        <LinkToHomeFeed
          key="following"
          title={'Following'}
          className="flex size-full items-center justify-center text-inherit"
          onClick={() => {
            setFeedKey({ feedKey: 'following' });
          }}
        >
          <Tab isFocused={tab === 'following'}>Following</Tab>
        </LinkToHomeFeed>,
        <LinkToHomeFeed
          key="home"
          title={'Home'}
          className="flex size-full items-center justify-center text-inherit"
          onClick={() => {
            setFeedKey({ feedKey: 'home' });
          }}
        >
          <Tab isFocused={tab === 'home'}>Home</Tab>
        </LinkToHomeFeed>,
      ];
    }

    return [
      <LinkToHomeFeed
        key="home"
        title={'Home'}
        className="flex size-full items-center justify-center text-inherit"
        onClick={() => {
          setFeedKey({ feedKey: 'home' });
        }}
      >
        <Tab isFocused={tab === 'home'}>Home</Tab>
      </LinkToHomeFeed>,
      <LinkToHomeFeed
        key="following"
        title={'Following'}
        className="flex size-full items-center justify-center text-inherit"
        onClick={() => {
          setFeedKey({ feedKey: 'following' });
        }}
      >
        <Tab isFocused={tab === 'following'}>Following</Tab>
      </LinkToHomeFeed>,
    ];
  }, [defaultFeedTab, setFeedKey, tab]);

  return <Tabs>{tabs.map((Tab) => Tab)}</Tabs>;
});

FeedHeader.displayName = 'FeedHeader';

export { FeedHeader };
