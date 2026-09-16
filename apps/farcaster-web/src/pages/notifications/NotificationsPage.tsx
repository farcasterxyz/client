import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUserAppContextNotificationTab } from 'farcaster-client-data';
import { EventingProvider, useUnseen } from 'farcaster-client-hooks';
import { FC, memo, Suspense, useEffect, useMemo, useRef } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { NotificationsTab } from '~/components/notificationsTabs/NotificationsTab';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useParams } from '~/hooks/navigation/useParams';

import { NotificationsHeader } from './NotificationsHeader';

const NotificationsPage: FC = memo(() => {
  const { notificationTabs } = useUserAppContext();

  if (!notificationTabs) {
    return null;
  }

  return <NotificationsPageContent tabs={notificationTabs} />;
});

NotificationsPage.displayName = 'NotificationsPage';

interface NotificationsPageContentProps {
  tabs: ApiUserAppContextNotificationTab[];
}

const NotificationsPageContent: FC<NotificationsPageContentProps> = memo(
  ({ tabs }) => {
    const params = useParams('notificationsWithTabs');

    const { trackEvent } = useAnalytics();
    const { resetNotificationsCount } = useUnseen();
    const didResetNotificationsCount = useRef(false);

    const firstTabId = tabs[0].id;

    const currentTab = useMemo(
      () => params.tab || firstTabId,
      [firstTabId, params.tab],
    );

    const isLinkedToUnseen = useMemo(() => {
      return currentTab === firstTabId;
    }, [currentTab, firstTabId]);

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewNotifications, { tab: currentTab });
    }, [trackEvent, currentTab]);

    // This should run once on initial user view right afetr the data has loaded
    useEffect(() => {
      if (!didResetNotificationsCount.current) {
        resetNotificationsCount();
        didResetNotificationsCount.current = true;
      }
    }, [resetNotificationsCount, didResetNotificationsCount]);

    return (
      <Page
        meta={{ title: 'Farcaster / Notifications' }}
        key={currentTab} // We pass `currentTab` as the `key` to force the `Page` component to remount when the user navigates to a different tab/page. If we don't do this, the component will never unmount, and the browser may try to apply the scroll position of the previous page to the new page, which leads to a broken UX, particularly when we have infinitely scrollable lists.
      >
        <BorderedMainContent>
          <PageHeader
            footer={<NotificationsHeader tabs={tabs} currentTab={currentTab} />}
          >
            <PageTitle>Notifications</PageTitle>
          </PageHeader>
          <Suspense fallback={<FullScreenLoadingIndicator />}>
            <EventingProvider on={`notifications-${currentTab}`}>
              <NotificationsTab
                tab={currentTab}
                isLinkedToUnseen={isLinkedToUnseen}
              />
            </EventingProvider>
          </Suspense>
        </BorderedMainContent>
      </Page>
    );
  },
);

export { NotificationsPage };
