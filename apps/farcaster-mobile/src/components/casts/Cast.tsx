import {
  ApiCast,
  ApiCastFeedIncludeReason,
  ApiCastFeedItemTopHat,
} from 'farcaster-client-data';
import {
  EventingProvider,
  ShowMoreInfo,
  ThreadPosition,
  useCastHasBlockedUrl,
  useGloballyCachedCast,
  useTrackCastClick,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { ButtonGroupOption } from '~/components/ButtonGroup';
import { KebabIcon } from '~/components/icons/KebabIcon';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUserLevel } from '~/hooks/data/useUserLevel';

import { BlockedByDomainPlaceholder } from './BlockedByDomainPlaceholder';
import { MoreCastActionsBottomSheet } from './CastActions/MoreCastActionsBottomSheet';
import { CastAvatar } from './CastAvatar';
import { CastUsernameAndTimestamp } from './CastUsernameAndTimestamp';
import { DeletedCast } from './DeletedCast';
import { FocusedCast } from './FocusedCast';
import { UnfocusedCast } from './UnfocusedCast';

type CastProps = {
  cast: ApiCast;
  hideActions?: boolean;
  isFocusedCast?: boolean;
  omitReplyingTo?: boolean;
  omitReplyingToPostfix?: boolean;
  prefixReplyingToWithYou?: boolean;
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
  parentCastText?: string;
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
  expandByDefault?: boolean;
  index?: number;
  castOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
};

const Cast = memo(({ cast, ...props }: CastProps) => {
  useTrackCastClick();
  const castHasBlockedUrl = useCastHasBlockedUrl();
  const isAdmin = useIsAdmin();

  if (cast.deleted) {
    return <DeletedCast />;
  }

  if (castHasBlockedUrl(cast)) {
    // Show admins a placeholder so they can verify the block landed and audit
    // what's being hidden. Non-admins see nothing — the cast is hidden.
    return isAdmin ? <BlockedByDomainPlaceholder /> : null;
  }

  return (
    <EventingProvider
      castHash={cast.hash}
      castChannel={cast.channel?.key}
      castViewIncludeReason={props.includeReason?.type}
      castViewIndex={props.index}
      castViewAuthorFid={cast.author.fid}
    >
      <CastContentForFeedOrFocused cast={cast} {...props} />
    </EventingProvider>
  );
});

Cast.displayName = 'Cast';

