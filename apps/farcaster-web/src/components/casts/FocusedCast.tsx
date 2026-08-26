import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  EventingProvider,
  formatTimeAgo,
  getFeedSourceOn,
  getNotionLinkTarget,
  resolveUsernameShort,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { Reactions } from '~/components/casts/actions/Reactions';
import { Recasts } from '~/components/casts/actions/Recasts';
import { Replies } from '~/components/casts/actions/Replies';
import { CastAttachmentsSection } from '~/components/casts/CastAttachmentsSection';
import { CastDetails } from '~/components/casts/CastDetails';
import { CastTranslationTopHat } from '~/components/casts/CastTranslationTopHat';
import { DeletedCast } from '~/components/casts/DeletedCast';
import { FocusedCastReplyTrigger } from '~/components/casts/FocusedCastReplyTrigger';
import { Threadline } from '~/components/casts/Threadline';
import { CastProps } from '~/components/casts/types';
import { ChannelBadge } from '~/components/channelUsers/ChannelBadge';
import { DebugLogger } from '~/components/debug/DebugLogger';
import { TwoPeopleIcon } from '~/components/icons/TwoPeopleIcon';
import { ExternalLink } from '~/components/links/ExternalLink';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { CastMenuActions } from '~/components/popovers/CastMenuActions';
import { ScrollIntoView } from '~/components/scroll/ScrollIntoView';
import { Tooltip } from '~/components/Tooltip';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastBody } from '~/hooks/casts/useCastBody';
import { useCastTranslationDisplay } from '~/hooks/casts/useCastTranslationDisplay';
import { useRecordCastOnView } from '~/hooks/casts/useRecordCastOnView';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { ApiCastWithContext } from '~/types';
import { useHorizontalDragScroll } from '~/utils/castUtils';

import { ShareCast } from './actions/ShareCast';

type FocusedCastProps = Omit<CastProps, 'isFocused'>;

const FocusedCast: React.FC<FocusedCastProps> = React.memo((props) => {
  return (
    <EventingProvider
      castHash={props.castWithContext.cast.hash}
      castChannel={props.castWithContext.cast.channel?.key}
      castViewIncludeReason={props.castWithContext.context.includeReason?.type}
      castViewIndex={props.castWithContext.context.index}
      castViewAuthorFid={props.castWithContext.cast.author.fid}
    >
      <FocusedCastContent {...props} />
    </EventingProvider>
  );
});
FocusedCast.displayName = 'FocusedCast';

