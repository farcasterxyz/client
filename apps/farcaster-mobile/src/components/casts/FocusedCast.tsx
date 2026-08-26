import { openBrowserAsync } from 'expo-web-browser';
import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiCastFeedItemTopHat,
} from 'farcaster-client-data';
import {
  CastLinkHelpersProvider,
  getNotionLinkTarget,
  resolveUsernameShort,
  ShowMoreInfo,
  ThreadPosition,
} from 'farcaster-client-hooks';
import { Avatar, Text2, TextWithPress } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';

import { ButtonGroupOption } from '~/components/ButtonGroup';
import { Sparkle } from '~/components/CollectibleCast/Sparkle';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useCastTranslationDisplay } from '~/hooks/useCastTranslationDisplay';

import { CastActionsBar } from './CastActions/CastActionsBar';
import { CastBodyWithAttachments } from './CastBodyWithAttachments';
import { CastContainer } from './CastContainer';
import { CastDetails } from './CastDetails';
import { CastTranslationTopHat } from './CastTranslationTopHat';

type FocusedCastProps = {
  // Cast props
  cast: ApiCast;
  hideActions?: boolean;
  isFocusedCast?: boolean;
  omitReplyingTo?: boolean;
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
};

function FocusedCast(props: FocusedCastProps) {
  const t = useTheme();

  const {
    cast,
    isFocusedCast = false,
    threadPosition,
    avatarDiameter,
    hideBottomBorder = false,
    castAvatar,
    castUsernameAndTimestamp,
    castMenuActions,
  } = props;

  const {
    hash,
    threadHash,
    author: { fid },
    replies: { count: replyCount },
    reactions: { count: reactionCount },
    recasts: { count: recastCount },
    bookmarkCount,
    viewCount,
    quoteCount,
    warpsTipped,
  } = cast;

  const styleContainer = React.useMemo(
    () => [
      t.flexRow,
      t.pX1,
      t.itemsStart,
      t.relative,
      threadHash === hash && t.pT2,
    ],
    [hash, t.flexRow, t.itemsStart, t.pT2, t.pX1, t.relative, threadHash],
  );

  const styleHeaderContainer = React.useMemo(
    () => [t.flexCol, t.flexGrow, t.flexShrink, { marginLeft: 8 }],
    [t.flexCol, t.flexGrow, t.flexShrink],
  );

  const styleHeader = React.useMemo(
    () => [t.flexRow, t.itemsStart, t.mB2],
    [t.flexRow, t.itemsStart, t.mB2],
  );

  const styleNamesContainer = React.useMemo(
    () => [t.flexCol, t.flex1, t.mL2, t.wFull],
    [t.flex1, t.flexCol, t.mL2, t.wFull],
  );

  const onLearnMorePress = React.useCallback(() => {
    openBrowserAsync(getNotionLinkTarget({ to: 'channels' }), {
      dismissButtonStyle: 'close',
      readerMode: false,
    });
  }, []);

  const {
    displayText,
    hasTranslation,
    isTranslationPending,
    showOriginal,
    sourceLanguageName,
    toggleLabel,
    toggleTranslation,
  } = useCastTranslationDisplay(cast);

  const castFooter = React.useMemo(() => {
    if (props.hideActions) {
      return null;
    }

    return (
      <View style={[t.flex1, { marginTop: 20 }]}>
        <CastActionsBar
          cast={cast}
          hideCounts={isFocusedCast}
          shouldShowCastBookmarkAction={false}
          includeReason={props.includeReason}
          likeCount={reactionCount}
          recastCount={recastCount}
          replyCount={replyCount}
          isFocusedCast={isFocusedCast}
        />
      </View>
    );
  }, [
    cast,
    isFocusedCast,
    props.hideActions,
    props.includeReason,
    reactionCount,
    recastCount,
    replyCount,
    t.flex1,
  ]);

  const castBodyContent = React.useMemo(
    () => (
      <>
        <CastBodyWithAttachments
          cast={cast}
          variant="focused"
          castText={displayText}
          skipTruncate
          omitReplyingTo={!!props.omitReplyingTo}
        />
        <View style={[{ marginHorizontal: 14 }]}>{castFooter}</View>
        {!props.partOfTheDisabledThread && isFocusedCast && (
          <View style={[{ marginHorizontal: 14, marginBottom: 12 }]}>
            <CastDetails
              fid={fid}
              hash={hash}
              isFocusedCast={isFocusedCast}
              replyCount={replyCount}
              reactionCount={reactionCount}
              recastCount={recastCount}
              topBidValue={
                cast.collectible?.state === 'auction-active'
                  ? cast.collectible.auction?.topBid?.value
                  : undefined
              }
              finalBid={cast.collectible?.state === 'minted'}
              bookmarkCount={bookmarkCount || 0}
              viewCount={viewCount}
              quoteCount={quoteCount || 0}
              warpsTipped={warpsTipped || 0}
              includeReason={props.includeReason}
              client={cast.client}
              timestamp={cast.timestamp}
            />
          </View>
        )}
        {props.channelDisallowed && isFocusedCast && (
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
              t.p4,
              t.bgElevated,
              t.mT1,
              t.mB3,
              t.roundedLg,
            ]}
          >
            <Text2 style={[t.texts.tertiary]}>
              This cast is no longer in the channel.{' '}
              <TextWithPress style={[t.texts.brand]} onPress={onLearnMorePress}>
                Learn more
              </TextWithPress>
            </Text2>
          </View>
        )}
      </>
    ),
    [
      bookmarkCount,
      cast,
      castFooter,
      displayText,
      fid,
      hash,
      isFocusedCast,
      onLearnMorePress,
      props.channelDisallowed,
      props.includeReason,
      props.omitReplyingTo,
      props.partOfTheDisabledThread,
      quoteCount,
      reactionCount,
      recastCount,
      replyCount,
      t.bgElevated,
      t.flex,
      t.flexRow,
      t.itemsCenter,
      t.justifyBetween,
      t.mB3,
      t.mT1,
      t.p4,
      t.roundedLg,
      t.texts.brand,
      t.texts.tertiary,
      t.wFull,
      viewCount,
      warpsTipped,
    ],
  );

  return (
    <CastLinkHelpersProvider screenCastHash={cast.hash}>
      <CastContainer
        hash={hash}
        isFocusedCast={isFocusedCast}
        threadPosition={threadPosition}
        hideBottomBorder={hideBottomBorder}
        isAdminGatedFeedCast={props.isAdminGatedFeedCast}
      >
        {(hasTranslation || isTranslationPending) && (
          <CastTranslationTopHat
            avatarDiameter={avatarDiameter}
            isPending={isTranslationPending}
            sourceLanguageName={sourceLanguageName}
            showOriginal={showOriginal}
            toggleLabel={toggleLabel}
            onToggle={toggleTranslation}
          />
        )}
        {threadHash !== hash && !props.partOfTheDisabledThread && (
          <View
            style={[
              {
                flexDirection: 'row',
                height: 12,
                paddingLeft: 12,
              },
            ]}
          >
            <View style={{ width: avatarDiameter }}>
              <View
                style={[
                  {
                    width: 2,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    flexGrow: 1,
                    backgroundColor: t.colors.feed.threadLine,
                    borderRadius: 0,
                    borderBottomRightRadius: 16,
                    borderBottomLeftRadius: 16,
                    marginBottom: 4,
                  },
                ]}
              />
            </View>
          </View>
        )}
        <View style={styleContainer}>
          <View style={styleHeaderContainer}>
            <View style={styleHeader}>
              {castAvatar}
              <View style={styleNamesContainer}>
                {castUsernameAndTimestamp}
              </View>
              {castMenuActions}
            </View>
          </View>
        </View>
        {castBodyContent}
      </CastContainer>
    </CastLinkHelpersProvider>
  );
}

