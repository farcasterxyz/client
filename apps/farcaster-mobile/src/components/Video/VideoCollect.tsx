import { ApiCast } from 'farcaster-client-data';
import {
  CastReactionType,
  formatShorthandNumber,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import { Text2, useCurrentUserFid } from 'farcaster-expo';
import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { Sparkle } from '~/components/CollectibleCast/Sparkle';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type VideoCollectProps = {
  cast: ApiCast;
  onPress?: () => void;
};

function VideoCollect({ cast, onPress }: VideoCollectProps) {
  const trackCastReaction = useTrackCastReaction();
  const collectible = cast.collectible;

  let topBid;
  if (collectible?.state === 'auction-active' && collectible.auction.topBid) {
    topBid = `$${formatShorthandNumber(collectible.auction.topBid.value)}`;
  }

  const navigate = useNavigate();
  const handlePress = React.useCallback(() => {
    onPress?.();
    trackCastReaction({
      castHash: cast.hash,
      castFid: cast.author.fid,
      type: CastReactionType.Collect,
      undo: false,
      feed: 'video',
    });

    navigate('CollectibleCast', {
      username: cast.author.username,
      castHash: cast.hash,
    });
  }, [navigate, trackCastReaction, cast, onPress]);

  const collectGesture = React.useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        'worklet';
        runOnJS(handlePress)();
      }),
    [handlePress],
  );

  const t = useTheme();
  const actionButtonStyle = React.useMemo(
    () => [t.flex, t.flexCol, t.itemsCenter, t.justifyCenter, { gap: 6 }],
    [t.flex, t.flexCol, t.itemsCenter, t.justifyCenter],
  );

  const currentFid = useCurrentUserFid();
  const isTopBidder =
    collectible?.state === 'auction-active' &&
    collectible.auction.topBid.bidder.fid === currentFid;

  if (!collectible) {
    return null;
  }

  return (
    <GestureDetector gesture={collectGesture}>
      <View style={actionButtonStyle}>
        <Sparkle
          size={24}
          color={isTopBidder ? t.colors.actionGreen : t.colors.text.light}
          fill={isTopBidder ? t.colors.actionGreen : undefined}
        />
        <Text2 color="light" size="xs" weight="semibold">
          {topBid ?? 'Collect'}
        </Text2>
      </View>
    </GestureDetector>
  );
}

export { VideoCollect };
