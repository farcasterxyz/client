import type { WarpsEligible } from 'farcaster-client-hooks';
import {
  ButtonV2,
  CircleIconBadge,
  Text2,
  useEmbeddedWallet,
} from 'farcaster-expo';
import { Check } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

export function SuccessRedeemWarpsForUSDCScreen({
  warpsTradeMetadata,
}: {
  warpsTradeMetadata: Pick<
    WarpsEligible,
    'exchangeUsdcAmount' | 'redeemableWarps'
  >;
}) {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const navigate = useNavigate();
  const logo = (
    <CircleIconBadge
      variant="success"
      size="80"
      Icon={(props) => <Check {...props} />}
    />
  );
  const button = (
    <View style={[t.absolute, t.bottom0, t.wFull]}>
      <View style={[t.pB4]}>
        <ButtonV2
          title="Go to wallet"
          textSize="lg"
          onPress={() => navigate('Wallet', {})}
        />
      </View>
    </View>
  );
  return (
    <View style={[t.flex1, t.pX3]}>
      <View style={[t.flex1, t.pT6]}>
        <View style={[{ height: 414 }, t.itemsCenter, t.justifyCenter]}>
          {logo}
          <View style={[t.textCenter, t.itemsCenter, t.justifyCenter]}>
            <Text2 weight="semibold" size="xl" align="center" style={[t.mY4]}>
              Success
            </Text2>
            <View>
              <Text2 style={[t.mB1, t.mX3, t.texts.secondary]}>
                <Text2 style={[t.textBase]}>
                  {warpsTradeMetadata.exchangeUsdcAmount} USDC
                </Text2>{' '}
                will be deposited into your Farcaster Wallet (
                <Text2 style={[t.textBase]}>
                  {evmAddress?.slice(0, 4)}...{evmAddress?.slice(-4)}
                </Text2>
                ) in the next few minutes.
              </Text2>
            </View>
          </View>
        </View>
        {button}
      </View>
    </View>
  );
}
