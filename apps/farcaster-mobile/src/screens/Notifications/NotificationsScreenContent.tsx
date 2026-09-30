import { ApiUserAppContextNotificationTab } from 'farcaster-client-data';
import { useUnseen } from 'farcaster-client-hooks';
import { ScreenTitle } from 'farcaster-expo';
import React, { FC, memo, useMemo, useState } from 'react';
import { View } from 'react-native';

import { makePillTab } from '~/components/CollapsibleTab/PillTab';
import {
  TabViewInner,
  TabViewItem,
} from '~/components/CollapsibleTab/TabViewInner';
import { FloatingComposerButton } from '~/components/FloatingComposerButton';
import { FloatingSearch } from '~/components/FloatingSearch/FloatingSearch';
import { HeaderSearchButton } from '~/components/headers/HeaderSearchButton';
import { topBarHeight, useTopBar } from '~/components/TopBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { NotificationsTab } from '~/screens/Notifications/NotificationsTab';

interface ActiveTabsContextProps {
  activeTabs: Set<string>;
  markTabAsActive: (tabId: string) => void;
  isTabActive: (tabId: string) => boolean;
}

const ActiveTabsContext = React.createContext<ActiveTabsContextProps>(
  {} as never,
);

function useActiveTabs() {
  return React.useContext(ActiveTabsContext);
}

function ActiveTabsProvider({ children }: React.PropsWithChildren) {
  const [activeTabs, setActiveTabs] = React.useState<Set<string>>(new Set());

  const markTabAsActive = React.useCallback((tabId: string) => {
    setActiveTabs((prev) => new Set(prev).add(tabId));
  }, []);

  const isTabActive = React.useCallback(
    (tabId: string): boolean => {
      return activeTabs.has(tabId);
    },
    [activeTabs],
  );

  return (
    <ActiveTabsContext.Provider
      value={{ activeTabs, markTabAsActive, isTabActive }}
    >
      {children}
    </ActiveTabsContext.Provider>
  );
}

interface NotificationsScreenContentProps {
  tabs: ApiUserAppContextNotificationTab[];
}

const NotificationsScreenContent: FC<NotificationsScreenContentProps> = memo(
  ({ tabs }) => {
    const t = useTheme();

    const { notificationsCount, unseenNotificationTabs } = useUnseen();

    const [searchAutoOpen, setSearchAutoOpen] = useState(false);

    const title = useMemo(() => <ScreenTitle title="Notifications" />, []);

    const searchIcon = useMemo(
      () => <HeaderSearchButton onPress={() => setSearchAutoOpen(true)} />,
      [],
    );

    const { topBar } = useTopBar({
      title,
      rightIcon: searchIcon,
    });

    return (
      <View style={[t.hFull]}>
        {topBar}
        <View style={[{ marginTop: topBarHeight }]}>
          <ActiveTabsProvider>
            <NotificationContentTabbedItems
              tabs={tabs}
              notificationsCount={notificationsCount}
              unseenNotificationTabs={unseenNotificationTabs}
            />
          </ActiveTabsProvider>
        </View>
        <View style={[t.absolute, t.bottom0, t.right0]}>
          <FloatingComposerButton />
        </View>
        <FloatingSearch
          source="notifications"
          autoOpen={searchAutoOpen}
          onAutoOpenHandled={() => setSearchAutoOpen(false)}
          showPressable={false}
        />
      </View>
    );
  },
);

function NotificationContentTabbedItems({
  tabs,
  notificationsCount,
  unseenNotificationTabs,
}: {
  tabs: ApiUserAppContextNotificationTab[];
  notificationsCount: number;
  unseenNotificationTabs: string[];
}) {
  const { isTabActive, markTabAsActive } = useActiveTabs();
  const t = useTheme();
  const firstTabId = tabs[0].id;

  const [selectedNotificationsTab, setSelectedNotificationsTab] =
    React.useState<string>(firstTabId);

  const onKeyChanged = React.useCallback(
    (id: string) => {
      setSelectedNotificationsTab(id);
      markTabAsActive(id);
    },
    [markTabAsActive],
  );

  const tabItems = useMemo(
    () =>
      tabs.map(
        (tab) =>
          ({
            key: tab.id,
            Tab: makePillTab({
              name: tab.name,
              redDot:
                (tab.id === firstTabId && notificationsCount > 0) ||
                unseenNotificationTabs.includes(tab.id),
            }),
            DeprecatedPreRenderedBody: undefined,
          }) satisfies TabViewItem,
      ),
    [firstTabId, notificationsCount, tabs, unseenNotificationTabs],
  );

  return (
    <TabViewInner.Navigator
      items={tabItems}
      tabBarWrapperStyle={[
        t.borderB,
        t.borderDefault,
        {
          paddingBottom: 16,
        },
      ]}
      tabBarStyle={{
        paddingTop: 6,
        paddingLeft: 12,
        paddingRight: 6,
      }}
      onKeyChanged={onKeyChanged}
    >
      {tabItems.map((item, index) => {
        const tab = item.key;
        const isLinkedToUnseen = item.key === firstTabId;
        const enabled =
          item.key === selectedNotificationsTab ||
          index === 0 ||
          isTabActive(tab);

        return (
          <TabViewInner.Screen
            key={item.key}
            name={item.key}
            navigationKey={item.key}
            // Tab route names are server-driven ids; tag a stable RUM view
            // name so they don't leak individually (see getRumViewName).
            initialParams={{ rumViewName: 'Notifications' }}
          >
            {() => (
              <NotificationsTab
                tab={tab}
                isLinkedToUnseen={isLinkedToUnseen}
                enabled={enabled}
              />
            )}
          </TabViewInner.Screen>
        );
      })}
    </TabViewInner.Navigator>
  );
}

NotificationsScreenContent.displayName = 'NotificationsScreenContent';

export { NotificationsScreenContent };
