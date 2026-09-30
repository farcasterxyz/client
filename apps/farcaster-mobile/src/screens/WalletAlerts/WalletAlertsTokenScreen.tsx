import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletAlertsToken } from 'farcaster-expo';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { WalletStackParamList } from '~/types';

type WalletAlertsTokenScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletAlertsToken'
>;

const WalletAlertsTokenScreen = buildScreen<WalletAlertsTokenScreenProps>(
  { name: 'WalletAlertsToken', insetTop: true, themeV2: true },
  ({
    route: {
      params: { chain, ca },
    },
  }) => {
    return <WalletAlertsToken chain={chain} ca={ca} />;
  },
);

WalletAlertsTokenScreen.displayName = 'WalletAlertsTokenScreen';

export { WalletAlertsTokenScreen };
