import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CreateCastParams,
  useEmbeddedWallet,
  useShowWalletOrdersTab,
  useWalletGeoRestricted,
  WalletLimitOrder,
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from 'farcaster-expo';
import * as React from 'react';

import { useDismissibleSheet } from '~/components/DismissibleSheet';
import { buildScreen } from '~/components/Screen';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { dismissLimitOrderModal } from '~/hooks/navigation/dismissLimitOrderModal';
import { navigateToWalletOrdersTab } from '~/hooks/navigation/navigateToWalletOrdersTab';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { WalletLimitOrderDismissScrollContext } from '~/navigation/WalletLimitOrderStack';
import { WalletLimitOrderStackParamList } from '~/types';

type WalletLimitOrderScreenProps = NativeStackScreenProps<
  WalletLimitOrderStackParamList,
  'WalletLimitOrderMain'
>;

type WalletLimitOrderContentProps = {
  onViewOrdersPress: () => void;
  onCastAboutOrderPress: (
    params: NonNullable<CreateCastParams['params']>,
  ) => void;
  onSelectTokenPress: () => void;
  onSelectFundingTokenPress: () => void;
};

function WalletLimitOrderContent({
  onViewOrdersPress,
  onCastAboutOrderPress,
  onSelectTokenPress,
  onSelectFundingTokenPress,
}: WalletLimitOrderContentProps) {
  const scrollOffset = React.useContext(WalletLimitOrderDismissScrollContext);
  const { panGestureRef } = useDismissibleSheet();

  return (
    <WalletLimitOrder
      onViewOrdersPress={onViewOrdersPress}
      onCastAboutOrderPress={onCastAboutOrderPress}
      onSelectTokenPress={onSelectTokenPress}
      onSelectFundingTokenPress={onSelectFundingTokenPress}
      scrollOffset={scrollOffset}
      panGestureRef={panGestureRef}
    />
  );
}

export const WalletLimitOrderScreen = buildScreen<WalletLimitOrderScreenProps>(
  {
    name: 'WalletLimitOrder',
    insetTop: true,
    transparentBackground: true,
    themeV2: true,
  },
  () => {
    const { evmAddress } = useEmbeddedWallet();
    const geoRestricted = useWalletGeoRestricted();
    const { checkUserAppContextGate } = useUserAppContextGate();
    const walletIntentsEnabled =
      checkUserAppContextGate('wallet-intents').value;
    const { showWalletOrdersTab } = useShowWalletOrdersTab();
    const openComposer = useOpenComposer();
    const navigation =
      useNavigation<
        NativeStackScreenProps<
          WalletLimitOrderStackParamList,
          'WalletLimitOrderMain'
        >['navigation']
      >();
    const handleSelectTokenPress = React.useCallback(() => {
      navigation.push('WalletLimitOrderSelectToken', {});
    }, [navigation]);

    const handleSelectFundingTokenPress = React.useCallback(() => {
      navigation.push('WalletLimitOrderSelectFundingToken', {});
    }, [navigation]);

    const handleViewOrdersPress = React.useCallback(() => {
      navigateToWalletOrdersTab({
        showOrdersTab: walletIntentsEnabled && showWalletOrdersTab,
      });
    }, [showWalletOrdersTab, walletIntentsEnabled]);

    const handleCastAboutOrderPress = React.useCallback(
      (params: NonNullable<CreateCastParams['params']>) => {
        dismissLimitOrderModal(() => {
          setTimeout(() => {
            openComposer(params);
          }, 500);
        });
      },
      [openComposer],
    );

    if (geoRestricted) {
      return <WalletNotAvailableInRegion />;
    }

    if (!evmAddress) {
      return <WalletNotConnected source="wallet-limit-order" />;
    }

    return (
      <WalletLimitOrderContent
        onViewOrdersPress={handleViewOrdersPress}
        onCastAboutOrderPress={handleCastAboutOrderPress}
        onSelectTokenPress={handleSelectTokenPress}
        onSelectFundingTokenPress={handleSelectFundingTokenPress}
      />
    );
  },
);
