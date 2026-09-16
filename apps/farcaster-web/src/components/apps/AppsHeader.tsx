import { AnalyticsEvent } from 'farcaster-analytics';
import React, { FC, memo, useCallback } from 'react';

import { AtomsButton } from '~/components/design-system/atoms/Button';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
type DiscoverTab = 'trending' | 'your-apps';

type DiscoverHeaderProps = {
  currentTab?: DiscoverTab;
  onTabChange?: (tab: DiscoverTab) => void;
};

const tabs: Array<{ id: DiscoverTab; label: string }> = [
  { id: 'trending', label: 'Trending' },
  { id: 'your-apps', label: 'Your Apps' },
];

export const DiscoverHeader: FC<DiscoverHeaderProps> = memo(
  ({ currentTab = 'trending', onTabChange }) => {
    const navigate = useNavigate();
    const { trackEvent } = useAnalytics();

    const handleCreateClick = useCallback(() => {
      window.open('https://neynar.com/studio', '_blank', 'noopener,noreferrer');
    }, []);

    const handleTabClick = useCallback(
      (tabId: DiscoverTab) => {
        trackEvent(AnalyticsEvent.ClickAppsTab, { tab: tabId });
        onTabChange?.(tabId);
        if (tabId === 'your-apps') {
          navigate({ to: 'discoverYourApps', params: {} });
        } else {
          navigate({ to: 'discoverTrending', params: {} });
        }
      },
      [navigate, trackEvent, onTabChange],
    );

    return (
      <>
        <PageHeader
          hideCastButton
          hideBorderBottom
          renderAlternateActionButton={() => (
            <AtomsButton
              onPress={handleCreateClick}
              size="s"
              hierarchy="primary"
            >
              Create
            </AtomsButton>
          )}
        >
          <PageTitle>Apps</PageTitle>
        </PageHeader>
        <Tabs>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="h-full w-full cursor-pointer"
            >
              <Tab isFocused={currentTab === tab.id}>{tab.label}</Tab>
            </div>
          ))}
        </Tabs>
      </>
    );
  },
);

DiscoverHeader.displayName = 'DiscoverHeader';