const CastContentForFeedOrFocused = memo((props: CastProps) => {
  const {
    cast: fallbackCast,
    isFocusedCast = false,
    omitMenuActions = false,
    showChannelTags = true,
    avatarDiameter,
    isPinned,
    includeReason,
    partOfTheDisabledThread = false,
    showMemberBadge,
    hideTimestamp = false,
    isHighlighted = false,
    additionalModerationOptions = undefined,
  } = props;

  const t = useTheme();
  const isAdmin = useIsAdmin();

  const cast = useGloballyCachedCast({ fallback: fallbackCast });

  const {
    author: { fid, username, pfp },
    castType,
    timestamp,
  } = cast;

  const forceHideTimestamp = React.useMemo(() => {
    return hideTimestamp || isFocusedCast;
  }, [hideTimestamp, isFocusedCast]);

  const embedOnlyCast = React.useMemo(() => {
    return castType === 'root-embed';
  }, [castType]);

  const castAvatar = useMemo(
    () =>
      !embedOnlyCast ? (
        <CastAvatar
          avatarDiameter={avatarDiameter}
          user={cast.author}
          followCastChannel={cast.channel?.key}
          followCastHash={cast.hash}
          followIncludeReason={props.castOpenIncludeReason}
          isHighlighted={isHighlighted}
          profileOpenIncludeReason={props.castOpenIncludeReason}
        />
      ) : (
        <Avatar
          diameter={avatarDiameter}
          pfpUrl={pfp?.url}
          allowFollowingUser={cast.author}
          followCastChannel={cast.channel?.key}
          followCastHash={cast.hash}
          followIncludeReason={props.castOpenIncludeReason}
          isHighlighted={isHighlighted}
        />
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fid is the stable identity
    [
      avatarDiameter,
      cast.author.fid,
      cast.channel?.key,
      cast.hash,
      embedOnlyCast,
      pfp?.url,
      isHighlighted,
      props.castOpenIncludeReason,
    ],
  );

  const showMemberBadgeFinal =
    showMemberBadge &&
    cast.channel &&
    cast.channel.authorContext?.role &&
    cast.channel.authorContext.role !== 'none';

  const isProUser = useUserLevel(cast.author) === 'pro';

  const castUsernameAndTimestamp = useMemo(() => {
    if (embedOnlyCast) {
      return null;
    }

    return (
      <CastUsernameAndTimestamp
        fid={fid}
        isProUser={isProUser}
        username={username}
        timestamp={timestamp}
        isFocusedCast={isFocusedCast}
        showMemberBadge={showMemberBadgeFinal}
        channel={showChannelTags ? cast.channel : undefined}
        hideTimestamp={forceHideTimestamp}
        profileOpenIncludeReason={props.castOpenIncludeReason}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the stable identity
  }, [
    cast.channel?.key,
    embedOnlyCast,
    fid,
    forceHideTimestamp,
    isFocusedCast,
    isProUser,
    props.castOpenIncludeReason,
    showChannelTags,
    showMemberBadgeFinal,
    timestamp,
    username,
  ]);

  // pT3/pR3 fold the paddings of the two wrapper Views this pressable used to
  // contain (pT2 + pT1 = pT3); fewer native views per cast cell.
  const stylePressable = useMemo(
    () => [t.h11, t.w11, t.flex, t.justifyStart, t.pT3, t.pR3, t.itemsEnd],
    [t.flex, t.h11, t.itemsEnd, t.justifyStart, t.pR3, t.pT3, t.w11],
  );

  const [showMoreCastActionsBottomSheet, setShowMoreCastActionsBottomSheet] =
    useState(false);

  const handleShowMenu = useCallback(
    () => setShowMoreCastActionsBottomSheet(true),
    [],
  );

  const castMenuActions = useMemo(() => {
    if (omitMenuActions) {
      return null;
    }

    return (
      <>
        <Pressable style={stylePressable} onPress={handleShowMenu}>
          <KebabIcon size={16} color={t.colors.text.tertiary} />
        </Pressable>
        {showMoreCastActionsBottomSheet && (
          <MoreCastActionsBottomSheet
            cast={cast}
            isPinned={isPinned}
            includeReason={includeReason}
            additionalModerationOptions={additionalModerationOptions}
            onDismiss={() => setShowMoreCastActionsBottomSheet(false)}
          />
        )}
      </>
    );
  }, [
    omitMenuActions,
    handleShowMenu,
    stylePressable,
    t,
    showMoreCastActionsBottomSheet,
    cast,
    isPinned,
    includeReason,
    additionalModerationOptions,
  ]);

  if (isFocusedCast) {
    return (
      <FocusedCast
        {...props}
        cast={cast}
        isAdminGatedFeedCast={isAdmin && props.isAdminGatedFeedCast}
        embedOnlyCast={embedOnlyCast}
        castAvatar={castAvatar}
        castUsernameAndTimestamp={castUsernameAndTimestamp}
        castMenuActions={castMenuActions}
        hideBottomBorder={
          partOfTheDisabledThread ? true : props.hideBottomBorder
        }
        avatarDiameter={avatarDiameter || defaultThumbnailDiameter}
      />
    );
  }

  return (
    <UnfocusedCast
      {...props}
      cast={cast}
      isAdminGatedFeedCast={isAdmin && props.isAdminGatedFeedCast}
      embedOnlyCast={embedOnlyCast}
      castAvatar={castAvatar}
      castUsernameAndTimestamp={castUsernameAndTimestamp}
      castMenuActions={castMenuActions}
      isHighlighted={isHighlighted}
      avatarDiameter={avatarDiameter || defaultThumbnailDiameter}
    />
  );
});

CastContentForFeedOrFocused.displayName = 'CastContentForFeedOrFocused';

export { Cast };
