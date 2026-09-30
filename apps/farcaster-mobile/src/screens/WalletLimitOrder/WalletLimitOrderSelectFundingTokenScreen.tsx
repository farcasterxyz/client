import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiTokenLink } from 'farcaster-client-data';
import {
  useWalletLimitOrder,
  WalletLimitOrderSelectFundingToken,
} from 'farcaster-expo';
import * as React from 'react';

import { buildScreen } from '~/components/Screen';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { WalletLimitOrderStackParamList } from '~/types';

type WalletLimitOrderSelectFundingTokenScreenProps = NativeStackScreenProps<
  WalletLimitOrderStackParamList,
  'WalletLimitOrderSelectFundingToken'
>;

export const WalletLimitOrderSelectFundingTokenScreen =
  buildScreen<WalletLimitOrderSelectFundingTokenScreenProps>(
    {
      name: 'WalletLimitOrderSelectFundingToken',
      insetTop: true,
      transparentBackground: true,
      themeV2: true,
    },
    () => {
      const { setFundingToken } = useWalletLimitOrder();
      const goBack = useGoBack();

      const onSelectToken = React.useCallback(
        (token: ApiTokenLink) => {
          setFundingToken(token);
          goBack();
        },
        [goBack, setFundingToken],
      );

      return (
        <WalletLimitOrderSelectFundingToken
          onSelectToken={onSelectToken}
          onBack={goBack}
        />
      );
    },
  );
