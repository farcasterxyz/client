import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletSendCollectible } from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletSendCollectibleScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletSendCollectible'
>;

const WalletSendCollectibleScreen =
  buildScreen<WalletSendCollectibleScreenProps>(
    { name: 'WalletSendCollectible', insetTop: Platform.OS === 'android' },
    ({ route: { params } }) => (
      <WalletSendCollectible data={params.data} platformType="mobile" />
    ),
  );

WalletSendCollectibleScreen.displayName = 'WalletSendCollectibleScreen';

export { WalletSendCollectibleScreen };
