import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
} from 'farcaster-client-data';
import * as React from 'react';
import { View } from 'react-native';
import { isAddress } from 'viem';

import { useEmbeddedWallet, useTheme } from '../../../../contexts';
import {
  useOptionalSafeAreaInsets,
  useWalletBalances,
  useWalletGeoRestricted,
} from '../../../../hooks';
import {
  isNativeAsset,
  tokenPositionToTokenLink,
} from '../../../../utils/CryptoUtils';
import { SearchInput, Text2 } from '../../../design-system';
import {
  WalletNotAvailableInRegion,
  WalletNotConnected,
} from '../../../wallet/auth';
import { WalletScreenHeader } from '../../../wallet/WalletScreenHeader';
import { ExploreTokens } from '../ExploreTokens';
import { TokenListItem } from '../TokenListItem';
import { useWalletLimitOrder } from './WalletLimitOrderProvider';

/**
 * Shared "choose the funding token" picker for the limit-order flow (the
 * opposite side of the trade). Sell: browse quote-eligible tokens via
 * ExploreTokens. Buy: search + balances filtered to same-chain, non-native,
 * non-selected positions. Selection + navigation delegated to the platform
 * wrapper via onSelectToken / onBack.
 */
export function WalletLimitOrderSelectFundingToken({
  onSelectToken,
  onBack,
}: {
  onSelectToken: (token: ApiTokenLink) => void;
  onBack: () => void;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { evmAddress } = useEmbeddedWallet();
  const { balances } = useWalletBalances();
  const { kind, selectedToken } = useWalletLimitOrder();
  const geoRestricted = useWalletGeoRestricted();
  const [query, setQuery] = React.useState('');

  const filteredPositions = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return balances.filter((position) => {
      if (
        position.userHidden ||
        position.hidden ||
        position.walletContext?.hidden
      ) {
        return false;
      }
      if (
        selectedToken &&
        (position.chain !== selectedToken.chain ||
          !position.address ||
          isNativeAsset(position.address) ||
          !isAddress(position.address) ||
          position.address.toLowerCase() === selectedToken.ca.toLowerCase())
      ) {
        return false;
      }
      if (!q) return true;
      return (
        position.symbol?.toLowerCase().includes(q) ||
        position.name?.toLowerCase().includes(q) ||
        position.address?.toLowerCase().includes(q)
      );
    });
  }, [balances, query, selectedToken]);

  const renderItem = React.useCallback<
    ListRenderItem<ApiEthFungibleTokenPosition>
  >(
    ({ item: position }) => {
      const token = tokenPositionToTokenLink(position);
      return (
        <TokenListItem
          token={token}
          onPress={() => onSelectToken(token)}
          variant="balance"
          ownedAmount={position.quantity.float}
          ownedValue={position.value}
        />
      );
    },
    [onSelectToken],
  );

  const keyExtractor = React.useCallback(
    (position: ApiEthFungibleTokenPosition) => position.id,
    [],
  );

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-limit-order" />;
  }

  if (kind === 'sell') {
    return (
      <ExploreTokens
        onSelectToken={onSelectToken}
        selectedToken={selectedToken}
        limitOrderQuoteOnly
      />
    );
  }

  return (
    <View style={[t.flex1, t.bgDefault]}>
      <WalletScreenHeader title="Choose token" onBackCallback={onBack} />
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
      <FlashList
        data={filteredPositions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={[t.pX3]}>
            <Text2 color="tertiary" align="center">
              No tokens available
            </Text2>
          </View>
        }
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      />
    </View>
  );
}
