import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletCash } from 'farcaster-expo';
import * as React from 'react';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletCashScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletCash'
>;

const WalletCashScreen = buildScreen<WalletCashScreenProps>(
  { name: 'WalletCash', insetTop: true, themeV2: true },
  () => {
    return <WalletCash />;
  },
);

WalletCashScreen.displayName = 'WalletCashScreen';

export { WalletCashScreen };
