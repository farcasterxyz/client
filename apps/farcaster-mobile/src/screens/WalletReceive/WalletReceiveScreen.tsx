import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletReceive } from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletReceiveScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletReceive'
>;

export const WalletReceiveScreen = buildScreen<WalletReceiveScreenProps>(
  {
    name: 'WalletReceive',
    insetTop: Platform.OS === 'android',
    themeV2: true,
  },
  () => <WalletReceive />,
);