const FocusedCastContent: React.FC<FocusedCastProps> = React.memo(
  ({
    castWithContext,
    castOpenIncludeReason,
    isAdminGatedFeedCast = false,
  }) => {
    const { cast, context } = castWithContext;
    const { trackEvent } = useAnalytics();
    const {
      defaultEventProps: { on },
    } = useTrackEvent();

    const {
      isFirstInList,
      threadPosition,
      channelDisallowed,
      showMemberBadge,
    } = context;

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
      text: processedText,
      castAttachment,
      nonCarouselAttachments,
      hasAttachments,
      hasNonCarouselAttachments,
      needsCarousel,
      carouselMaxHeight,
    } = useCastBody({
      cast,
      castText: displayText,
      truncateCastText: context.truncateCastText,
      isFocusedCast: true,
      draggingRef,
    });

    const isSignedIn = useIsSignedIn();

    React.useEffect(() => {
      const sourceOn = getFeedSourceOn(on);

      trackEvent(AnalyticsEvent.CastOpen, {
        castHash: cast.hash,
        author_fid: cast.author.fid,
        ...(castOpenIncludeReason
          ? { includeReason: castOpenIncludeReason }
          : {}),
        ...(sourceOn ? { on: sourceOn } : {}),
      });
    }, [cast.author.fid, cast.hash, castOpenIncludeReason, on, trackEvent]);

    const { inViewRef } = useRecordCastOnView({
      castHash: cast.hash,
      ...(context.includeReason?.type
        ? { includeReason: context.includeReason.type }
        : {}),
      ...(typeof context.index === 'number' ? { index: context.index } : {}),
    });

    const isProUser = useUserLevel(cast.author) === 'pro';

    const showMemberBadgeFinal =
      showMemberBadge &&
      cast.channel &&
      cast.channel.authorContext?.role &&
      cast.channel.authorContext.role !== 'none';

    if (cast.deleted) {
      return <DeletedCast />;
    }

    return (
      <div
        ref={inViewRef}
        className={classNames(
          'relative',
          isAdminGatedFeedCast && 'admin-gated-feed-cast',
        )}
      >
        <div className="relative p-4 pt-2">
          {(hasTranslation || isTranslationPending) && (
            <CastTranslationTopHat
              isPending={isTranslationPending}
              sourceLanguageName={sourceLanguageName}
              showOriginal={showOriginal}
              toggleLabel={toggleLabel}
              onToggle={toggleTranslation}
            />
          )}
          <Threadline threadPosition={threadPosition} />
          <DebugLogger name="Focused Cast" data={{ cast, context }} />
          <div className="flex w-full items-center">
            <div className="flex w-full min-w-0 pb-2">
              <Avatar
                user={cast.author}
                withDetailsPopover={true}
                followCastChannel={cast.channel?.key}
                followCastHash={cast.hash}
                followIncludeReason={castOpenIncludeReason}
                profileOpenIncludeReason={castOpenIncludeReason}
              />
              <div className="flex flex-col items-start justify-center gap-0.5 pl-3">
                <div className="flex items-center justify-center gap-1">
                  <LinkToProfileWithSummaryTooltip
                    user={cast.author}
                    includeReason={castOpenIncludeReason}
                    className="font-semibold text-default hover:underline"
                    title={cast.author.displayName}
                  >
                    {resolveUsernameShort({
                      username: cast.author.username,
                      fid: cast.author.fid,
                    })}
                  </LinkToProfileWithSummaryTooltip>
                  {isProUser && (
                    <FarcasterProBadge size={20} className="mb-px" />
                  )}
                  <Tooltip
                    trigger={
                      <div className="cursor-default text-base text-faint">
                        {formatTimeAgo(cast.timestamp, 'floor')}
                      </div>
                    }
                    content={
                      <div className="px-1 text-sm text-white">
                        {new Date(cast.timestamp).toLocaleTimeString()} ·{' '}
                        {new Date(cast.timestamp).toLocaleDateString()}
                      </div>
                    }
                  />
                </div>
                {showMemberBadgeFinal && (
                  <ChannelBadge
                    label="Member"
                    color="secondary"
                    Icon={TwoPeopleIcon}
                  />
                )}
              </div>
            </div>
            {isSignedIn && <CastMenuActions cast={castWithContext} />}
          </div>
          <div className="flex flex-col whitespace-pre-wrap break-words text-lg leading-6 tracking-normal">
            {!isFirstInList && <ScrollIntoView />}
            <div>{processedText}</div>
          </div>
        </div>
        <CastAttachmentsSection
          cast={cast}
          variant="focused"
          castAttachment={castAttachment}
          nonCarouselAttachments={nonCarouselAttachments}
          hasAttachments={hasAttachments}
          hasNonCarouselAttachments={hasNonCarouselAttachments}
          needsCarousel={needsCarousel}
          carouselMaxHeight={carouselMaxHeight}
          horizontalDragScrollRef={horizontalDragScrollRef}
        />
        <FocusedCastActions castWithContext={castWithContext} />
        {channelDisallowed && (
          <div className="mb-4 px-4">
            <div className="rounded-lg p-4 bg-elevated text-faint">
              This cast is no longer in the channel.{' '}
              <ExternalLink
                href={getNotionLinkTarget({ to: 'channels' })}
                title="Learn more"
              >
                Learn more
              </ExternalLink>
            </div>
          </div>
        )}
        {isSignedIn &&
          cast.author.viewerContext?.blockedBy !== true &&
          cast.replyDisabled !== true && (
            <FocusedCastReplyTrigger
              parentCast={cast}
              parentCastContext={context}
            />
          )}
      </div>
    );
  },
);

FocusedCastContent.displayName = 'FocusedCastContent';

function FocusedCastActions({
  castWithContext,
}: {
  castWithContext: ApiCastWithContext;
}) {
  const { context, cast } = castWithContext;

  return (
    <>
      <div className="my-2 px-2">
        <div className="flex w-full flex-row items-center justify-between">
          <Replies
            cast={cast}
            isFocused
            includeReason={context.includeReason?.type}
          />
          <Recasts
            cast={cast}
            isFocused
            includeReason={context.includeReason?.type}
          />
          <Reactions
            cast={cast}
            isFocused
            includeReason={context.includeReason?.type}
          />
          {/* CastActions removed */}
          <ShareCast cast={cast} isFocused />
        </div>
      </div>
      {context.includeDetails && (
        <div className="mb-3 px-4">
          <CastDetails cast={cast} isFocused />
        </div>
      )}
    </>
  );
}

export { FocusedCast };
