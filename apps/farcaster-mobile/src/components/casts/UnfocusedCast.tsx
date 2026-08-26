import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiCastFeedItemTopHat,
} from 'farcaster-client-data';
import {
  CastLinkHelpersProvider,
  ShowMoreInfo,
  ThreadPosition,
} from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ButtonGroupOption } from '~/components/ButtonGroup';
import { FeedItemTopHat } from '~/components/casts/FeedItemTopHat';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCastBody } from '~/hooks/useCastBody';
import { useCastTranslationDisplay } from '~/hooks/useCastTranslationDisplay';
import { shouldShowCastReplyingTo } from '~/utils/CastUtils';

import { CastActionsBar } from './CastActions/CastActionsBar';
import { CastAttachmentsSection } from './CastAttachmentsSection';
import { FeedCastBody } from './CastBody';
import {
  CastContainer,
  PressableTargetToNavigateToCast,
  TapOnCastGestureHandler,
} from './CastContainer';
import { CastReplyingTo } from './CastReplyingTo';
import { CastTranslationTopHat } from './CastTranslationTopHat';
import { IncludeReasonTopHat } from './IncludeReasonTopHat';

type UnfocusedCastProps = {
  // Cast props
  cast: ApiCast;
  hideActions?: boolean;
  isFocusedCast?: boolean;
  expandByDefault?: boolean;
  omitReplyingTo?: boolean;
  omitReplyingToPostfix?: boolean;
  omitMenuActions?: boolean;
  onThreadView?: boolean;
  shouldHideRecastLabel?: boolean;
  showMoreInfo?: ShowMoreInfo;
  threadPosition?: ThreadPosition;
  includeReason?: ApiCastFeedIncludeReason;
  showChannelTags?: boolean;
  avatarDiameter?: number;
  hideBottomBorder?: boolean;
  isPinned?: boolean;
  renderBookmarkActionInline?: boolean;
  topHat?: ApiCastFeedItemTopHat;
  skipShowMoreCTA?: boolean;
  partOfTheDisabledThread?: boolean;
  channelDisallowed?: boolean;
  showMemberBadge?: boolean;
  hideTimestamp?: boolean;
  isHighlighted?: boolean;
  isAdminGatedFeedCast?: boolean;
  additionalModerationOptions?: ButtonGroupOption[];
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];

  // Extras
  embedOnlyCast: boolean;
  castAvatar: React.ReactNode;
  castUsernameAndTimestamp: React.ReactNode;
  castMenuActions: React.ReactNode;
  isAppsDialog?: boolean;
  onBeforeAction?: () => void;
  onMiniAppLaunch?: () => void;
};

