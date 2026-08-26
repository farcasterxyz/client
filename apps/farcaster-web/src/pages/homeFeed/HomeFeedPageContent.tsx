import { ArrowUpIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useChannelFeedUnseenStatus,
  useFeedItems,
  useRefreshFeedItemsFirstPage,
  useSetFeedItemsAsSeenIfPrefetched,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo, useCallback, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { HomeFeaturePromotion } from '~/components/promotions/HomeFeaturePromotion';
import { ToastButton } from '~/components/toastButton/ToastButton';
import { useCameFromPopped } from '~/contexts/PopStateProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useSetOnCurrentNavLinkClicked } from '~/hooks/data/useSetOnCurrentNavLinkClicked';
import { useScrollToTopOfRoot } from '~/hooks/useScrollToTopOfRoot';
import { buildCastsWithContext } from '~/utils/castUtils';
import { castWithContextKeyExtractor } from '~/utils/keyExtractorUtils';

const HOME_FEED_UPDATE_TOAST_ID = 'home-feed-update';
// Reserved for admin-only feed experiments; do not remove when empty.
const adminGatedFeedCastIncludeReasonTypes = new Set<string>();

const HomeFeedPageContent: FC = memo(() => {
  const wasPopped = useCameFromPopped();

  const onNullFeedItemsResponse = useCallback(() => {
    // FIXME: Fill this out if we notice issues on web clients similar to Web
  }, []);

  const { feedItems, onEndReached, isFetchingNextPage, refetch } = useFeedItems(
    {
      feedKey: 'home',
      feedType: 'default',
      updateState: true,
      purgeToFirstPageOnMount: !wasPopped,
      onNullFeedItemsResponse: onNullFeedItemsResponse,
    },
  );

  const castsWithContext = useMemo(
    () =>
      buildCastsWithContext(feedItems, {
        showChannelTag: (cast) => !cast.parentHash,
      }),
    [feedItems],
  );

  useSetFeedItemsAsSeenIfPrefetched({ feedKey: 'home', feedType: 'default' });

  const isSignedIn = useIsSignedIn();

  const scrollToTopOfRoot = useScrollToTopOfRoot();

  const refreshFirstPage = useRefreshFeedItemsFirstPage(
    'home',
    'default',
    refetch,
  );
  useSetOnCurrentNavLinkClicked(refreshFirstPage);

  const { trackEvent } = useTrackEvent();

  const hasNewItems = useChannelFeedUnseenStatus('home', true);

  const scrollToTopAndReloadFeed = useCallback(async () => {
    toast.dismiss(HOME_FEED_UPDATE_TOAST_ID);

    scrollToTopOfRoot(true);

    trackEvent(AnalyticsEvent.ClickNewCastsToast, {});

    refreshFirstPage();
  }, [refreshFirstPage, scrollToTopOfRoot, trackEvent]);

  useEffect(() => {
    // Dismiss the toast on unmount (since the config is global)
    return () => {
      toast.dismiss(HOME_FEED_UPDATE_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (hasNewItems) {
      toast('New casts', { id: HOME_FEED_UPDATE_TOAST_ID });
    } else if (!hasNewItems) {
      toast.dismiss(HOME_FEED_UPDATE_TOAST_ID);
    }
  }, [hasNewItems]);

  const renderHomeFeedItem = useCallback(
    ({ item }: { item: (typeof castsWithContext)[number] }) => {
      return (
        <Cast
          castWithContext={item}
          isAdminGatedFeedCast={
            typeof item.context.includeReason?.type !== 'undefined' &&
            adminGatedFeedCastIncludeReasonTypes.has(
              item.context.includeReason.type,
            )
          }
        />
      );
    },
    [],
  );

  return (
    <>
      {isSignedIn && (
        <ToastButton
          IconComponent={ArrowUpIcon}
          duration={1 * 60 * 60 * 1000} // 1 hour because user may not be on the tab
          onClick={scrollToTopAndReloadFeed}
          topDistance={124}
        />
      )}
      {isSignedIn && <HomeFeaturePromotion />}
      <FlatList
        data={castsWithContext}
        emptyView={<DefaultEmptyListView message="Your feed is empty" />}
        renderItem={renderHomeFeedItem}
        keyExtractor={castWithContextKeyExtractor}
        onEndReached={onEndReached}
        isFetchingNextPage={isFetchingNextPage}
      />
    </>
  );
});

HomeFeedPageContent.displayName = 'HomeFeedPageContent';

export { HomeFeedPageContent };
