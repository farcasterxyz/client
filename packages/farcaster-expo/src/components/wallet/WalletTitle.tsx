import React from 'react';
import { View } from 'react-native';

import { useWalletFidOverride } from '../../hooks/useWalletPreferences';
import { Text2 } from '../design-system';

export function WalletTitle() {
  const [walletFidOverride] = useWalletFidOverride();
  return (
    <View>
      {walletFidOverride && (
        <Text2 size="xs" color="secondary" align="center">
          {`Viewing as fid:${walletFidOverride}`}
        </Text2>
      )}
    </View>
  );
}
