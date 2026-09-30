import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletSend } from 'farcaster-expo';
import * as React from 'react';
import { Platform } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletSendScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletSend'
>;

const WalletSendScreen = buildScreen<WalletSendScreenProps>(
  {
    name: 'WalletSend',
    insetTop: Platform.OS === 'android',
    themeV2: true,
  },
  ({ route: { params } }) => <WalletSend {...params} />,
);

WalletSendScreen.displayName = 'WalletSendScreen';

export { WalletSendScreen };
