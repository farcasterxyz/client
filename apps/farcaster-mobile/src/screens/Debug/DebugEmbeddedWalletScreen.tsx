import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WalletDebug } from 'farcaster-expo';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { ConnectedWalletProvider } from '~/contexts/ConnectWalletProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { CommonStackParamList } from '~/types';

type DebugEmbeddedWalletScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugEmbeddedWallet'
>;

const DebugEmbeddedWalletScreen = buildScreen<DebugEmbeddedWalletScreenProps>(
  { name: 'DebugEmbeddedWallet' },
  () => {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
      return <></>;
    }

    return (
      <ConnectedWalletProvider>
        <WalletDebug />
      </ConnectedWalletProvider>
    );
  },
);

DebugEmbeddedWalletScreen.displayName = 'DebugEmbeddedWalletScreen';

export { DebugEmbeddedWalletScreen };
