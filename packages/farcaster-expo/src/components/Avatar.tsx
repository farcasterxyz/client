import { ImageErrorEventData, ImageLoadEventData } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  UnableToFollowUserError,
  useCreateFollow,
  useDeleteFollow,
  useGloballyCachedUser,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { PlusIcon } from 'lucide-react-native';
import React, { memo, useCallback, useMemo } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';

import { defaultAvatarUrl } from '../constants/Avatar';
import { defaultThumbnailDiameter } from '../constants/Images';
import { hitSlopSm } from '../constants/Pressable';
import { useRootToast, useSharedTelemetry, useTheme } from '../contexts';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getStandardizedAvatarUrl } from '../utils/ImageUtils';
import { Text } from './design-system/Text';
import { RemoteImage } from './RemoteImage';

const imageFallbackSource = { uri: defaultAvatarUrl };

export type AvatarProps = {
  diameter?: number;
  pfpUrl?: string;
  shouldFadeIn?: boolean;
  style?: ViewStyle | ViewStyle[];
  allowFollowingUser?: ApiUser;
  border?: boolean;
  skipAdditionalCDNWrap?: boolean;
  isHighlighted?: boolean;
  blockAnimated?: boolean;
  onError?: (event: ImageErrorEventData) => void;
  onLoad?: (event: ImageLoadEventData) => void;
  followCastChannel?: string;
  followCastHash?: string;
  followIncludeReason?: ApiCastFeedIncludeReason['type'];
};

const Avatar = memo(
  ({
    pfpUrl,
    diameter,
    style,
    allowFollowingUser,
    border = true,
    isHighlighted = false,
    skipAdditionalCDNWrap = false,
    blockAnimated = true,
    onError,
    onLoad,
    followCastChannel,
    followCastHash,
    followIncludeReason,
  }: AvatarProps) => {
    const t = useTheme();

    const shouldFadeIn = useMemo(
      () => blockAnimated === false,
      [blockAnimated],
    );

    const resolvedDiameter = useMemo(
      () => diameter || defaultThumbnailDiameter,
      [diameter],
    );

    const styleContainer = useMemo(
      () => [
        style,
        {
          width: resolvedDiameter,
          height: resolvedDiameter,
        },
      ],
      [style, resolvedDiameter],
    );

    const styleImage = useMemo(
      () => [t.roundedFull, border && [t.borderHairline, t.borderDefault]],
      [border, t.borderDefault, t.borderHairline, t.roundedFull],
    );

    const followUser = useMemo(() => {
      return (
        resolvedDiameter >= 24 &&
        allowFollowingUser?.viewerContext?.following === false && (
          <AvatarFollowUser
            user={allowFollowingUser}
            resolvedDiameter={resolvedDiameter}
            followCastChannel={followCastChannel}
            followCastHash={followCastHash}
            isHighlighted={isHighlighted}
            followIncludeReason={followIncludeReason}
          />
        )
      );
    }, [
      allowFollowingUser,
      followCastChannel,
      followCastHash,
      followIncludeReason,
      isHighlighted,
      resolvedDiameter,
    ]);

    const optimalPfpUrl = React.useMemo(() => {
      if (typeof pfpUrl === 'undefined') {
        return pfpUrl;
      }

      if (skipAdditionalCDNWrap) {
        return pfpUrl;
      }

      return getStandardizedAvatarUrl({
        url: pfpUrl,
        size: 'default',
      });
    }, [pfpUrl, skipAdditionalCDNWrap]);

    return (
      <View style={styleContainer}>
        <RemoteImage
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={optimalPfpUrl}
          width={resolvedDiameter}
          height={resolvedDiameter}
          uri={optimalPfpUrl}
          style={styleImage}
          fallbackSource={imageFallbackSource}
          shouldFadeIn={shouldFadeIn}
          // We covered all possible flows calling this with above optimized call to URLs
          dangerouslySkipCloudinary={true}
          onError={onError}
          onLoad={onLoad}
        />
        {followUser}
      </View>
    );
  },
);

Avatar.displayName = 'Avatar';

const AvatarFollowUser = memo(
  ({
    user: fallbackUser,
    resolvedDiameter,
    followCastChannel,
    followCastHash,
    isHighlighted = false,
    followIncludeReason,
  }: {
    user: ApiUser;
    resolvedDiameter: number;
    followCastChannel?: string;
    followCastHash?: string;
    isHighlighted?: boolean;
    followIncludeReason?: ApiCastFeedIncludeReason['type'];
  }) => {
    const currentUser = useCurrentUser();
    const user = useGloballyCachedUser({ fallback: fallbackUser });

    if (!currentUser || !currentUser.fid || currentUser.fid === user.fid) {
      return null;
    }

    return (
      <AvatarFollowUserContent
        currentUser={currentUser}
        user={user}
        resolvedDiameter={resolvedDiameter}
        followCastChannel={followCastChannel}
        followCastHash={followCastHash}
        isHighlighted={isHighlighted}
        followIncludeReason={followIncludeReason}
      />
    );
  },
);

