import { ApiUserAppContextNotificationTab } from 'farcaster-client-data';
import { useUnseen } from 'farcaster-client-hooks';
import { FC, memo } from 'react';

import { LinkToNotifications } from '~/components/links/LinkToNotifications';
import { PillTab } from '~/components/tabs/PillTab';
import { PillTabs } from '~/components/tabs/PillTabs';

type NotificationsHeaderProps = {
  currentTab: string;
  tabs: ApiUserAppContextNotificationTab[];
};

const NotificationsHeader: FC<NotificationsHeaderProps> = memo(
  ({ currentTab, tabs }) => {
    const { notificationsCount, unseenNotificationTabs } = useUnseen();

    return (
      <PillTabs>
        {tabs.map((tab, index) => (
          <LinkToNotifications
            key={tab.id}
            title={tab.name}
            params={{ tab: index > 0 ? tab.id : undefined }}
          >
            <PillTab
              isFocused={currentTab === tab.id}
              notificationDot={
                (tab.id === tabs[0].id && notificationsCount > 0) ||
                unseenNotificationTabs.includes(tab.id)
              }
            >
              {tab.name}
            </PillTab>
          </LinkToNotifications>
        ))}
      </PillTabs>
    );
  },
);

NotificationsHeader.displayName = 'NotificationsHeader';

export { NotificationsHeader };
