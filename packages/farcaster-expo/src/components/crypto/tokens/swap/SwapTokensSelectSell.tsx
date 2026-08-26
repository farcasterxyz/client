import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
  isUsdc,
} from 'farcaster-client-data';
import { CreditCard } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

import {
  useEmbeddedWallet,
  useSharedNavigationContext,
  useTheme,
} from '../../../../contexts';
import {
  useOptionalSafeAreaInsets,
  useWalletBalances,
} from '../../../../hooks';
import { isNativeAsset, tokenPositionToTokenLink } from '../../../../utils';
import {
  AnimatedPressable,
  SearchInput,
  Text2,
  Typography,
} from '../../../design-system';
import { WalletScreenHeader } from '../../../wallet/WalletScreenHeader';
import { TokenListItem } from '../TokenListItem';
import { useSwapTokens } from './SwapTokensProvider';
import { SwapTokensSelectNoTokensFound } from './SwapTokensSelectNoTokensFound';

type AssetPickerType = 'crypto' | 'cash';

export function SwapTokensSelectSell({
  onSelectToken,
  onSelectCash,
}: {
  onSelectToken: (token: ApiTokenLink) => void;
  onSelectCash: () => void;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { evmAddress } = useEmbeddedWallet();
  const { buyToken, isSellExperience } = useSwapTokens();
  const { balances } = useWalletBalances();
  const { goBack } = useSharedNavigationContext();

  const [query, setQuery] = React.useState('');
  const [assetPickerType] = React.useState<AssetPickerType>('crypto');

  const filteredPositions = useMemo(() => {
    let filtered = balances;
    filtered = filtered.filter(
      (p) => !p.walletContext?.hidden || !p.userHidden,
    );
    if (buyToken) {
      filtered = balances.filter((p) => {
        if (p.chain !== buyToken.chain) {
          return true;
        }

        const isBuyNative = isNativeAsset(buyToken.ca);
        const isTokenNative = isNativeAsset(p.address);
        if (isBuyNative && isTokenNative) {
          return false;
        }

        return p.address?.toLowerCase() !== buyToken?.ca?.toLowerCase();
      });
    }

    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (token) =>
          token.symbol?.toLowerCase().includes(q) ||
          token.name?.toLowerCase().includes(q) ||
          token.address?.toLowerCase().includes(q),
      );
    }

    if (isSellExperience) {
      filtered = filtered.filter((p) => !isUsdc(p.address));
    }

    return filtered;
  }, [balances, query, buyToken, isSellExperience]);

  const keyExtractor = useCallback((position: ApiEthFungibleTokenPosition) => {
    return position.id;
  }, []);

  const renderItem = useCallback<ListRenderItem<ApiEthFungibleTokenPosition>>(
    ({ item: position }) => {
      const minimalToken = tokenPositionToTokenLink(position);
      return (
        <TokenListItem
          token={tokenPositionToTokenLink(position)}
          onPress={() => onSelectToken(minimalToken)}
          variant="balance"
          ownedAmount={position.quantity.float}
          ownedValue={position.value}
        />
      );
    },
    [onSelectToken],
  );

  const ListEmptyComponent = useMemo(() => {
    if (balances.length === 0) {
      return <SwapTokensSelectNoTokensFound address={evmAddress!} />;
    }

    return (
      <View>
        <Text2 color="tertiary" align="center">
          No results found for "{query}"
        </Text2>
      </View>
    );
  }, [balances, evmAddress, query]);

  const displayCryptoList = useMemo(() => {
    return assetPickerType === 'crypto';
  }, [assetPickerType]);

  const displayCashList = useMemo(() => {
    return assetPickerType === 'cash';
  }, [assetPickerType]);

  const handleSelectCash = useCallback(() => {
    onSelectCash();
  }, [onSelectCash]);

  return (
    <View style={[t.hFull]}>
      <WalletScreenHeader title="Choose token" onBackCallback={goBack} />
      <View style={[t.pX3, t.pB3]}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tokens"
          width="100%"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            t.backgrounds.secondary,
            t.borderHairline,
            t.borders.primary,
            { borderRadius: 12 },
          ]}
        />
      </View>
      {displayCryptoList && (
        <FlashList
          data={filteredPositions}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        />
      )}
      {displayCashList && (
        <AnimatedPressable
          onPress={handleSelectCash}
          style={[t.flexRow, t.itemsCenter, t.p3, { gap: 12 }]}
        >
          <View
            style={[
              t.backgrounds.tertiary,
              t.justifyCenter,
              t.itemsCenter,
              {
                width: 32,
                height: 32,
                borderRadius: 8,
              },
            ]}
          >
            <CreditCard
              size={20}
              color={t.colors.text.primary}
              strokeWidth={2}
            />
          </View>
          <View style={[t.flex1, t.flexCol, t.gap1]}>
            <Typography label="Body/Medium/Strong" numberOfLines={1}>
              Buy with credit card
            </Typography>
            {/* <Typography color="tertiary" label="Body/Small" numberOfLines={1}>
              Buy USDC to trade on Farcaster
            </Typography> */}
          </View>
        </AnimatedPressable>
      )}
    </View>
  );
}
