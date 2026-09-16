import {
  ApiEthFungibleTokenPosition,
  ApiTokenLink,
} from 'farcaster-client-data';
import {
  formatAmount,
  formatTokenName,
  useHideToken,
  useUnhideToken,
} from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { useTheme } from '../../contexts';
import {
  useCurrentUserFid,
  useWalletBalances,
  useWalletBalancesHidden,
} from '../../hooks';
import { formatAssetId, tokenPositionToTokenLink } from '../../utils';
import { TokenIcon } from '../crypto';
import { SearchInput, Switch, Text2 } from '../design-system';

// FIXME: This paging logic is 1:1 from wallet token balances implemnentation
// so we really want to eventually get to common usage here.
// iOS doesn't really need pagination so just make it a big number
const PAGE_SIZE = 25;

function ManageTokens() {
  const t = useTheme();

  const { balances } = useWalletBalances();

  const [query, setQuery] = React.useState('');

  const [page, setPage] = React.useState(1);

  const onEndReached = React.useCallback(() => {
    setPage(page + 1);
  }, [page]);

  const { positions } = React.useMemo(() => {
    // Pre-transform all tokens to avoid repeated computation
    const transformed = balances.slice(0, page * PAGE_SIZE).map((position) => ({
      position,
      token: tokenPositionToTokenLink(position),
    }));

    const filtered = transformed.filter(
      ({ position: balance }) =>
        balance.symbol?.toLowerCase().includes(query.toLowerCase()) ||
        balance.name?.toLowerCase().includes(query.toLowerCase()),
    );

    return {
      positions: filtered,
    };
  }, [balances, page, query]);

  const renderItem = React.useCallback(
    ({
      item,
    }: {
      item: {
        position: ApiEthFungibleTokenPosition;
        token: ApiTokenLink;
      };
      index: number;
    }) => {
      return <TokenItemToManage item={item} />;
    },
    [],
  );

  const keyExtractor = React.useCallback(
    (item: { position: ApiEthFungibleTokenPosition; token: ApiTokenLink }) => {
      return formatAssetId(item.position.chain, item.position.address);
    },
    [],
  );

  return (
    <View style={[t.flex, t.flexCol]}>
      <View style={[t.pX3, t.pB3]}>
        <SearchInput
          width="100%"
          placeholder="Search for token"
          value={query}
          onChangeText={setQuery}
          align="left"
        />
      </View>
      <FlatList
        data={positions}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={0.15}
        onEndReached={onEndReached}
        keyboardShouldPersistTaps="always"
      />
    </View>
  );
}

function TokenItemToManage({
  item,
}: {
  item: {
    position: ApiEthFungibleTokenPosition;
    token: ApiTokenLink;
  };
}) {
  const t = useTheme();
  const fid = useCurrentUserFid();

  const hideToken = useHideToken();
  const unhideToken = useUnhideToken();

  const [balancesHidden] = useWalletBalancesHidden();

  const hidden = item.position.userHidden;

  const [localHiddenState, setLocalHiddenState] = React.useState<
    boolean | undefined
  >(undefined);

  const userHiddenItemState =
    typeof localHiddenState === 'undefined' ? hidden : localHiddenState;

  const handleTokenPress = React.useCallback(
    (value: boolean) => {
      if (typeof fid === 'undefined') {
        return;
      }

      setLocalHiddenState(!value);

      if (hidden) {
        unhideToken({ fid, ca: item.token.ca, chain: item.token.chain });
      } else {
        hideToken({ fid, ca: item.token.ca, chain: item.token.chain });
      }
    },
    [fid, hidden, hideToken, item.token.ca, item.token.chain, unhideToken],
  );

  const token = item.token;
  const position = item.position;
  const balance = React.useMemo(() => {
    if (balancesHidden) {
      return '*****';
    }

    return formatAmount(position.quantity.float);
  }, [balancesHidden, position.quantity.float]);

  return (
    <View
      key={token.ca}
      style={[
        t.wFull,
        t.flexRow,
        t.itemsCenter,
        t.wFull,
        t.h16,
        t.pY3,
        t.overflowHidden,
        t.mL3,
        t.pR4,
      ]}
    >
      <View
        style={[
          t.flex1,
          t.flexRow,
          t.itemsCenter,
          { gap: 12 },
          userHiddenItemState && [t.opacity25],
        ]}
      >
        <TokenIcon
          iconUrl={token.imageUrl}
          diameter={40}
          chain={token.chain}
          symbol={token.ticker}
          features={token.features}
          badgeOffset={{ top: -2, right: -2 }}
          imageBordered
        />
        <View style={[t.flex1, t.flexCol]}>
          <Text2 weight="medium" numberOfLines={1}>
            {formatTokenName(token.name, token.ca, token.chain)}
          </Text2>
          <Text2 color="tertiary" size="sm">
            {`${balance} ${token.ticker}`}
          </Text2>
        </View>
      </View>
      <Switch
        style={{ transform: [{ scale: 0.8 }] }}
        newColors={true}
        value={!userHiddenItemState}
        onValueChange={handleTokenPress}
      />
    </View>
  );
}

export { ManageTokens };
