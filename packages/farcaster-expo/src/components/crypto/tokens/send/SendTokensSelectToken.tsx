import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiEthFungibleTokenPosition } from 'farcaster-client-data';
import { ChevronDown, ChevronUp, Coins } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, View } from 'react-native';

import { hitSlop } from '../../../../constants';
import { useTheme } from '../../../../contexts';
import { useOptionalSafeAreaInsets } from '../../../../hooks/useOptionalSafeAreaInsets';
import { useWalletBalances } from '../../../../hooks/useWalletBalances';
import { tokenPositionToTokenLink } from '../../../../utils';
import { HeaderListItem, SearchInput, Text2 } from '../../../design-system';
import { YourTokensListEmpty } from '../../../wallet/YourTokensListEmpty';
import { TokenListItem, TokenListItemPlaceholder } from '../TokenListItem';
import { useSendTokens } from './SendTokensProvider';

const INIT_TOKEN_DISPLAY_COUNT = 99;

export function SendTokensSelectToken({
  selectToken,
}: {
  selectToken: (position: ApiEthFungibleTokenPosition) => void;
}) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { evmAddress } = useSendTokens();
  const { balances, isPending, isError } = useWalletBalances();
  const [query, setQuery] = useState('');

  const [showHiddenPositions, setShowHiddenPositions] = useState(false);

  useEffect(() => {
    if (query) {
      setShowHiddenPositions(true);
    } else {
      setShowHiddenPositions(false);
    }
  }, [query]);

  const renderTokenListItem = useCallback<
    ListRenderItem<ApiEthFungibleTokenPosition | 'token'>
  >(
    ({ item: position }) => {
      if (position === 'token') {
        return (
          <HeaderListItem
            Icon={(props) => <Coins {...props} />}
            title="My tokens"
          />
        );
      }

      return (
        <TokenListItem
          token={tokenPositionToTokenLink(position)}
          onPress={() => selectToken(position)}
          variant="balance"
          ownedAmount={position.quantity.float}
          ownedValue={position.value}
        />
      );
    },
    [selectToken],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isPending) {
      return (
        <View>
          {Array.from({ length: 5 }).map((_, index) => (
            <TokenListItemPlaceholder key={index} />
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View>
          <Text2 color="tertiary" align="center">
            Failed to retrieve your tokens
          </Text2>
        </View>
      );
    }

    if (query) {
      return null;
    }

    return <YourTokensListEmpty address={evmAddress ?? ''} />;
  }, [isPending, isError, evmAddress, query]);

  const hasMorePositions = useMemo(() => {
    if (balances.some((position) => position.hidden)) {
      return true;
    }

    if (
      balances.filter((position) => !position.hidden).length >
      INIT_TOKEN_DISPLAY_COUNT
    ) {
      return true;
    }

    return false;
  }, [balances]);

  const ListFooterComponent = useMemo(() => {
    if (hasMorePositions && !query) {
      return (
        <ExpandToggle
          expanded={showHiddenPositions}
          onToggle={() => {
            setShowHiddenPositions(!showHiddenPositions);
          }}
        />
      );
    }
    return null;
  }, [hasMorePositions, showHiddenPositions, query]);

  const filteredBalances = useMemo(() => {
    const balancesToCheck = showHiddenPositions
      ? balances
      : balances
          .filter((position) => !position.hidden)
          .slice(0, INIT_TOKEN_DISPLAY_COUNT);

    return balancesToCheck.filter(
      (balance) =>
        balance.symbol?.toLowerCase().includes(query.toLowerCase()) ||
        balance.name?.toLowerCase().includes(query.toLowerCase()),
    );
  }, [balances, query, showHiddenPositions]);

  return (
    <KeyboardAvoidingView
      style={[t.flex1]}
      behavior="padding"
      keyboardVerticalOffset={100}
    >
      <View style={[t.pX3, t.pB3]}>
        <SearchInput
          width="100%"
          placeholder="Search for token"
          value={query}
          onChangeText={setQuery}
          align="left"
        />
      </View>
      <FlashList
        data={filteredBalances}
        renderItem={renderTokenListItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        getItemType={(item) => {
          if (typeof item === 'string') {
            return 'header';
          }

          return 'token';
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      />
    </KeyboardAvoidingView>
  );
}

function ExpandToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();

  return (
    <View style={[t.p3, t.flexRow]}>
      <Pressable
        style={[
          t.pY2,
          t.pL3,
          t.pR2,
          t.roundedFull,
          { gap: 8 },
          t.flexRow,
          t.itemsCenter,
          t.bgFaint,
        ]}
        hitSlop={hitSlop}
        onPress={onToggle}
      >
        {expanded ? (
          <>
            <Text2 color="secondary" size="sm" weight="semibold">
              Show less
            </Text2>
            <ChevronUp color={t.colors.text.secondary} size={20} />
          </>
        ) : (
          <>
            <Text2 color="secondary" size="sm" weight="semibold">
              Show all
            </Text2>
            <ChevronDown color={t.colors.text.secondary} size={20} />
          </>
        )}
      </Pressable>
    </View>
  );
}
