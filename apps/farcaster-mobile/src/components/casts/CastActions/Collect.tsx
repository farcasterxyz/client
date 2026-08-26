import { ApiCast, ApiCastFeedIncludeReason } from 'farcaster-client-data';
import {
  CastReactionType,
  formatShorthandNumber,
  usePrefetchUserCast,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { Avatar, Text2, useCurrentUserFid, useHaptics } from 'farcaster-expo';
import React, { memo, useCallback, useMemo } from 'react';
import { PixelRatio, Pressable, View } from 'react-native';

import { Sparkle } from '~/components/CollectibleCast/Sparkle';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const hitSlopValues = {
  left: 11,
  top: 11,
  right: 11,
  bottom: 11,
};

const deviceUsingHighFontScale = PixelRatio.getFontScale() > 1.0;

const Collect = memo(
  ({
    cast,
    hideCounts,
    includeReason,
  }: {
    cast: ApiCast;
    hideCounts?: boolean;
    includeReason?: ApiCastFeedIncludeReason;
  }) => {
    const t = useTheme();
    const navigate = useNavigate();
    const trackCastReaction = useTrackCastReaction();
    const currentFid = useCurrentUserFid();
    const prefetchUserCast = usePrefetchUserCast();
    const { triggerImpactAsync } = useHaptics();

    const collectible = cast.collectible;

    const iconProps = useMemo(() => {
      switch (collectible?.state) {
        case 'auction-active':
          if (collectible.auction.topBid.bidder.fid === currentFid) {
            return {
              color: '#43B748',
              fill: '#43B748',
            };
          }
          break;
        case 'minted':
          if (collectible.owner.user?.fid === currentFid) {
            return {
              color: '#43B748',
              fill: '#43B748',
            };
          }
          break;
        default:
          break;
      }

      return {
        color: t.colors.text.tertiary,
      };
    }, [collectible, currentFid, t.colors.text.tertiary]);

    const right = useMemo(() => {
      switch (collectible?.state) {
        case 'auction-active':
          if (collectible.auction.topBid) {
            return (
              <Text2
                size="sm"
                style={{
                  color:
                    collectible.auction.topBid.bidder.fid === currentFid
                      ? '#43B748'
                      : t.colors.text.tertiary,
                  // We are going to allow this component to grow for bigger font scales.
                  // FIXME: Ideally we handle these at the core component level in the future.
                  width: deviceUsingHighFontScale ? undefined : 35,
                }}
              >
                ${formatShorthandNumber(collectible.auction.topBid.value)}
              </Text2>
            );
          }
          break;
        case 'minted':
          return (
            <View style={{ width: 35 }}>
              <Avatar
                pfpUrl={collectible.owner.user?.pfp?.url}
                diameter={16}
                border
              />
            </View>
          );
        default:
          break;
      }

      return null;
    }, [collectible, currentFid, t.colors.text.tertiary]);

    const handlePress = useCallback(() => {
      trackCastReaction({
        castHash: cast.hash,
        castFid: cast.author.fid,
        type: CastReactionType.Collect,
        undo: false,
        ...(includeReason?.type ? { includeReason: includeReason.type } : {}),
      });

      navigate('CollectibleCast', {
        username: cast.author.username,
        castHash: cast.hash,
      });
      triggerImpactAsync();
    }, [
      trackCastReaction,
      cast.hash,
      cast.author.fid,
      cast.author.username,
      navigate,
      includeReason?.type,
      triggerImpactAsync,
    ]);

    const onPressIn = useCallback(() => {
      if (cast.author.username) {
        prefetchUserCast({
          username: cast.author.username,
          hash: cast.hash.slice(0, 10),
        });
      }
    }, [prefetchUserCast, cast.author.username, cast.hash]);

    const showRightSection = !hideCounts || collectible?.state === 'minted';

    if (!collectible) {
      return null;
    }

    return (
      <>
        <Pressable
          hitSlop={hitSlopValues}
          style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
          onPress={handlePress}
          onPressIn={onPressIn}
        >
          <Sparkle size={16} {...iconProps} />
          {showRightSection && right}
        </Pressable>
      </>
    );
  },
);

Collect.displayName = 'Collect';

export { Collect };
