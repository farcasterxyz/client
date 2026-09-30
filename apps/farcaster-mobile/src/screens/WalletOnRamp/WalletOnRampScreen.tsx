import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletOnRamp } from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletOnRampScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletOnRamp'
>;

export const WalletOnRampScreen = buildScreen<WalletOnRampScreenProps>(
  {
    name: 'WalletOnRamp',
    insetTop: Platform.OS === 'android',
    insetBottom: true,
  },
  ({ route: { params } }) => (
    <WalletOnRamp paymentMethod={params.paymentMethod} />
  ),
);
