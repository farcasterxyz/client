import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ApiTokenLink,
  ApiUser,
  ApiWalletActivity,
} from 'farcaster-client-data';
import { useWalletActivityPreview } from 'farcaster-client-hooks';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useSharedNavigationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  useActiveWallet,
  useCurrentUserFid,
  useHaptics,
  useWalletFidOverride,
} from '../../../hooks';
import { LaunchFrameParams } from '../../../types';
import { AnimatedPressable, Text2 } from '../../design-system';
import { LoadFailureIndicator } from '../../LoadFailureIndicator';
import { WalletActivityBottomSheet } from '../../wallet/activity/WalletActivity';
import { WalletActivityItem } from '../../wallet/activity/WalletActivityItem';

type TokenHistoryPreviewProps = {
  token: ApiTokenLink;
  onLaunchFrame?: (frame: LaunchFrameParams) => void;
  onUserPress?: (user: ApiUser) => void;
};

export function TokenHistoryPreview({
  token,
  onLaunchFrame,
  onUserPress,
}: TokenHistoryPreviewProps) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();
  const { triggerImpactAsync } = useHaptics();
  const userFid = useCurrentUserFid();
  const [walletFidOverride] = useWalletFidOverride();
  const { activeWalletId } = useActiveWallet();
  const fid = useMemo(() => {
    return walletFidOverride ?? userFid;
  }, [userFid, walletFidOverride]);

  const walletId = fid === userFid ? activeWalletId : undefined;

  const [item, setItem] = useState<ApiWalletActivity | null>(null);
  const { data, isError, refetch, isFetched } = useWalletActivityPreview({
    params: {
      fid,
      walletId,
      hideSpam: false,
      hideMicrotransactions: false,
      token: `${token.chain}:${token.ca}`,
    },
    enabled: !!fid,
  });
  const activities = data?.result.activity;

  const [fetchError, setFetchError] = useState<boolean>(isError);
  useEffect(() => {
    setFetchError(isError);
  }, [isError]);

  const renderItem = useCallback<ListRenderItem<ApiWalletActivity>>(
    ({ item, index }) => {
      return (
        <WalletActivityItem
          key={`${item.transaction.txHash}-${index}`}
          item={item}
          onRowPress={setItem}
        />
      );
    },
    [],
  );

  const onShowAllPress = useCallback(() => {
    triggerImpactAsync();
    push({
      path: 'TokenActivity',
      params: { chain: token.chain, ca: token.ca },
    });
  }, [push, triggerImpactAsync, token.chain, token.ca]);

  return (
    <View>
      {!activities || activities.length === 0 ? null : (
        <Animated.View entering={FadeIn}>
          <Text2
            size="lg"
            weight="medium"
            style={[t.mX3, { paddingLeft: 6, paddingBottom: 18 }]}
          >
            History
          </Text2>
        </Animated.View>
      )}
      <FlashList
        data={activities}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 8 }}
        ListFooterComponent={
          fetchError ? (
            <LoadFailureIndicator retry={refetch} />
          ) : isFetched ? (
            <AnimatedPressable onPress={onShowAllPress}>
              <View style={[t.mX3, t.flexRow, t.itemsCenter, { padding: 6 }]}>
                <Text2 size="sm" weight="medium" color="brand">
                  Show all
                </Text2>
                <View style={[t.flexNone]}>
                  <ChevronRight size={19} color={t.colors.text.brand} />
                </View>
              </View>
            </AnimatedPressable>
          ) : null
        }
        scrollEnabled={false}
      />
      {item && (
        <WalletActivityBottomSheet
          item={item}
          onUserPress={onUserPress}
          onLaunchFrame={onLaunchFrame}
          onDismiss={() => setItem(null)}
        />
      )}
    </View>
  );
}
