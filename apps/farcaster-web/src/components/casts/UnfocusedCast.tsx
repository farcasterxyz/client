import cn from 'classnames';
import { parseCaip19Url } from 'farcaster-client-data';
import {
  CastClickType,
  EventingProvider,
  resolveUsername,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, {
  FC,
  memo,
  MouseEvent,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { Reactions } from '~/components/casts/actions/Reactions';
import { Recasts } from '~/components/casts/actions/Recasts';
import { Replies } from '~/components/casts/actions/Replies';
import { CastAttachmentsSection } from '~/components/casts/CastAttachmentsSection';
import { CastAuthorLine } from '~/components/casts/CastAuthorLine';
import { CastTranslationTopHat } from '~/components/casts/CastTranslationTopHat';
import { DeletedCast } from '~/components/casts/DeletedCast';
import { FeedItemTopHat } from '~/components/casts/FeedItemTopHat';
import { IncludeReasonTopHat } from '~/components/casts/IncludeReasonTopHat';
import { PinLabel } from '~/components/casts/PinLabel';
import { ShowMore } from '~/components/casts/ShowMore';
import { Threadline } from '~/components/casts/Threadline';
import { CastProps } from '~/components/casts/types';
import { LinkToProfile } from '~/components/links/LinkToProfile';
import { CastMenuActions } from '~/components/popovers/CastMenuActions';
import { mdAvatarDiameter } from '~/constants/avatar';
import { useCastBody } from '~/hooks/casts/useCastBody';
import { useCastTranslationDisplay } from '~/hooks/casts/useCastTranslationDisplay';
import { useRecordCastOnView } from '~/hooks/casts/useRecordCastOnView';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useOptimisticallyPrefetchConversation } from '~/hooks/data/useOptimisticallyPrefetchConversation';
import { useCurrentRoute } from '~/hooks/navigation/useCurrentRoute';
import { useCurrentRouteFamily } from '~/hooks/navigation/useCurrentRouteFamily';
import { useNavigateToConversation } from '~/hooks/navigation/useNavigateToConversation';
import { useOnClickIfNotDragging } from '~/hooks/useOnClickIfNotDragging';
import { ApiCastWithContext } from '~/types';
import { useHorizontalDragScroll } from '~/utils/castUtils';

import { ShareCast } from './actions/ShareCast';

const EXTRA_WHITESPACE_FOR_SHOW_MORE_HANDLING = ' ';

// https://gist.ake.cx/redoPop/184082fcfa28bb14380097457a666f2f
function useClampCheck(): [boolean, React.RefCallback<HTMLElement>] {
  const [clamped, setClamped] = React.useState(false);

  const ref: React.RefCallback<HTMLElement> = (el) =>
    setClamped(Boolean(el && el.scrollHeight > el.clientHeight));

  return [clamped, ref];
}

type UnfocusedCastProps = Omit<CastProps, 'isFocused'> & {
  CastTopHatForNotificationsComponent?: ReactNode;
  isAppsDialog?: boolean;
  onMiniAppLaunch?: () => void;
};
const UnfocusedCast: FC<UnfocusedCastProps> = memo((props) => {
  return (
    <EventingProvider
      castHash={props.castWithContext.cast.hash}
      castChannel={props.castWithContext.cast.channel?.key}
      castViewIncludeReason={props.castWithContext.context.includeReason?.type}
      castViewIndex={props.castWithContext.context.index}
      castViewAuthorFid={props.castWithContext.cast.author.fid}
    >
      <UnfocusedCastContent {...props} />
    </EventingProvider>
  );
});
UnfocusedCast.displayName = 'UnfocusedCast';

const UnfocusedCastContent: FC<UnfocusedCastProps> = memo(
  ({
    castWithContext,
    CastTopHatForNotificationsComponent,
    isAppsDialog = false,
    onMiniAppLaunch,
    isAdminGatedFeedCast = false,
  }) => {
    const { cast, context } = castWithContext;

    const [isClamped, ref] = useClampCheck();

    const {
      isFirstInList,
      isReplyingToContinuousCast,
      isReplyingToDisconnectedCast,
      isReplyingToFocusedCast,
      forceShowReplyingTo,
      isLastInList,
      truncateCastText,
      showMore,
      threadPosition,
      isReplyingToEmbed,
      shouldShowChannelTag,
      isPinned,
      showPinnedAsAnnouncement,
      topHat,
      showMemberBadge = false,
      isHighlighted = false,
    } = context;

    const [showFullCastBody, setShowFullCastBody] = useState(false);

    const shouldTruncateCastText = truncateCastText && !showFullCastBody;

    const currentRoute = useCurrentRoute();
    const currentRouteFamily = useCurrentRouteFamily();

    const trackCastClick = useTrackCastClick();

    const { ref: horizontalDragScrollRef, draggingRef } =
      useHorizontalDragScroll<HTMLDivElement>();

    const {
      displayText,
      hasTranslation,
      isTranslationPending,
      showOriginal,
      sourceLanguageName,
      toggleLabel,
      toggleTranslation,
    } = useCastTranslationDisplay(cast);

    const {
      nonLinkfiedText,
      text: processedText,
      isTruncatedCastText,
      hasAttachments,
      hasNonCarouselAttachments,
      castAttachment,
      nonCarouselAttachments,
      needsCarousel,
      carouselMaxHeight,
    } = useCastBody({
      cast,
      castText: displayText,
      isFocusedCast: false,
      truncateCastText: shouldTruncateCastText,
      draggingRef,
      onMiniAppLaunch: isAppsDialog ? onMiniAppLaunch : undefined,
    });

    const shouldShowTopBorder = useMemo(
      () =>
        !(
          isFirstInList ||
          isReplyingToContinuousCast ||
          isReplyingToDisconnectedCast
        ),
      [isFirstInList, isReplyingToDisconnectedCast, isReplyingToContinuousCast],
    );

    const shouldShowBottomBorder = useMemo(() => {
      return isLastInList && typeof showMore === 'undefined';
    }, [isLastInList, showMore]);

    const shouldShowPinnedLabel = useMemo(() => {
      // Show the pinned label if we are on channel related context and its pinned to channel
      // or its pinned to user profile and we are in user profile context.
      return (
        ((currentRouteFamily === 'channel' || showPinnedAsAnnouncement) &&
          isPinned) ||
        (currentRouteFamily === 'profile' && cast.pinned)
      );
    }, [cast.pinned, currentRouteFamily, isPinned, showPinnedAsAnnouncement]);

    const isSignedIn = useIsSignedIn();

    const navigateToConversation = useNavigateToConversation();
    const optimisticallyPrefetchConversation =
      useOptimisticallyPrefetchConversation({ cast });

    const onMouseOver = useCallback(() => {
      optimisticallyPrefetchConversation();
    }, [optimisticallyPrefetchConversation]);

    const castOpenIncludeReason =
      currentRoute?.routeName === 'homeFeed'
        ? context.includeReason?.type
        : undefined;

    const { onMouseDown, onClick } = useOnClickIfNotDragging(
      useCallback(
        (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();

          trackCastClick({ type: CastClickType.Cast });
          navigateToConversation({
            castHash: cast.hash,
            authorUsername: cast.author.username,
            ...(castOpenIncludeReason
              ? { includeReason: castOpenIncludeReason }
              : {}),
            openInNewTab: e.metaKey || e.ctrlKey,
          });
        },
        [
          cast.author.username,
          cast.hash,
          castOpenIncludeReason,
          navigateToConversation,
          trackCastClick,
        ],
      ),
    );

    const onAuxClick = useCallback(
      (e: MouseEvent) => {
        // Mouse middle click.
        if (
          e.button === 1 &&
          typeof (e.target as HTMLAnchorElement).href === 'undefined'
        ) {
          trackCastClick({ type: CastClickType.Cast });
          navigateToConversation({
            castHash: cast.hash,
            authorUsername: cast.author.username,
            ...(castOpenIncludeReason
              ? { includeReason: castOpenIncludeReason }
              : {}),
            openInNewTab: true,
          });
        }
      },
      [
        cast.author.username,
        cast.hash,
        castOpenIncludeReason,
        navigateToConversation,
        trackCastClick,
      ],
    );

    const { inViewRef } = useRecordCastOnView({
      castHash: cast.hash,
      ...(context.includeReason?.type
        ? { includeReason: context.includeReason.type }
        : {}),
      ...(typeof context.index === 'number' ? { index: context.index } : {}),
    });

    const isTokenParentUrl = useMemo(() => {
      return (
        cast.parentSource?.type === 'url' &&
        parseCaip19Url(cast.parentSource.url)
      );
    }, [cast.parentSource]);

    const showMemberBadgeFinal =
      showMemberBadge &&
      cast.channel &&
      cast.channel.authorContext?.role &&
      cast.channel.authorContext.role !== 'none';

    const currentUser = useCachedCurrentUser();

    const onShowMoreClick = useCallback((event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setShowFullCastBody(true);
    }, []);

    const includeReasonTopHatType = useMemo(() => {
      if (context.includeReason?.type === 'evergreen-following-author') {
        return 'evergreen-following-author';
      }

      if (context.includeReason?.type === 'high-quality-unfollowed') {
        return 'high-quality-unfollowed';
      }

      return null;
    }, [context.includeReason?.type]);

    const interactionTopHat = useMemo(() => {
      if (includeReasonTopHatType || isPinned || !topHat) {
        return null;
      }

      return topHat;
    }, [includeReasonTopHatType, isPinned, topHat]);

    if (cast.deleted) {
      return <DeletedCast />;
    }

    return (
      <div
        ref={inViewRef}
        className={cn(
          'relative',
          isAdminGatedFeedCast && 'admin-gated-feed-cast',
        )}
        id={`cast:${cast.hash}`}
      >
        <div
          className={cn(
            'relative cursor-pointer',
            shouldShowTopBorder && 'border-t !border-surface-secondary',
            shouldShowBottomBorder && 'border-b !border-surface-secondary',
            isHighlighted && 'bg-[#F5F4FF] dark:bg-[#1F182C]',
            isAppsDialog ? 'py-4' : 'py-2 hover:bg-overlay-faint',
          )}
          onMouseOver={onMouseOver}
          onMouseDown={onMouseDown}
          onClick={onClick}
          onAuxClick={onAuxClick}
        >
          <div
            className={cn(
              'absolute ml-4 mr-2',
              (isPinned || cast.pinned) && shouldShowPinnedLabel && 'mt-4',
              interactionTopHat && 'mt-4',
              includeReasonTopHatType && 'mt-4',
              (hasTranslation || isTranslationPending) && 'mt-4',
              typeof CastTopHatForNotificationsComponent !== 'undefined' &&
                'mt-4',
            )}
          >
            <Avatar
              user={cast.author}
              className="relative z-[2]"
              followCastChannel={cast.channel?.key}
              followCastHash={cast.hash}
              followIncludeReason={castOpenIncludeReason}
              onClick={() => {
                trackCastClick({ type: CastClickType.Author });
              }}
              size={'md'}
              withDetailsPopover={true}
              isHighlighted={false}
              profileOpenIncludeReason={castOpenIncludeReason}
            />
          </div>
          {!isAppsDialog && <Threadline threadPosition={threadPosition} />}
          <div className="relative flex flex-col">
            {includeReasonTopHatType && (
              <IncludeReasonTopHat
                includeReasonType={includeReasonTopHatType}
              />
            )}
            {(isPinned || cast.pinned) && shouldShowPinnedLabel && (
              <PinLabel
                isFocusedCast={false}
                showAsAnnouncement={showPinnedAsAnnouncement}
              />
            )}
            {interactionTopHat && <FeedItemTopHat topHat={interactionTopHat} />}
            {(hasTranslation || isTranslationPending) && (
              <CastTranslationTopHat
                isPending={isTranslationPending}
                sourceLanguageName={sourceLanguageName}
                showOriginal={showOriginal}
                toggleLabel={toggleLabel}
                onToggle={toggleTranslation}
              />
            )}
            {typeof CastTopHatForNotificationsComponent !== 'undefined' &&
              CastTopHatForNotificationsComponent}
            <div className="relative flex">
              <div className="relative w-full min-w-0">
                <div
                  className={cn(
                    'mr-4 flex flex-row justify-between gap-2',
                    nonLinkfiedText.length === 0 && needsCarousel && 'mb-4',
                  )}
                >
                  <div
                    className={cn(
                      'mb-[2px] flex min-w-0 shrink flex-row items-center',
                    )}
                  >
                    <div
                      className="shrink-0"
                      style={{
                        width: mdAvatarDiameter + 24,
                        minWidth: mdAvatarDiameter + 24,
                      }}
                    />
                    <CastAuthorLine
                      cast={cast}
                      profileOpenIncludeReason={castOpenIncludeReason}
                      showChannel={shouldShowChannelTag}
                      showMemberBadge={showMemberBadgeFinal}
                    />
                  </div>
                  {isSignedIn && !isAppsDialog && (
                    <CastMenuActions cast={castWithContext} />
                  )}
                </div>
                {typeof cast.parentAuthor !== 'undefined' &&
                  ((!isReplyingToContinuousCast && !isReplyingToFocusedCast) ||
                    forceShowReplyingTo) && (
                    <div
                      className={cn(
                        'flex flex-row space-x-1 pb-1 text-xs text-muted',
                      )}
                    >
                      <div
                        className="shrink-0"
                        style={{
                          width: mdAvatarDiameter + 20,
                          minWidth: mdAvatarDiameter + 20,
                        }}
                      />
                      <div>Replying to</div>
                      {cast.parentAuthor.fid === currentUser?.fid ? (
                        <div>you</div>
                      ) : (
                        <LinkToProfile
                          title={cast.parentAuthor.displayName}
                          user={cast.parentAuthor}
                          className="relative hover:underline"
                          onClick={() => {
                            trackCastClick({ type: CastClickType.Mention });
                          }}
                        >
                          {resolveUsername({
                            username: cast.parentAuthor.username,
                            fid: cast.parentAuthor.fid,
                          })}
                        </LinkToProfile>
                      )}
                    </div>
                  )}
                {isReplyingToEmbed &&
                  !cast.channel &&
                  !isTokenParentUrl &&
                  (!isReplyingToContinuousCast || isReplyingToFocusedCast) && (
                    <div className="flex flex-row space-x-1 pb-1 text-xs text-muted">
                      <div
                        className="shrink-0"
                        style={{
                          width: mdAvatarDiameter + 20,
                          minWidth: mdAvatarDiameter + 20,
                        }}
                      />
                      <div> Replying to external content</div>
                    </div>
                  )}
                <div className="flex flex-row pl-[72px] pr-4">
                  <div className="flex flex-col whitespace-pre-wrap break-words text-base leading-5 tracking-normal">
                    <div
                      className={cn(
                        shouldTruncateCastText && 'line-clamp-feed',
                        '[overflow-wrap:anywhere]',
                      )}
                      ref={ref}
                    >
                      {processedText}
                      {isTruncatedCastText &&
                        EXTRA_WHITESPACE_FOR_SHOW_MORE_HANDLING}
                      {isTruncatedCastText && !showFullCastBody && (
                        <button
                          type="button"
                          className="inline cursor-pointer border-0 bg-transparent p-0 text-link hover:underline"
                          onClick={onShowMoreClick}
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          Show more
                        </button>
                      )}
                    </div>
                    {isClamped && !showFullCastBody && (
                      <button
                        type="button"
                        className="inline cursor-pointer border-0 bg-transparent p-0 text-left text-link hover:underline"
                        onClick={onShowMoreClick}
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        Show more
                      </button>
                    )}
                  </div>
                </div>
                <CastAttachmentsSection
                  cast={cast}
                  variant="feed"
                  castAttachment={castAttachment}
                  nonCarouselAttachments={nonCarouselAttachments}
                  hasAttachments={hasAttachments}
                  hasNonCarouselAttachments={hasNonCarouselAttachments}
                  needsCarousel={needsCarousel}
                  carouselMaxHeight={carouselMaxHeight}
                  horizontalDragScrollRef={horizontalDragScrollRef}
                />
                <div className="mr-4 mt-3 flex flex-row items-center">
                  <div
                    style={{
                      width: mdAvatarDiameter + 16,
                      minWidth: mdAvatarDiameter + 16,
                    }}
                  />
                  <UnfocusedCastActions castWithContext={castWithContext} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {showMore && !truncateCastText && <ShowMore {...showMore} />}
      </div>
    );
  },
);

UnfocusedCastContent.displayName = 'UnfocusedCastContent';

function UnfocusedCastActions({
  castWithContext,
}: {
  castWithContext: ApiCastWithContext;
}) {
  const isSignedIn = useIsSignedIn();

  const { context, cast } = castWithContext;

  if (!isSignedIn) {
    return (
      <div className="grid w-full grid-cols-4 items-center">
        <Replies cast={cast} isFocused={context.isFocused} />
        <Recasts cast={cast} isFocused={context.isFocused} />
        <Reactions cast={cast} isFocused={context.isFocused} />
        <ShareCast cast={cast} isFocused={context.isFocused} />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row items-center justify-between ">
      <div className="grid w-full grid-cols-[repeat(auto-fit,_112px)] items-center">
        <Replies
          cast={cast}
          isFocused={context.isFocused}
          includeReason={context.includeReason?.type}
        />
        <Recasts
          cast={cast}
          isFocused={context.isFocused}
          includeReason={context.includeReason?.type}
        />
        <Reactions
          cast={cast}
          isFocused={context.isFocused}
          includeReason={context.includeReason?.type}
        />
        <div />
      </div>
      <div className="mr-[-8px] flex flex-row items-center gap-[16px]">
        <ShareCast cast={cast} isFocused={context.isFocused} />
      </div>
    </div>
  );
}

export { UnfocusedCast };
