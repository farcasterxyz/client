import { ApiCastCollectible } from 'farcaster-client-data';
import {
  CastWithActiveAuction,
  CastWithMintedCollectible,
  formatBidValue,
  resolveUsernameShort,
  useTimeAgo,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  Avatar,
  SkeletonPlaceholder,
  Text2,
  TextPlaceholder,
  useCurrentUserFid,
  useTheme,
} from 'farcaster-expo';
import { Crown } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { usePush } from '~/hooks/navigation/usePush';

import { CollectibleCastArtifact } from './CollectibleCastArtifact';
import { Sparkle } from './Sparkle';

const ITEM_SIZE = 80;

export function ExploreCollectibleCastListItem({
  cast,
  bidOnView = false,
}: {
  cast: CastWithActiveAuction | CastWithMintedCollectible;
  bidOnView?: boolean;
}) {
  const t = useTheme();
  const push = usePush();
  const { collectible } = cast;
  const bidValue: number = (() => {
    if (collectible.state === 'minted') {
      return collectible.auction?.topBid.value ?? 9999;
    } else {
      // auction-active or auction-ended
      return collectible.auction.topBid.value;
    }
  })();

  const onPress = useCallback(() => {
    push('CollectibleCast', {
      castHash: cast.hash,
      username: cast.author.username,
    });
  }, [push, cast.hash, cast.author.username]);

  return (
    <AnimatedPressable style={[t.flexRow, { gap: 16 }]} onPress={onPress}>
      <View style={[t.flexNone, { width: ITEM_SIZE }]}>
        <CollectibleCastArtifact
          cast={cast}
          key={cast.hash}
          variant="thumbnail"
          size={ITEM_SIZE}
          enableParallax={false}
          shadowed={false}
        />
        <View style={[t.absolute, { top: -4, left: -4 }]}>
          <AuctionStatusBadge collectible={collectible} />
        </View>
      </View>
      <View style={[t.flex1, t.justifyBetween, { paddingVertical: 3 }]}>
        <View style={[t.flexRow, { gap: 16 }]}>
          <View style={[t.flex1, { gap: 2 }]}>
            <Text2 weight="semibold">{resolveUsernameShort(cast.author)}</Text2>
            {cast.text.trim().length ? (
              <Text2 color="secondary" size="sm" numberOfLines={1}>
                {cast.text.trim()}
              </Text2>
            ) : (
              <View
                style={[
                  t.flexNone,
                  t.selfStart,
                  t.bgLightGray,
                  {
                    paddingVertical: 4,
                    paddingHorizontal: 6,
                    borderRadius: 8,
                  },
                ]}
              >
                <Text2 color="secondary" size="xs" weight="semibold">
                  Media content
                </Text2>
              </View>
            )}
          </View>
          <View style={[t.flexNone, t.itemsEnd, { width: 60 }]}>
            <Text2 weight="semibold">{formatBidValue(bidValue)}</Text2>
          </View>
        </View>
        <View style={[t.flexRow, t.itemsCenter]}>
          <AuctionDetailsLine collectible={collectible} bidOnView={bidOnView} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

function ExpiresIn({ timestamp }: { timestamp: number }) {
  return useTimeAgo({ timestamp });
}

export function ExploreCollectibleCastListItemPlaceholder() {
  const t = useTheme();

  return (
    <View style={[t.flexRow, { gap: 16 }]}>
      <View style={[t.flexNone, { width: ITEM_SIZE }]}>
        <SkeletonPlaceholder
          style={{
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            borderRadius: 12,
          }}
        />
      </View>
      <View style={[t.flex1, t.justifyBetween, { paddingVertical: 3 }]}>
        <View style={[t.flexRow, { gap: 16 }]}>
          <View style={[t.flex1, { gap: 8 }]}>
            <TextPlaceholder width={120} />
            <TextPlaceholder width={180} size="sm" />
          </View>
          <View style={[t.flexNone, t.itemsEnd, { width: 60 }]}>
            <TextPlaceholder width={50} />
          </View>
        </View>
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          <TextPlaceholder width={60} size="sm" />
          <SkeletonPlaceholder
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
            }}
          />
          <TextPlaceholder width={40} size="sm" />
        </View>
      </View>
    </View>
  );
}

