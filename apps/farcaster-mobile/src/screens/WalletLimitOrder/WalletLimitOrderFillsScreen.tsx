import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ButtonV2,
  Text2,
  useTheme,
  WalletLimitOrderFills,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { usePop } from '~/hooks/navigation/usePop';
import { WalletStackParamList } from '~/types';

type WalletLimitOrderFillsScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletLimitOrderFills'
>;

const WalletLimitOrderFillsScreen =
  buildScreen<WalletLimitOrderFillsScreenProps>(
    { name: 'WalletLimitOrderFills', insetTop: true, themeV2: true },
    ({ route }) => {
      const pop = usePop();
      const t = useTheme();
      const order = route.params?.order;

      if (!order) {
        return (
          <View
            style={[t.flex1, t.bgDefault, t.p4, t.justifyCenter, { gap: 16 }]}
          >
            <Text2 color="secondary" align="center">
              Could not find this limit order.
            </Text2>
            <ButtonV2
              variant="secondary"
              title="Back"
              onPress={pop}
              width="full"
            />
          </View>
        );
      }

      return <WalletLimitOrderFills order={order} onBack={pop} />;
    },
  );

WalletLimitOrderFillsScreen.displayName = 'WalletLimitOrderFillsScreen';

export { WalletLimitOrderFillsScreen };