export function CollectibleSection({
  cast,
  username,
}: {
  cast: ApiCast;
  username: string;
}) {
  const t = useTheme();
  const push = usePush();

  const collectible = cast.collectible;

  const openCollectible = useCallback(() => {
    push('CollectibleCast', {
      username,
      castHash: cast.hash,
    });
  }, [push, username, cast.hash]);

  if (!collectible) {
    return null;
  }

  if (collectible.state === 'auction-pending') {
    return (
      <Pressable
        style={[t.itemsCenter, { paddingVertical: 6 }]}
        onPress={openCollectible}
      >
        <View
          style={[
            t.wFull,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.bgLightGray,
            t.texts.success,
            {
              gap: 6,
              paddingHorizontal: 12,
              height: 30,
              borderRadius: 16,
            },
          ]}
        >
          <Sparkle
            color={t.colors.text.secondary}
            fill={t.colors.text.secondary}
            size={16}
          />
          <Text2 color="secondary" weight="medium" size="sm">
            Collect this cast
          </Text2>
        </View>
      </Pressable>
    );
  }

  if (collectible.state === 'auction-active') {
    return (
      <Pressable
        style={[t.itemsCenter, { paddingVertical: 6 }]}
        onPress={openCollectible}
      >
        <View
          style={[
            t.wFull,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.bgLightGray,
            t.texts.success,
            {
              gap: 6,
              paddingHorizontal: 12,
              height: 30,
              borderRadius: 16,
            },
          ]}
        >
          <Avatar
            pfpUrl={collectible.auction?.topBid?.bidder.pfp?.url}
            diameter={16}
          />
          <Text2>
            <Text2 weight="medium" size="sm">
              {resolveUsernameShort(collectible.auction?.topBid.bidder)}{' '}
            </Text2>
            <Text2 color="secondary" size="sm">
              bid on this cast
            </Text2>
          </Text2>
        </View>
      </Pressable>
    );
  }

  if (collectible.state === 'minted') {
    return (
      <Pressable
        style={[t.itemsCenter, { paddingVertical: 6 }]}
        onPress={openCollectible}
      >
        <View
          style={[
            t.wFull,
            t.flexRow,
            t.itemsCenter,
            t.justifyCenter,
            t.bgLightGray,
            t.texts.success,
            {
              gap: 6,
              paddingHorizontal: 12,
              height: 30,
              borderRadius: 16,
            },
          ]}
        >
          <Avatar pfpUrl={collectible.owner.user?.pfp?.url} diameter={16} />
          <Text2>
            <Text2 weight="medium" size="sm">
              {collectible.owner.user?.username}{' '}
            </Text2>
            <Text2 color="secondary" size="sm">
              collected this cast
            </Text2>
          </Text2>
        </View>
      </Pressable>
    );
  }

  return null;
}

export { FocusedCast };
