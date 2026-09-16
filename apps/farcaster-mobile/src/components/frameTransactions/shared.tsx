import { Octicons } from '@expo/vector-icons';
import {
  ApiChain,
  apiChainDisplayName,
  formatEthAddress,
} from 'farcaster-client-data';
import { frameUrlToDomain } from 'farcaster-client-hooks';
import React from 'react';
import { Pressable, View } from 'react-native';

import { ChainImage } from '~/components/Chain/ChainImage';
import { Text } from '~/components/Text';
import { useConnectedWallet } from '~/contexts/ConnectWalletProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export function TransactionContext({
  frameUrl,
  address,
  chain,
}: {
  frameUrl: string;
  address: string;
  chain: ApiChain;
}) {
  const t = useTheme();
  const { wallet } = useConnectedWallet();

  return (
    <>
      <View
        style={[
          t.justifyBetween,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.pB2,
          t.wFull,
        ]}
      >
        <Text style={[t.texts.tertiary, t.textBase]}>Domain</Text>
        <Text
          style={[t.texts.primary, t.textBase, { maxWidth: '75%' }]}
          numberOfLines={1}
          ellipsizeMode="head"
        >
          {frameUrlToDomain(frameUrl)}
        </Text>
      </View>
      <View
        style={[
          t.justifyBetween,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.pT2,
          t.pB2,
          t.wFull,
          t.borderDefault,
          t.borderTHairline,
        ]}
      >
        <Text numberOfLines={1} style={[t.flex1, t.texts.tertiary, t.textBase]}>
          Chain
        </Text>
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <ChainImage chain={chain} />
          <Text style={[t.texts.primary, t.textBase, t.mL1]}>
            {apiChainDisplayName(chain)}
          </Text>
        </View>
      </View>
      <View
        style={[
          t.justifyBetween,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.pT2,
          t.wFull,
          t.borderDefault,
          t.borderTHairline,
        ]}
      >
        <Text numberOfLines={1} style={[t.flex1, t.texts.tertiary, t.textBase]}>
          Address
        </Text>
        <View style={[t.flex, t.flexRow, t.itemsCenter]}>
          <Text style={[t.texts.primary, t.textBase, t.mL1]}>
            {formatEthAddress(address ?? '')}
          </Text>
          {wallet.type !== 'warpcast' && (
            <Pressable onPress={wallet.connect}>
              <Text style={[t.texts.brand, t.fontSemibold, t.textSm, t.mL2]}>
                Switch <Octicons name="arrow-right" size={14} />
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}