function UnfocusedCast(props: UnfocusedCastProps) {
  const t = useTheme();

  const {
    cast,
    isFocusedCast = false,
    threadPosition,
    avatarDiameter,
    hideBottomBorder = false,
    isPinned,
    castAvatar,
    castUsernameAndTimestamp,
    castMenuActions,
    topHat,
    isHighlighted = false,
    omitReplyingTo = false,
    isAppsDialog = false,
    onBeforeAction,
    onMiniAppLaunch,
  } = props;

  const {
    hash,
    replies: { count: replyCount },
    reactions: { count: reactionCount },
    recasts: { count: recastCount },
  } = cast;

  const shouldRenderThreadLineStart = React.useMemo(() => {
    return (
      typeof threadPosition !== 'undefined' &&
      threadPosition !== 'start_and_end' &&
      threadPosition !== 'end_continuous' &&
      threadPosition !== 'end_disconnected'
    );
  }, [threadPosition]);

  const shouldAllowHigherTopPadding = React.useMemo(() => {
    return (
      threadPosition !== 'create_cast_inline_replying_to' &&
      threadPosition !== 'end_continuous' &&
      threadPosition !== 'end_disconnected' &&
      threadPosition !== 'middle' &&
      threadPosition !== 'middle_with_show_more'
    );
  }, [threadPosition]);

  const styleNamesContainer = React.useMemo(
    () => [
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.wFull,
      t.justifyBetween,
      t.relative,
      t.overflowHidden,
      // isAppsDialog && t.mL4,
    ],
    [
      // isAppsDialog,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.justifyBetween,
      // t.mL4,
      t.overflowHidden,
      t.relative,
      t.wFull,
    ],
  );

  const stylePressableMenuActions = React.useMemo(
    () => [t.absolute, t.itemsCenter, t.selfCenter, t.flex, t.top0, t.right0],
    [t.absolute, t.flex, t.itemsCenter, t.right0, t.selfCenter, t.top0],
  );

  const styleDisplayNameBadgeContainer = React.useMemo(
    () => [t.flex, t.flexRow, t.flexGrow, t.mR6],
    [t.flex, t.flexGrow, t.flexRow, t.mR6],
  );

  const names = React.useMemo(() => {
    return (
      <View style={styleDisplayNameBadgeContainer}>
        {castUsernameAndTimestamp}
      </View>
    );
  }, [castUsernameAndTimestamp, styleDisplayNameBadgeContainer]);

  const showReplyLabel = React.useMemo(
    () =>
      shouldShowCastReplyingTo({
        cast,
        isFocusedCast,
        omitReplyingTo,
      }),
    [cast, isFocusedCast, omitReplyingTo],
  );

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
    castText,
    bodyWithLinks,
    isTruncatedCastText,
    setTruncateDisabled,
    castAttachment,
    needsCarousel,
    carouselMaxHeight,
    carouselItemWidth,
    preCarouselAttachments,
    nonCarouselAttachments,
    hasAttachments,
    hasPreCarouselAttachments,
    hasNonCarouselAttachments,
  } = useCastBody({
    cast,
    castText: displayText,
    isFocusedCast,
    skipTruncate: props.expandByDefault || false,
    composerMode: threadPosition === 'create_cast_inline_replying_to',
    onMiniAppLaunch: isAppsDialog ? onMiniAppLaunch : undefined,
  });

  const onShowMorePressForCastInFeed = React.useCallback(() => {
    setTruncateDisabled(true);
  }, [setTruncateDisabled]);

  const castFooter = React.useMemo(() => {
    if (props.hideActions) {
      return null;
    }

    return (
      <View style={[t.flex1, t.mT3]}>
        <CastActionsBar
          cast={cast}
          hideCounts={false}
          shouldShowCastBookmarkAction={false}
          includeReason={props.includeReason}
          likeCount={reactionCount}
          recastCount={recastCount}
          replyCount={replyCount}
          isFocusedCast={isFocusedCast}
          onBeforeAction={onBeforeAction}
        />
      </View>
    );
  }, [
    cast,
    isFocusedCast,
    onBeforeAction,
    props.hideActions,
    props.includeReason,
    reactionCount,
    recastCount,
    replyCount,
    t.flex1,
    t.mT3,
  ]);

  const castBodyContent = React.useMemo(
    () => (
      <>
        {showReplyLabel && <CastReplyingTo cast={cast} />}
        <FeedCastBody
          key={cast.hash}
          bodyWithLinks={bodyWithLinks}
          isFocusedCast={false}
          isTruncatedCastText={isTruncatedCastText}
          onShowMorePress={onShowMorePressForCastInFeed}
          skipShowMoreCTA={!!props.skipShowMoreCTA}
        />
      </>
    ),
    [
      bodyWithLinks,
      cast,
      isTruncatedCastText,
      onShowMorePressForCastInFeed,
      props.skipShowMoreCTA,
      showReplyLabel,
    ],
  );

  const includeReasonTopHatType = React.useMemo(() => {
    if (props.includeReason?.type === 'evergreen-following-author') {
      return 'evergreen-following-author';
    }

    if (props.includeReason?.type === 'high-quality-unfollowed') {
      return 'high-quality-unfollowed';
    }

    return null;
  }, [props.includeReason?.type]);

  const shouldShowInteractionTopHat = React.useMemo(() => {
    return !includeReasonTopHatType && !!topHat;
  }, [includeReasonTopHatType, topHat]);

  const shouldRenderFeedItemTopHat = React.useMemo(() => {
    return shouldShowInteractionTopHat || isPinned || !!cast.pinned;
  }, [cast.pinned, isPinned, shouldShowInteractionTopHat]);

  return (
    <CastLinkHelpersProvider screenCastHash={undefined}>
      <CastContainer
        hash={hash}
        isFocusedCast={isFocusedCast}
        threadPosition={threadPosition}
        hideBottomBorder={hideBottomBorder}
        isAdminGatedFeedCast={props.isAdminGatedFeedCast}
      >
        {includeReasonTopHatType && (
          <IncludeReasonTopHat
            avatarDiameter={avatarDiameter}
            includeReasonType={includeReasonTopHatType}
          />
        )}
        {/* FeedItemTopHat references a route on nav stack but composer renders are not part of it. */}
        {threadPosition !== 'create_cast_inline_replying_to' &&
          shouldRenderFeedItemTopHat && (
            <FeedItemTopHat
              avatarDiameter={avatarDiameter}
              isPinnedToChannel={isPinned}
              isPinnedToProfile={cast.pinned}
              topHat={topHat}
            />
          )}
        {(hasTranslation || isTranslationPending) && (
          <CastTranslationTopHat
            avatarDiameter={avatarDiameter}
            isPending={isTranslationPending}
            sourceLanguageName={sourceLanguageName}
            showOriginal={showOriginal}
            toggleLabel={toggleLabel}
            onToggle={toggleTranslation}
            reserveMenuActionSpace={!!castMenuActions}
          />
        )}
        <View
          style={[
            t.relative,
            t.flexCol,
            t.itemsStart,
            shouldAllowHigherTopPadding ? t.pT3 : t.pT1,
            isHighlighted && t.bgCastHighlight,
          ]}
        >
          <View
            style={[
              t.relative,
              t.flex,
              t.flexCol,
              t.absolute,
              t.top0,
              t.mX3,
              shouldAllowHigherTopPadding ? t.mT3 : t.mT1,
              t.hFull,
              {
                width: props.avatarDiameter,
                // FIXME: Hate that we have to z-index our way for this absolute rendered avatar & threadline section
                zIndex: 1,
              },
            ]}
          >
            {castAvatar}
            {shouldRenderThreadLineStart && (
              <View
                style={[
                  t.relative,
                  t.z0,
                  {
                    width: 2,
                    flexGrow: 1,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    backgroundColor: t.colors.feed.threadLine,
                    borderRadius: 16,
                    marginTop: 4,
                  },
                ]}
              />
            )}
            <PressableTargetToNavigateToCast
              castOpenIncludeReason={props.castOpenIncludeReason}
              hash={hash}
              style={[{ marginTop: props.avatarDiameter || 0 }]}
              // NEYN-11640: tagged only on the avatar-column instance
              // (not the bottom-row one in this same component, nor the
              // CastAttachmentsSection instances) so Maestro's `index:`
              // sequence is one entry per visible feed cast in tree
              // order. The flows tap `index: 1` to skip the topmost
              // cast — see flows/feed/tap-first-cast.yaml for the
              // rationale (off-screen iOS RN FlatList rows + short
              // ntestn-authored top casts whose avatar hitSlop on
              // Android can swallow the tap-target's bounds).
              testID="cast-tap-target"
            />
          </View>
          <View style={[t.relative, t.flex, t.flexRow, t.itemsCenter, t.mR3]}>
            <View
              style={[
                {
                  width: isAppsDialog
                    ? (props.avatarDiameter || 0) + 60
                    : (props.avatarDiameter || 0) + 24,
                },
              ]}
              pointerEvents="box-none"
            />
            <TapOnCastGestureHandler
              castOpenIncludeReason={props.castOpenIncludeReason}
              hash={hash}
            >
              <View style={styleNamesContainer}>{names}</View>
              {castBodyContent}
            </TapOnCastGestureHandler>
          </View>
          <CastAttachmentsSection
            cast={cast}
            variant="feed"
            castText={castText}
            castAttachment={castAttachment}
            preCarouselAttachments={preCarouselAttachments}
            nonCarouselAttachments={nonCarouselAttachments}
            needsCarousel={needsCarousel}
            carouselMaxHeight={carouselMaxHeight}
            carouselItemWidth={carouselItemWidth}
            hasAttachments={hasAttachments}
            hasPreCarouselAttachments={hasPreCarouselAttachments}
            hasNonCarouselAttachments={hasNonCarouselAttachments}
            avatarDiameter={avatarDiameter}
            isAppsDialog={isAppsDialog}
            castOpenIncludeReason={props.castOpenIncludeReason}
          />
          <View
            style={[
              t.relative,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.wFull,
              t.mB3,
              { paddingLeft: isAppsDialog ? 36 : 0 },
              { paddingRight: isAppsDialog ? 16 : 12 },
            ]}
          >
            <View
              style={[
                t.relative,
                t.hFull,
                { width: (avatarDiameter || 0) + 24 },
              ]}
            >
              <PressableTargetToNavigateToCast
                castOpenIncludeReason={props.castOpenIncludeReason}
                hash={hash}
              />
            </View>
            {castFooter}
          </View>
        </View>
        <Pressable style={stylePressableMenuActions}>
          {castMenuActions}
        </Pressable>
      </CastContainer>
    </CastLinkHelpersProvider>
  );
}

export { UnfocusedCast };