AvatarFollowUser.displayName = 'AvatarFollowUser';

const AvatarFollowUserContent = memo(
  ({
    currentUser: fallbackCurrentUser,
    user,
    resolvedDiameter,
    followCastChannel,
    followCastHash,
    isHighlighted = false,
    followIncludeReason,
  }: {
    currentUser: ApiUser;
    user: ApiUser;
    resolvedDiameter: number;
    followCastChannel?: string;
    followCastHash?: string;
    isHighlighted?: boolean;
    followIncludeReason?: ApiCastFeedIncludeReason['type'];
  }) => {
    const { trackError } = useSharedTelemetry();
    const currentUser = useGloballyCachedUser({
      fallback: fallbackCurrentUser,
    });
    const t = useTheme();
    const createFollow = useCreateFollow();
    const deleteFollow = useDeleteFollow();
    const { trackEvent } = useTrackEvent();
    const toast = useRootToast();

    const styleTouchable = useMemo(
      () => [
        t.absolute,
        t.bottom0,
        t.right0,
        t.roundedFull,
        t.borderBackground,
        isHighlighted && { borderColor: t.colors.background.brandLight },
        {
          borderWidth: 2,
          marginRight: -4,
          marginBottom: -4,
        },
      ],
      [
        t.absolute,
        t.bottom0,
        t.right0,
        t.roundedFull,
        t.borderBackground,
        t.colors.background.brandLight,
        isHighlighted,
      ],
    );

    const stylesPerDiamater = useMemo(() => {
      return resolvedDiameter < 30
        ? { width: 12, height: 12, paddingTop: 2, paddingLeft: 2 }
        : { width: 16, height: 16, paddingTop: 2, paddingLeft: 2.25 };
    }, [resolvedDiameter]);

    const iconSize = useMemo(() => {
      return resolvedDiameter < 30 ? 8 : 12;
    }, [resolvedDiameter]);

    const hitSlop = useMemo(() => {
      return resolvedDiameter < 30
        ? { left: resolvedDiameter, top: resolvedDiameter }
        : hitSlopSm;
    }, [resolvedDiameter]);

    const styleIcon = useMemo(
      () => [
        t.roundedFull,
        stylesPerDiamater,
        {
          backgroundColor: t.colors.background.brandMedium,
        },
      ],
      [t.roundedFull, t.colors.background.brandMedium, stylesPerDiamater],
    );

    const onPress = useCallback(() => {
      try {
        trackEvent(AnalyticsEvent.AccountFollow, {
          target: user.fid,
          on: 'avatar',
          ...(followCastChannel ? { castChannel: followCastChannel } : {}),
          ...(followCastHash ? { castHash: followCastHash } : {}),
          ...(followIncludeReason
            ? {
                includeReason: followIncludeReason,
                sourceSurface: 'home_feed',
              }
            : {}),
        });

        createFollow({ followee: user, follower: currentUser });

        const followeeUsername = resolveUsername({
          username: user.username,
          fid: user.fid,
        });

        toast.hideAll();
        toast.show(
          <>
            Followed {followeeUsername}.{' '}
            <Text style={[t.fontSemibold, t.texts.brand]}>Undo</Text>
          </>,
          {
            type: 'generic',
            duration: 5000,
            placement: 'bottom',
            data: {
              onClick: async () => {
                trackEvent(AnalyticsEvent.AccountUnfollow, {
                  target: user.fid,
                  on: 'avatar',
                });

                try {
                  await deleteFollow({ followee: user, follower: currentUser });

                  toast.hideAll();
                  toast.show(`Unfollowed ${followeeUsername}`, {
                    type: 'generic',
                  });
                } catch (error) {
                  toast.show('Unable to unfollow user', { type: 'danger' });
                }
              },
            },
          },
        );
      } catch (error) {
        toast.show('Unable to follow user', { type: 'danger' });
        trackError(
          new UnableToFollowUserError({
            followerFid: currentUser.fid,
            followeeFid: user.fid,
            follow: true,
            error,
          }),
        );
      }
    }, [
      createFollow,
      currentUser,
      deleteFollow,
      followCastChannel,
      followCastHash,
      followIncludeReason,
      t,
      toast,
      trackError,
      trackEvent,
      user,
    ]);

    // Using view in view because the dark background bleeds outside the white border
    // in light mode
    return useMemo(
      () => (
        <TouchableOpacity
          activeOpacity={0.5}
          hitSlop={hitSlop}
          onPress={onPress}
          style={styleTouchable}
        >
          <View style={styleIcon}>
            <PlusIcon
              size={iconSize}
              color={t.colors.text.brand}
              strokeWidth={2.5}
            />
          </View>
        </TouchableOpacity>
      ),
      [
        iconSize,
        onPress,
        styleIcon,
        styleTouchable,
        t.colors.text.brand,
        hitSlop,
      ],
    );
  },
);
AvatarFollowUserContent.displayName = 'AvatarFollowUserContent';

export { Avatar };
