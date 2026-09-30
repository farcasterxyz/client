import {
  ApiNotificationNewCast,
  ApiNotificationNewCastInChannel,
} from 'farcaster-client-data';
import {
  EventingProvider,
  extractNotificationTabFromGroupId,
  useNotificationsInGroupWithRefreshOnMount,
} from 'farcaster-client-hooks';
import { memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Cast } from '~/components/casts/Cast';
import { ChannelTag } from '~/components/channelsV3/ChannelTag';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useCastsWithContext } from '~/hooks/casts/useCastsWithContext';
import { useParams } from '~/hooks/navigation/useParams';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { ApiCastWithContext } from '~/types';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const NotificationGroupCastsPage = memo(() => {
  const { type } = useParams('notificationGroupCasts');
  const { groupId } = useSearchParams('notificationGroupCasts');
  const notificationTab = useMemo(
    () => extractNotificationTabFromGroupId(groupId),
    [groupId],
  );

  const { data, onEndReached, isFetchingNextPage } =
    useNotificationsInGroupWithRefreshOnMount({
      groupId: groupId!,
      type,
    });

  const casts = useMemo(() => {
    const filtered = data?.pages.flatMap((page) =>
      page.result.notifications.filter(
        (notification) => notification.type === type,
      ),
    );

    // Here's a bit of TypeScript dance as we have to prove that they
    // contain a cast object in content.
    if (type === 'new-cast') {
      return (filtered as ApiNotificationNewCast[]).flatMap(
        (o) => o.content.cast,
      );
    }
    if (type === 'new-cast-in-channel') {
      return (filtered as ApiNotificationNewCastInChannel[]).flatMap(
        (o) => o.content.cast,
      );
    }
    if (type === 'dormant-user-new-cast') {
      return (filtered as ApiNotificationNewCastInChannel[]).flatMap(
        (o) => o.content.cast,
      );
    }
    if (type === 'trending-cast') {
      return (filtered as ApiNotificationNewCastInChannel[]).flatMap(
        (o) => o.content.cast,
      );
    }

    if (type === 'channel-pinned-cast') {
      return (filtered as ApiNotificationNewCastInChannel[]).flatMap(
        (o) => o.content.cast,
      );
    }

    return [];
  }, [data?.pages, type]);

  const castsWithContext = useCastsWithContext(casts, {
    forceThreadPosition: 'start_and_end',
  });

  const pageTitle = useMemo(() => {
    if (type === 'trending-cast') {
      return `Trending Casts`;
    }
    if (type === 'channel-pinned-cast') {
      const channel = casts[0].channel;
      if (channel) {
        return (
          <span className="flex flex-row items-center space-x-1.5">
            <span>Announcements in</span>
            <ChannelTag
              channel={channel}
              shouldLinkToChannel={true}
              size="conversation-header"
            />
          </span>
        );
      } else {
        return 'Announcements';
      }
    }
    return 'Casts';
  }, [casts, type]);

  return (
    <Page meta={{ title: `Farcaster / ${pageTitle}` }}>
      <BorderedMainContent>
        <PageHeader hideCastButton>
          <PageTitle>
            <BackButton />
            {pageTitle}
          </PageTitle>
        </PageHeader>
        <EventingProvider
          on={`notifications-${notificationTab}`}
          notificationType={type}
        >
          <FlatList
            data={castsWithContext}
            renderItem={renderItem}
            keyExtractor={castWithContextKeyExtractor}
            onEndReached={onEndReached}
            isFetchingNextPage={isFetchingNextPage}
            emptyView={
              <DefaultEmptyListView message="You don't have any notifications yet." />
            }
          />
        </EventingProvider>
      </BorderedMainContent>
    </Page>
  );
});

const renderItem = ({ item }: { item: ApiCastWithContext }) => {
  return <Cast castWithContext={item} />;
};

NotificationGroupCastsPage.displayName = 'NotificationGroupCastsPage';

export { NotificationGroupCastsPage };
