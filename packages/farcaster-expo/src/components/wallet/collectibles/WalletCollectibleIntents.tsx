import {
  ApiEthNonFungibleToken,
  RELAY_SOLANA_CHAIN_ID,
} from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { useSharedNavigationContext } from '../../../contexts';
import { useTheme } from '../../../contexts/ThemeContext';
import { ButtonV2 } from '../../design-system/ButtonV2';

export function WalletCollectibleIntents({
  data,
}: {
  data: ApiEthNonFungibleToken;
}) {
  const t = useTheme();

  const { push } = useSharedNavigationContext();

  if (data.chainId === RELAY_SOLANA_CHAIN_ID) {
    return null;
  }

  return (
    <View style={[t.flexRow, t.m2, t.bgDefault, { gap: 8 }]}>
      <ButtonV2
        width="flex1"
        title="Send"
        textSize="lg"
        onPress={() => {
          push({
            path: 'WalletSendCollectible',
            params: { data },
          });
        }}
        haptics
      />
    </View>
  );
}
