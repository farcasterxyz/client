import { Octicons } from '@expo/vector-icons';
import { formatEthAddress } from 'farcaster-client-data';
import { useCopyWalletAddress } from 'farcaster-expo';
import * as React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ProtocolImage } from '~/components/Protocol/ProtocolImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type WalletAddressSectionProps = {
  address: string;
};

function WalletAddressSection(props: WalletAddressSectionProps) {
  const t = useTheme();

  const { address } = props;

  const { copy } = useCopyWalletAddress(address);

  const formattedAddress = formatEthAddress(address);
  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.pY1,
        t.pX2,
        t.bgSwap,
        t.mX3,
        t.mB2,
        { borderRadius: 16 },
      ]}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter]}>
        <View
          style={[
            t.flex,
            t.justifyCenter,
            t.itemsCenter,
            t.m2,
            {
              backgroundColor: '#25292e',
              height: 40,
              width: 40,
              borderRadius: 40,
            },
          ]}
        >
          <ProtocolImage protocol="eth" />
        </View>
        <View>
          <Text2 weight="medium">Wallet address</Text2>
          <Text2 color="secondary" size="sm" style={{ paddingTop: 2 }}>
            {formattedAddress}
          </Text2>
        </View>
      </View>
      <TouchableOpacity
        style={[
          t.roundedFull,
          t.bgFaint,
          { height: 42, width: 42 },
          t.flex,
          t.justifyCenter,
          t.itemsCenter,
        ]}
        onPress={copy}
      >
        <Octicons name="copy" size={16} color={t.colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

export { WalletAddressSection };
