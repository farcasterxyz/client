import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  ApiChain,
  apiChainDisplayName,
  ApiTokenLink,
} from 'farcaster-client-data';
import { formatBalance } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import {
  useOptionalSafeAreaInsets,
  useWalletBalances,
} from '../../../../hooks';
import {
  EIP7528_NATIVE_ASSET_ADDRESS,
  isNativeAsset,
  isSameAsset,
  NATIVE_ASSET_SYMBOLS,
  USDC_ADDRESSES,
} from '../../../../utils';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AnimatedPressable, Text2 } from '../../../design-system';
import { ChainImage } from '../../chains';
import { TokenIcon } from '../TokenIcon';

export function SwapTokensSelectTokenChainSheet({
  token,
  onDismiss,
  onSelectToken,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
  onSelectToken: (token: ApiTokenLink) => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const { balances } = useWalletBalances();
  const insets = useOptionalSafeAreaInsets();

  const options = React.useMemo(() => {
    const tokens: ApiTokenLink[] = isNativeAsset(token.ca)
      ? Object.entries(NATIVE_ASSET_SYMBOLS)
          .filter(([_, symbol]) => symbol === 'ETH')
          .map(([chain]) => ({
            ...token,
            chain: chain as ApiChain,
            ca: EIP7528_NATIVE_ASSET_ADDRESS,
          }))
      : Object.entries(USDC_ADDRESSES)
          .map(([chain, address]) => ({
            ...token,
            chain: chain as ApiChain,
            ca: address,
          }))
          .filter((token) => token.ca);

    return tokens
      .map((token) => {
        const balance = balances.find((b) =>
          isSameAsset({
            chain: b.chain,
            ca: b.address,
            asset: token,
          }),
        );
        return {
          ...token,
          balance: balance?.quantity.float ?? 0,
        };
      })
      .sort((a, b) => b.balance - a.balance);
  }, [balances, token]);

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapSelectTokenChain"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <BottomSheetScrollView
        contentContainerStyle={[{ gap: 12, paddingBottom: insets.bottom }]}
      >
        <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
          <Text2 weight="semibold" size="xl">
            Select chain
          </Text2>
        </View>
        {options.map((option) => (
          <AnimatedPressable
            key={option.chain}
            style={[t.flexRow, t.itemsCenter, t.justifyBetween, t.pY2]}
            onPress={() => onSelectToken(option)}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <ChainImage chain={option.chain} size={24} />
              <Text2 weight="medium">{apiChainDisplayName(option.chain)}</Text2>
            </View>
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <TokenIcon
                iconUrl={option.imageUrl}
                diameter={20}
                symbol={option.ticker}
              />
              <Text2 weight="medium">
                {formatBalance(
                  option.balance,
                  parseFloat(option.priceUsd ?? '0'),
                )}
              </Text2>
            </View>
          </AnimatedPressable>
        ))}
      </BottomSheetScrollView>
    </AutoDisplayingBottomSheetModal>
  );
}
