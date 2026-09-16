import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  useWalletLimitOrder,
  WalletLimitOrderSelectToken,
} from 'farcaster-expo';
import * as React from 'react';

import { buildScreen } from '~/components/Screen';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { WalletLimitOrderStackParamList } from '~/types';

type WalletLimitOrderSelectTokenScreenProps = NativeStackScreenProps<
  WalletLimitOrderStackParamList,
  'WalletLimitOrderSelectToken'
>;

export const WalletLimitOrderSelectTokenScreen =
  buildScreen<WalletLimitOrderSelectTokenScreenProps>(
    {
      name: 'WalletLimitOrderSelectToken',
      insetTop: true,
      transparentBackground: true,
      themeV2: true,
    },
    () => {
      const { kind, setSelectedToken } = useWalletLimitOrder();
      const navigation =
        useNavigation<
          NativeStackScreenProps<
            WalletLimitOrderStackParamList,
            'WalletLimitOrderSelectToken'
          >['navigation']
        >();
      const goBack = useGoBack();

      const onSelectToken = React.useCallback(
        (token: ApiTokenLink) => {
          setSelectedToken(token);
          const state = navigation.getState();
          const canGoBackInStack = state ? state.index > 0 : false;
          if (canGoBackInStack) {
            navigation.goBack();
          } else {
            navigation.replace('WalletLimitOrderMain', { kind });
          }
        },
        [navigation, setSelectedToken, kind],
      );

      return (
        <WalletLimitOrderSelectToken
          onSelectToken={onSelectToken}
          onBack={goBack}
        />
      );
    },
  );
