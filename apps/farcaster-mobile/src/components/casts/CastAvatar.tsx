import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { ApiCastFeedIncludeReason, ApiUser } from 'farcaster-client-data';
import {
  CastClickType,
  useTrackCastClick,
  useUserLinkHelpers,
} from 'farcaster-client-hooks';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { SimplerRemoteImage } from '~/components/SimplerRemoteImage';
import { defaultAvatarUrl } from '~/constants/Avatar';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { getStandardizedAvatarUrl } from '~/utils/ImageUtils';

type CastAvatarProps = {
  user: ApiUser;
  avatarDiameter: number | undefined;
  disabled?: boolean;
  shouldFadeIn?: boolean;
  allowQuickFollows?: boolean;
  useSimplerRemoteImageBase?: boolean;
  isHighlighted?: boolean;
  followCastChannel?: string;
  followCastHash?: string;
  followIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
};

const CastAvatar = memo(
  ({
    user,
    avatarDiameter = undefined,
    disabled = false,
    shouldFadeIn = true,
    allowQuickFollows = false,
    useSimplerRemoteImageBase = false,
    isHighlighted = false,
    followCastChannel,
    followCastHash,
    followIncludeReason,
    profileOpenIncludeReason,
  }: CastAvatarProps) => {
    const t = useTheme();

    const { shouldLinkToUser } = useUserLinkHelpers();
    const trackCastClick = useTrackCastClick();

    const pushToUserProfile = usePushToUserProfile();

    const diameter = useMemo(
      () => avatarDiameter || defaultThumbnailDiameter,
      [avatarDiameter],
    );

    const linkToUser = useMemo(
      () => shouldLinkToUser({ fid: user.fid }),
      [shouldLinkToUser, user.fid],
    );

    const onPress = useCallback(() => {
      if (linkToUser) {
        trackCastClick({ type: CastClickType.Author });

        pushToUserProfile({
          fid: user.fid,
          ...(profileOpenIncludeReason
            ? { profileOpenIncludeReason: profileOpenIncludeReason }
            : {}),
        });
      }
    }, [
      linkToUser,
      profileOpenIncludeReason,
      pushToUserProfile,
      trackCastClick,
      user.fid,
    ]);

    const pfpUrl = useMemo(() => {
      if (typeof user.pfp === 'undefined') {
        return defaultAvatarUrl;
      }

      return getStandardizedAvatarUrl({
        url: user.pfp?.url,
        size: 'default',
      });
    }, [user.pfp]);

    const commonAvatarStyle = React.useMemo(
      () => [t.borderDefault, t.borderHairline, t.roundedFull],
      [t.borderDefault, t.borderHairline, t.roundedFull],
    );

    return useMemo(() => {
      if (linkToUser && !allowQuickFollows) {
        return (
          <Pressable
            hitSlop={hitSlop}
            onPress={onPress}
            pointerEvents={disabled ? 'none' : 'auto'}
          >
            {useSimplerRemoteImageBase ? (
              <SimplerRemoteImage
                key={user.fid}
                height={diameter}
                uri={pfpUrl}
                width={diameter}
                style={commonAvatarStyle}
              />
            ) : (
              <Avatar
                key={user.fid}
                diameter={diameter}
                pfpUrl={pfpUrl}
                allowFollowingUser={linkToUser && !disabled ? user : undefined}
                followCastChannel={followCastChannel}
                followCastHash={followCastHash}
                followIncludeReason={followIncludeReason}
                shouldFadeIn={shouldFadeIn}
                skipAdditionalCDNWrap={true}
                isHighlighted={isHighlighted}
                onError={(error) => {
                  DdRum.addAction(
                    RumActionType.CUSTOM,
                    'image-failed-to-load-on-feed',
                    { error, imageUrl: pfpUrl },
                  );
                }}
              />
            )}
            {/* <AvatarFallback diameter={diameter} /> */}
          </Pressable>
        );
      }

      // need something like, <WaitUntilViewable fallback={<AvatarFallback/>}><Avatar {...} /></WaitUntilViewable>
      // return <AvatarFallback diameter={diameter} />;
      return useSimplerRemoteImageBase ? (
        <SimplerRemoteImage
          key={user.fid}
          height={diameter}
          uri={pfpUrl}
          width={diameter}
          style={commonAvatarStyle}
        />
      ) : (
        <Avatar
          key={user.fid}
          diameter={diameter}
          pfpUrl={pfpUrl}
          allowFollowingUser={
            linkToUser && (!disabled || allowQuickFollows) ? user : undefined
          }
          followCastChannel={followCastChannel}
          followCastHash={followCastHash}
          followIncludeReason={followIncludeReason}
          skipAdditionalCDNWrap={true}
          isHighlighted={isHighlighted}
          onError={(error) => {
            DdRum.addAction(
              RumActionType.CUSTOM,
              'image-failed-to-load-on-feed',
              { error, imageUrl: pfpUrl },
            );
          }}
        />
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps -- fid is the stable identity
    }, [
      allowQuickFollows,
      commonAvatarStyle,
      diameter,
      disabled,
      followCastChannel,
      followCastHash,
      followIncludeReason,
      isHighlighted,
      linkToUser,
      onPress,
      pfpUrl,
      shouldFadeIn,
      useSimplerRemoteImageBase,
      user.fid,
    ]);
  },
);
CastAvatar.displayName = 'CastAvatar';

const AvatarFallback = memo(
  ({ diameter: avatarDiameter }: { diameter?: number }) => {
    const diameter = avatarDiameter || defaultThumbnailDiameter;
    return (
      <View
        style={{
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: 'rgba(0,0,0,0.1)',
        }}
      />
    );
  },
);
AvatarFallback.displayName = 'AvatarFallback';

export { CastAvatar };
