import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletReceiveOnChain } from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletReceiveOnChainScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletReceiveOnChain'
>;

export const WalletReceiveOnChainScreen =
  buildScreen<WalletReceiveOnChainScreenProps>(
    {
      name: 'WalletReceiveOnChain',
      insetTop: Platform.OS === 'android',
      insetBottom: true,
    },
    ({ route: { params } }) => (
      <WalletReceiveOnChain chain={params.chain} platformType="mobile" />
    ),
  );
