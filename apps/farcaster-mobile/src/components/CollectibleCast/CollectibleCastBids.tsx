import { ApiCastCollectibleAuctionBid } from 'farcaster-client-data';
import {
  formatBidValue,
  resolveUsernameShort,
  useTimeAgo,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  Text2,
  useCurrentUserFid,
  useHaptics,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useTheme } from '~/contexts/ThemeProvider';
import { useReplaceToUserProfile } from '~/hooks/navigation/usePushToUserProfile';

import { AuctionWinningCrown } from './ExploreCollectibleCastListItem';

interface CollectibleBidsListProps {
  bidHistory: ApiCastCollectibleAuctionBid[];
  isBidPending: boolean;
}

// Create stable bid ID that ignores timestamp changes
const createStableBidId = (bid: ApiCastCollectibleAuctionBid) => {
  return `${bid.bidder.fid}-${bid.value}`;
};

export function CollectibleCastBids({
  bidHistory,
  isBidPending,
}: CollectibleBidsListProps) {
  const t = useTheme();
  const currentFid = useCurrentUserFid();

  if (bidHistory.length === 0) {
    return <View style={[t.flex1]} />;
  }

  return (
    <View style={[{ gap: 12, flex: 1 }]}>
      <Text2 size="lg" weight="semibold" style={[t.pX1]}>
        Bids
      </Text2>

      <Animated.FlatList
        data={bidHistory}
        keyExtractor={(bid) => createStableBidId(bid)}
        itemLayoutAnimation={LinearTransition.springify()
          .damping(SPRING_CONFIG.damping)
          .stiffness(SPRING_CONFIG.stiffness)}
        style={[
          t.flex1,
          {
            borderRadius: 16,
            overflow: 'hidden',
          },
        ]}
        contentContainerStyle={{
          gap: 1,
          backgroundColor: t.dark ? '#FFFFFF10' : '#FFFFFF50',
        }}
        renderItem={({ item: bid, index }) => (
          <CollectibleCastBidListItem
            bid={bid}
            isPendingBid={index === 0 && isBidPending}
            isTopBid={index === 0 && bid.bidder.fid === currentFid}
          />
        )}
        scrollEnabled={false}
      />
    </View>
  );
}

interface CollectibleCastBidListItemInnerProps {
  bidderFid: number;
  bidderPfpUrl?: string;
  bidderUsername: string;
  bidValue: string;
  timestamp?: number;
  isPendingBid: boolean;
  isTopBid: boolean;
  onPress: () => void;
}

/**
 * Memoized inner component with literal values to prevent rerenders if
 * bid object changes but values are the same
 **/
const arePropsEqual = (
  prev: CollectibleCastBidListItemInnerProps,
  next: CollectibleCastBidListItemInnerProps,
) => {
  return (
    prev.bidderFid === next.bidderFid &&
    prev.bidderPfpUrl === next.bidderPfpUrl &&
    prev.bidderUsername === next.bidderUsername &&
    prev.bidValue === next.bidValue &&
    prev.isPendingBid === next.isPendingBid &&
    prev.isTopBid === next.isTopBid
    // Note: timestamp is excluded since our pending bid is the only one that will have a timestamp change and it won't be more than few seconds
    // Note: onPress is intentionally not compared as it's a stable callback
  );
};

// Unified animation configuration
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};

const CollectibleCastBidListItemInner = React.memo(
  function CollectibleCastBidListItemInner({
    bidderPfpUrl,
    bidderUsername,
    bidValue,
    timestamp,
    isPendingBid,
    isTopBid,
    onPress,
  }: CollectibleCastBidListItemInnerProps) {
    const t = useTheme();
    const pendingOpacity = useSharedValue(isPendingBid ? 0.5 : 1);

    React.useEffect(() => {
      pendingOpacity.value = withSpring(isPendingBid ? 0.5 : 1, SPRING_CONFIG);
    }, [isPendingBid, pendingOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: pendingOpacity.value,
    }));

    return (
      <AnimatedPressable onPress={onPress}>
        <Animated.View
          style={[
            t.pX4,
            t.pY3,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            {
              gap: 12,
            },
            animatedStyle,
          ]}
        >
          <View style={[t.flexRow, t.flex1, { gap: 12 }]}>
            <View>
              <Avatar pfpUrl={bidderPfpUrl} diameter={40} />
              {isTopBid && (
                <View style={[t.absolute, { top: -2, left: -2 }]}>
                  <AuctionWinningCrown size="20" />
                </View>
              )}
            </View>
            <View style={[t.flex1, t.justifyCenter]}>
              <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
                <Text2 weight="medium" numberOfLines={1}>
                  {bidderUsername}
                </Text2>
              </View>
              {timestamp && <TimeAgo timestamp={timestamp} />}
            </View>
          </View>

          <View style={[{ gap: 2 }, t.itemsEnd]}>
            <Text2 weight="medium">{bidValue}</Text2>
          </View>
        </Animated.View>
      </AnimatedPressable>
    );
  },
  arePropsEqual,
);

export function CollectibleCastBidListItem({
  bid,
  isPendingBid,
  isTopBid,
}: {
  bid: ApiCastCollectibleAuctionBid;
  isPendingBid: boolean;
  isTopBid: boolean;
}) {
  const replaceToUserProfile = useReplaceToUserProfile();
  const { triggerImpactAsync } = useHaptics();

  // Extract primitive values to ensure stable dependencies
  const bidderFid = bid.bidder.fid;
  const bidderPfpUrl = bid.bidder.pfp?.url;
  const bidValue = bid.value;
  const timestamp = bid.timestamp;

  const handlePress = React.useCallback(() => {
    replaceToUserProfile({ fid: bidderFid });
    triggerImpactAsync();
  }, [bidderFid, replaceToUserProfile, triggerImpactAsync]);

  const bidderUsername = React.useMemo(
    () => resolveUsernameShort(bid.bidder),
    [bid.bidder],
  );

  const formattedBidValue = React.useMemo(
    () => formatBidValue(bidValue),
    [bidValue],
  );

  return (
    <CollectibleCastBidListItemInner
      bidderFid={bidderFid}
      bidderPfpUrl={bidderPfpUrl}
      bidderUsername={bidderUsername}
      bidValue={formattedBidValue}
      timestamp={timestamp}
      isPendingBid={isPendingBid}
      isTopBid={isTopBid}
      onPress={handlePress}
    />
  );
}

const TimeAgo = React.memo(function TimeAgo({
  timestamp,
}: {
  timestamp: number;
}) {
  const timeAgo = useTimeAgo({ timestamp, suffix: true });

  return (
    <Text2 size="sm" style={{ opacity: 0.5 }}>
      {timeAgo}
    </Text2>
  );
});
