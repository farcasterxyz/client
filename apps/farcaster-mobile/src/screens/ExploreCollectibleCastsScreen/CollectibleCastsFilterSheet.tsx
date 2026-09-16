import { ApiCollectibleCastsIndexSort } from 'farcaster-client-data';
import {
  BottomSheetContentContainer,
  PressableSimpleListItem,
  Text2,
  useTheme,
} from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { CollectibleCastsExploreTab } from './ExploreCollectibleCastsScreen';

interface CollectibleCastsFilterSheetProps {
  tab: CollectibleCastsExploreTab;
  topSort: ApiCollectibleCastsIndexSort;
  myBidsSort: ApiCollectibleCastsIndexSort;
  expiringSoon: boolean;
  expiring24h: boolean;
  following: boolean;
  onExpiringSoonChange: (value: boolean) => void;
  onExpiring24hChange: (value: boolean) => void;
  onFollowingChange: (value: boolean) => void;
  setTopSort: (value: ApiCollectibleCastsIndexSort) => void;
  setMyBidsSort: (value: ApiCollectibleCastsIndexSort) => void;
  onClose?: () => void;
}

export function CollectibleCastsFilterSheet({
  tab,
  topSort,
  myBidsSort,
  expiringSoon,
  expiring24h,
  following,
  setTopSort,
  setMyBidsSort,
  onExpiringSoonChange,
  onExpiring24hChange,
  onFollowingChange,
}: CollectibleCastsFilterSheetProps) {
  const t = useTheme();

  const handleExpiringSoonToggle = useCallback(() => {
    onExpiringSoonChange(!expiringSoon);
  }, [expiringSoon, onExpiringSoonChange]);

  const handleExpiring24hToggle = useCallback(() => {
    onExpiring24hChange(!expiring24h);
  }, [expiring24h, onExpiring24hChange]);

  const handleFollowingToggle = useCallback(() => {
    onFollowingChange(!following);
  }, [following, onFollowingChange]);

  return (
    <BottomSheetContentContainer>
      {tab === 'top' && (
        <View style={[t.mB5]}>
          <Text2 color="tertiary" weight="medium" style={[t.mB3]}>
            Sort by
          </Text2>
          <View>
            <PressableSimpleListItem
              onPress={() => setTopSort('price desc')}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isStart={true}
            >
              <Text2>Price high to low</Text2>
              {topSort === 'price desc' && (
                <Check size={20} color={t.colors.text.brand} />
              )}
            </PressableSimpleListItem>
            <PressableSimpleListItem
              onPress={() => setTopSort('price asc')}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isEnd={true}
            >
              <Text2>Price low to high</Text2>
              {topSort === 'price asc' && (
                <Check size={20} color={t.colors.text.brand} />
              )}
            </PressableSimpleListItem>
          </View>
        </View>
      )}

      {tab === 'my_bids' && (
        <View style={[t.mB5]}>
          <Text2 color="tertiary" weight="medium" style={[t.mB3]}>
            Sort by
          </Text2>
          <View>
            <PressableSimpleListItem
              onPress={() => setMyBidsSort('expiry asc')}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isStart={true}
            >
              <Text2>Auction end</Text2>
              {myBidsSort === 'expiry asc' && (
                <Check size={20} color={t.colors.text.brand} />
              )}
            </PressableSimpleListItem>
            <PressableSimpleListItem
              onPress={() => setMyBidsSort('last_bid desc')}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isEnd={true}
            >
              <Text2>Last bid</Text2>
              {myBidsSort === 'last_bid desc' && (
                <Check size={20} color={t.colors.text.brand} />
              )}
            </PressableSimpleListItem>
          </View>
        </View>
      )}

      {(tab === 'trending' || tab === 'top') && (
        <View style={[t.mT6]}>
          <Text2 color="tertiary" weight="medium" style={[t.mB3]}>
            Filters
          </Text2>
          <View>
            <PressableSimpleListItem
              onPress={handleExpiringSoonToggle}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isStart={true}
            >
              <Text2>Ending soon</Text2>
              {expiringSoon && <Check size={20} color={t.colors.text.brand} />}
            </PressableSimpleListItem>
            <PressableSimpleListItem
              onPress={handleExpiring24hToggle}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
            >
              <Text2>Ending in 24h</Text2>
              {expiring24h && <Check size={20} color={t.colors.text.brand} />}
            </PressableSimpleListItem>
            <PressableSimpleListItem
              onPress={handleFollowingToggle}
              style={[t.flexRow, t.justifyBetween, t.itemsCenter]}
              isEnd={true}
            >
              <Text2>People I follow</Text2>
              {following && <Check size={20} color={t.colors.text.brand} />}
            </PressableSimpleListItem>
          </View>
        </View>
      )}
    </BottomSheetContentContainer>
  );
}
