import { FlashList, ListRenderItem } from '@shopify/flash-list';
import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
} from 'farcaster-client-data';
import * as React from 'react';
import { View } from 'react-native';

import { useEmbeddedWallet, useTheme } from '../../../../contexts';
import {
  useOptionalSafeAreaInsets,
  useWalletBalances,
  useWalletGeoRestricted,
} from '../../../../hooks';
import { tokenPositionToTokenLink } from '../../../../utils/CryptoUtils';
import { tokenPositionSupportsLimitOrder } from '../../../../utils/LimitOrderUtils';
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
 * Shared "choose the primary token" picker for the limit-order flow.
 * Sell: search + balances filtered to limit-order-eligible positions.
 * Buy: browse any listable token via ExploreTokens.
 * Selection + navigation is delegated to the platform wrapper via
 * onSelectToken / onBack (mobile: React Navigation, web: Expo Router).
 */
export function WalletLimitOrderSelectToken({
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
      if (position.userHidden) {
        return false;
      }
      if (!tokenPositionSupportsLimitOrder(position)) {
        return false;
      }
      if (!q) return true;
      return (
        position.symbol?.toLowerCase().includes(q) ||
        position.name?.toLowerCase().includes(q) ||
        position.address?.toLowerCase().includes(q)
      );
    });
  }, [balances, query]);

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
          style={[t.flex1]}
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

  return (
    <ExploreTokens
      onSelectToken={onSelectToken}
      selectedToken={selectedToken}
      limitOrdersOnly
    />
  );
}
