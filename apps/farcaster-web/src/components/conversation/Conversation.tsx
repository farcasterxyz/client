import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiChannelMinimal,
  ApiOnchainTokenMinimal,
} from 'farcaster-client-data';
import {
  EventingPropOverrideProvider,
  EventingProvider,
  EventType,
  EventV2Props,
  extractThreadListItemKey,
  FeedSourceOn,
  ThreadListItem,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { FC, memo, useMemo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { UnhideIcon } from '~/components/casts/actions/icons/Unhide';
import { Cast } from '~/components/casts/Cast';
import { ChannelTag, TokenTag } from '~/components/channelsV3/ChannelTag';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { DefaultEmptyListView } from '~/components/lists/DefaultEmptyListView';
import { FlatList } from '~/components/lists/FlatList';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { FocusedCastProvider } from '~/contexts/FocusedCastProvider';
import { ApiCastWithContext } from '~/types';

type ConversationProps = {
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  sourceOn?: FeedSourceOn;
  focusedCast: ApiCast | undefined;
  threadItems: ThreadListItem<ApiCastWithContext>[];
  onEndReached: () => void;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  channel: ApiChannelMinimal | undefined;
  token: ApiOnchainTokenMinimal | undefined;
  hasHiddenReplies?: boolean;
  showHiddenReplies: () => void;
};

const Conversation: FC<ConversationProps> = memo((props) => {
  if (props.threadItems.length === 0 && !props.isFetching) {
    return <DefaultEmptyListView message="Cast not found" />;
  } else {
    return <ConversationContent {...props} />;
  }
});

const ConversationContent: FC<ConversationProps> = memo(
  ({
    castOpenIncludeReason,
    sourceOn,
    focusedCast,
    threadItems,
    onEndReached,
    channel,
    token,
    isFetching,
    isFetchingNextPage,
    showHiddenReplies,
  }) => {
    const { trackEvent } = useTrackEvent();

    const pageTitle = useMemo(() => {
      if (!focusedCast) {
        return 'Conversation on Farcaster';
      }

      const username =
        focusedCast.author.username || `!${focusedCast.author.fid}`;
      const text = focusedCast.text || '';
      const truncatedText =
        text.length > 30 ? text.substring(0, 30) + '...' : text;

      if (truncatedText) {
        return `@${username} on Farcaster: "${truncatedText}"`;
      }

      return `@${username} on Farcaster`;
    }, [focusedCast]);

    // Build SEO metadata for conversation
    const description = useMemo(() => {
      if (!focusedCast) {
        return 'View conversation on Farcaster';
      }
      const text = focusedCast.text || '';
      if (text) {
        return text.length > 160 ? `${text.substring(0, 157)}...` : text;
      }
      const username =
        focusedCast.author.username || `!${focusedCast.author.fid}`;
      return `View @${username}'s cast on Farcaster`;
    }, [focusedCast]);

    const canonical = useMemo(() => {
      if (!focusedCast) {
        return undefined;
      }
      const username = focusedCast.author.username;
      if (username) {
        const hashPrefix = focusedCast.hash.substring(0, 10);
        return `https://farcaster.xyz/${username}/${hashPrefix}`;
      }
      return `https://farcaster.xyz/~/conversations/${focusedCast.hash}`;
    }, [focusedCast]);

    const ogImage = useMemo(() => {
      return focusedCast?.author?.pfp?.url;
    }, [focusedCast?.author?.pfp?.url]);

    const author = useMemo(() => {
      if (!focusedCast) {
        return undefined;
      }
      return focusedCast.author.username
        ? `@${focusedCast.author.username}`
        : undefined;
    }, [focusedCast]);

    const extraProps = useMemo(
      () => ({
        castOpenIncludeReason,
        showHiddenReplies,
        sourceOn,
        trackEvent,
      }),
      [castOpenIncludeReason, showHiddenReplies, sourceOn, trackEvent],
    );

    // Use cast's embedded image if available (consistent with SSR ConversationHead)
    const castImageEmbed = useMemo(() => {
      if (
        !focusedCast?.embeds?.images?.length ||
        !focusedCast.embeds.images[0].media
      ) {
        return undefined;
      }
      const primaryImage = focusedCast.embeds.images[0];
      return {
        url: primaryImage.sourceUrl,
        width: primaryImage.media?.width,
        height: primaryImage.media?.height,
      };
    }, [focusedCast?.embeds?.images]);

    return (
      <Page
        meta={{
          title: pageTitle,
          description,
          canonical,
          ogImage: castImageEmbed?.url || ogImage,
          ogImageWidth: castImageEmbed?.width,
          ogImageHeight: castImageEmbed?.height,
          ogType: 'article',
          author,
          twitterCard: castImageEmbed ? 'summary_large_image' : 'summary',
        }}
      >
        <BorderedMainContent>
          <DebugLogger
            name="Conversation"
            data={threadItems}
            position="top-left"
          />
          <PageHeader
            hideBorderBottom
            composerDefaultIntent={
              channel
                ? {
                    channelKey: channel.key,
                  }
                : undefined
            }
          >
            <PageTitle>
              <BackButton />
              Conversation
              {typeof channel !== 'undefined' && (
                <span className="ml-1 flex flex-row items-center space-x-1.5">
                  <span>in</span>
                  <ChannelTag
                    channel={channel}
                    shouldLinkToChannel={true}
                    size="conversation-header"
                  />
                </span>
              )}
              {typeof token !== 'undefined' && (
                <span className="ml-1 flex flex-row items-center space-x-1.5">
                  <span>in</span>
                  <TokenTag
                    token={token}
                    shouldLinkToToken={true}
                    size="conversation-header"
                  />
                </span>
              )}
            </PageTitle>
          </PageHeader>

          <FocusedCastProvider focusedCast={focusedCast}>
            <EventingProvider on="conversation">
              <FlatList
                data={threadItems}
                extraProps={extraProps}
                emptyView={<></>}
                renderItem={renderItem}
                keyExtractor={extractThreadListItemKey}
                onEndReached={onEndReached}
                isFetchingNextPage={isFetchingNextPage}
              />
            </EventingProvider>
          </FocusedCastProvider>
          {isFetching && (
            <div className="flex w-full items-center justify-center py-4">
              <LoadingIndicator />
            </div>
          )}
        </BorderedMainContent>
      </Page>
    );
  },
);

Conversation.displayName = 'Conversation';

const renderItem = ({
  item,
  extra,
}: {
  item: ThreadListItem<ApiCastWithContext>;
  extra?: {
    castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
    sourceOn?: FeedSourceOn;
    showHiddenReplies: () => void;
    trackEvent: (event: EventType, props?: EventV2Props) => void;
  };
}) => {
  if (item.type === 'hiddenRepliesHeader') {
    if (item.hiddenRepliesVisible) {
      return (
        <div className="flex h-10 flex-row items-center gap-2 px-4 text-sm text-muted">
          More replies
        </div>
      );
    } else {
      return (
        <div className="border-t pb-10 border-faint">
          <div
            className="flex h-10 flex-row items-center gap-2 px-4 hover:cursor-pointer hover:bg-overlay-faint"
            onClick={() => {
              extra?.trackEvent(AnalyticsEvent.ClickShowHiddenReplies, {});
              extra?.showHiddenReplies();
            }}
          >
            <span className="text-muted">
              <UnhideIcon height={14} />
            </span>
            <span className="text-sm text-muted">Show more replies</span>
          </div>
        </div>
      );
    }
  } else {
    return (
      <EventingPropOverrideProvider on={extra?.sourceOn}>
        <Cast
          castWithContext={item.wrappedCast}
          castOpenIncludeReason={
            item.wrappedCast.context.isFocused
              ? extra?.castOpenIncludeReason
              : undefined
          }
        />
      </EventingPropOverrideProvider>
    );
  }
};

export { Conversation };
