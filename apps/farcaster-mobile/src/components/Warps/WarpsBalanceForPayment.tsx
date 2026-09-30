import { formatNumber, useInterval } from 'farcaster-client-hooks';
import React, { FC, memo, useEffect } from 'react';
import { AppState, AppStateStatus, View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface WarpsBalanceForPaymentProps {
  balanceAmount: number;
  refreshBalance?: () => void;
}

const WarpsBalanceForPayment: FC<WarpsBalanceForPaymentProps> = memo(
  ({ balanceAmount, refreshBalance }) => {
    const t = useTheme();

    useEffect(() => {
      if (refreshBalance) {
        const appStateSubscription = AppState.addEventListener(
          'change',
          async (state: AppStateStatus) => {
            if (state === 'active') {
              refreshBalance();
            }
          },
        );

        return () => {
          appStateSubscription.remove();
        };
      }
    }, [refreshBalance]);

    useInterval(refreshBalance, 3000);

    return (
      <View style={[t.mT2, t.flexRow, t.itemsCenter, t.justifyCenter]}>
        <Text2 color="tertiary" style={[t.mL2]}>
          You have{' '}
        </Text2>
        <Text2 color="secondary" weight="semibold">
          {formatNumber(balanceAmount)}{' '}
        </Text2>
        <Text2 color="tertiary">warps</Text2>
      </View>
    );
  },
);

WarpsBalanceForPayment.displayName = 'WarpsBalanceForPayment';

export { WarpsBalanceForPayment };
