import { BottomSheetFlashList } from '@gorhom/bottom-sheet';
import {
  ApiTokenLink,
  ApiUser,
  ApiWalletActivity,
} from 'farcaster-client-data';
import { useWalletActivity } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../contexts';
import { useHaptics } from '../../../hooks';
import { Text2 } from '../../design-system';
import { WalletActivityBottomSheet } from '../../wallet/activity/WalletActivity';
import { TokenChart } from '../tokens/charts/TokenChart';
import { TokenBalance } from '../tokens/TokenBalance';
import {
  TraderTokenActivityItem,
  TraderTokenActivityPlaceHolderItem,
} from './TraderTokenActivityItem';

export function TraderTokenBottomSheetContent({
  user,
  token,
}: {
  user: ApiUser;
  token: ApiTokenLink;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { triggerImpactAsync } = useHaptics();

  const [showActivityItem, setShowActivityItem] =
    useState<ApiWalletActivity | null>(null);

  // TODO: fix this to enabkle the ripple effect
  const animationEnabled = useSharedValue(false);

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isError,
    isLoading,
    isFetchingNextPage,
  } = useWalletActivity({
    params: {
      fid: user.fid,
      hideSpam: false,
      hideMicrotransactions: false,
      token: `${token.chain}:${token.ca}`,
    },
  });

  const activities = useMemo(() => {
    return data?.pages.flatMap((page) => page.result.activity) ?? [];
  }, [data]);

  const ListHeaderComponent = useMemo(() => {
    return (
      <View style={[t.pB3, { gap: 12 }]}>
        <TokenChart
          chain={token.chain}
          ca={token.ca}
          animationEnabled={animationEnabled}
          withinNavigationContext={false}
          fid={user.fid}
        />
        <TokenBalance
          fid={user.fid}
          token={token}
          alwaysShow={true}
          disabledPress={true}
          canHideBalance={false}
          onPress={() => {}}
        />
        <Text2 weight="medium" size="lg" style={[t.pX3]}>
          {activities.length > 0 ? `${activities.length}` : ''}
          {hasNextPage ? '+ ' : ' '}Transaction
          {activities.length > 1 || activities.length === 0 ? 's' : ''}
        </Text2>
      </View>
    );
  }, [t, token, user.fid, activities, animationEnabled, hasNextPage]);

  const ListEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View>
          <TraderTokenActivityPlaceHolderItem />
          <TraderTokenActivityPlaceHolderItem />
          <TraderTokenActivityPlaceHolderItem />
        </View>
      );
    }

    return (
      <View style={[t.h36, t.pX3, t.mT8]}>
        <Text2 color="secondary" align="center">
          {!isError
            ? 'No swap activity found'
            : "It's taking a little longer than usual to load your activity. Please check back shortly."}
        </Text2>
      </View>
    );
  }, [t, isError, isLoading]);

  const ListFooterComponent = useMemo(() => {
    return isFetchingNextPage ? <TraderTokenActivityPlaceHolderItem /> : null;
  }, [isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ApiWalletActivity }) => {
      return (
        <TraderTokenActivityItem
          key={`${item.transaction.txHash}`}
          token={token}
          item={item}
          onPress={() => {
            triggerImpactAsync();
            setShowActivityItem(item);
          }}
        />
      );
    },
    [token, triggerImpactAsync],
  );

  return (
    <>
      <BottomSheetFlashList
        data={activities}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={() => {
          if (hasNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.2}
      />
      {showActivityItem && (
        <WalletActivityBottomSheet
          item={showActivityItem}
          onDismiss={() => setShowActivityItem(null)}
        />
      )}
    </>
  );
}