function AuctionDetailsLine({
  collectible,
  bidOnView,
}: {
  collectible: ApiCastCollectible;
  bidOnView?: boolean;
}) {
  const currentFid = useCurrentUserFid();
  const t = useTheme();

  switch (collectible.state) {
    case 'auction-active':
      if (!bidOnView) {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn
                key={collectible.auction.end}
                timestamp={collectible.auction.end}
              />
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <Text2
                color="tertiary"
                lineHeight="xs"
                style={{ fontSize: 13 }}
                weight="medium"
              >
                {collectible.auction.totalBids ?? 1} bid
                {(collectible.auction.totalBids ?? 1) > 1 ? 's' : ''}
              </Text2>
              <Avatar
                pfpUrl={collectible.auction.topBid.bidder.pfp?.url}
                diameter={16}
              />
            </View>
          </View>
        );
      } else if (collectible.auction.topBid.bidder.fid === currentFid) {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn timestamp={collectible.auction.end} />
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <Text2
              color="warning"
              lineHeight="xs"
              style={{ fontSize: 13 }}
              weight="medium"
            >
              Winning
            </Text2>
          </View>
        );
      } else {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn timestamp={collectible.auction.end} />
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <Text2
              color="secondary"
              lineHeight="xs"
              style={{ fontSize: 13 }}
              weight="medium"
            >
              {collectible.state === 'auction-active' ? 'Outbid' : 'Lost'}
            </Text2>
          </View>
        );
      }
    case 'minted':
      if (!bidOnView) {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              Won by
            </Text2>
            <Avatar
              pfpUrl={collectible.auction.topBid.bidder.pfp?.url}
              diameter={16}
            />
            <Text2 color="tertiary" size="xs" weight="semibold">
              {resolveUsernameShort(
                collectible.auction.topBid.bidder,
                currentFid,
              )}
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn timestamp={collectible.auction.end} />
            </Text2>
          </View>
        );
      }
      if (collectible.owner.user?.fid === currentFid) {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn timestamp={collectible.auction.end} />
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <Text2
              lineHeight="xs"
              style={{ fontSize: 13, color: '#43B748' }}
              weight="medium"
            >
              Collected
            </Text2>
          </View>
        );
      } else {
        return (
          <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
            <Text2 color="tertiary" size="xs" weight="medium">
              <ExpiresIn timestamp={collectible.auction.end} />
            </Text2>
            <Text2 color="tertiary" size="xs" weight="medium">
              &middot;
            </Text2>
            <Text2
              lineHeight="xs"
              color="secondary"
              style={{ fontSize: 13 }}
              weight="medium"
            >
              Outbid
            </Text2>
          </View>
        );
      }
    default:
      return null;
  }
}

export function AuctionStatusBadge({
  collectible,
  showCollected = true,
}: {
  collectible: ApiCastCollectible;
  showCollected?: boolean;
}) {
  const t = useTheme();
  const currentFid = useCurrentUserFid();

  switch (collectible.state) {
    case 'auction-active':
      if (collectible.auction.topBid.bidder.fid === currentFid) {
        return <AuctionWinningCrown />;
      }
      break;
    case 'minted':
      if (!showCollected) {
        return null;
      }
      if (collectible.owner.user?.fid === currentFid) {
        return (
          <View
            style={[
              t.itemsCenter,
              t.justifyCenter,
              t.roundedFull,
              t.border2,
              t.borderBackground,
              { width: 32, height: 32, backgroundColor: '#43B748' },
            ]}
          >
            <Sparkle size={16} color="white" fill="white" />
          </View>
        );
      }
      break;
    default:
      return null;
  }
}

export function AuctionWinningCrown({
  size = 'md',
}: {
  size?: 'md' | 'sm' | '20';
}) {
  const t = useTheme();
  const sizePx = (() => {
    switch (size) {
      case 'md':
        return 32;
      case 'sm':
        return 18;
      case '20':
        return 20;
    }
  })();

  return (
    <View
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.bgWarn,
        t.roundedFull,
        size === 'md' ? t.border2 : t.border,
        t.borderBackground,
        { width: sizePx, height: sizePx, backgroundColor: '#FBC51A' },
      ]}
    >
      <Crown size={sizePx / 2} color="white" fill="white" />
    </View>
  );
}
