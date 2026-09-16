import {
  BottomSheetFlashList,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { ApiTokenLink, buildCaip19TokenUri } from 'farcaster-client-data';
import {
  formatTimeAgo,
  useNonSuspenseTokenLinks,
  useNonSuspenseTokens,
} from 'farcaster-client-hooks';
import {
  AutoDisplayingBottomSheetModal,
  Text2,
  TokenListItem,
  TokenListItemPlaceholder,
  useWalletBalances,
} from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import React, { useCallback } from 'react';
import { View } from 'react-native';

import { BottomSheetSearchInput } from '~/components/BottomSheetSearchInput';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';

type CastTokenSelectorPromptAutoDisplayingProps = {
  onSelect: ({ tokenKey }: { tokenKey: string }) => void;
  onDismiss: () => void;
};

const CastTokenSelectorPromptAutoDisplaying: React.FC<CastTokenSelectorPromptAutoDisplayingProps> =
  React.memo(({ onSelect, onDismiss }) => {
    const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

    const t = useTheme();

    const [query, setQuery] = React.useState('');

    const onTokenSelect = useCallback(
      ({ token }: { token: ApiTokenLink }) => {
        setQuery('');

        onSelect({ tokenKey: buildCaip19TokenUri(token.chain, token.ca) });
      },
      [onSelect],
    );

    const onPromptDismss = useCallback(() => {
      setQuery('');

      onDismiss();
    }, [onDismiss]);

    return (
      <AutoDisplayingBottomSheetModal
        name="TokenSelectorAutoDisplayingPrompt"
        onDismiss={onPromptDismss}
        ref={bottomSheetRef}
        stackBehavior="push"
        snapPoints={['50%', '100%']}
        enableDynamicSizing={false}
      >
        <View style={{ gap: 8, flex: 1 }}>
          <View style={[t.flex, t.wFull]}>
            <View style={[t.mB2]}>
              <BottomSheetSearchInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Search for tokens"
                spellCheck={false}
                width={'100%'}
                onChangeText={(value) => {
                  setQuery(value);
                }}
                value={query}
                align="left"
              />
            </View>
            <BottomSheetScrollView
              contentContainerStyle={[t.flex1, { height: 1000 }]}
              keyboardShouldPersistTaps="handled"
            >
              <CastTokenSelectorSearch query={query} onSelect={onTokenSelect} />
            </BottomSheetScrollView>
          </View>
        </View>
      </AutoDisplayingBottomSheetModal>
    );
  });

CastTokenSelectorPromptAutoDisplaying.displayName =
  'CastTokenSelectorPromptAutoDisplaying';

const CastTokenSelectorSearch: React.FC<{
  query: string;
  onSelect: ({ token }: { token: ApiTokenLink }) => void;
}> = ({ query, onSelect }) => {
  const { tokenIds } = useWalletBalancesTokenIdsForFallback();
  const viewerFid = useCurrentUser_UNSAFE().fid;

  const { data: fallbackTokens } = useNonSuspenseTokens({
    ids: tokenIds,
  });

  const { data, isLoading } = useNonSuspenseTokenLinks({
    ticker: query,
    intent: 'typeahead',
    contextFid: viewerFid,
  });

  const tokens = React.useMemo(() => {
    return uniqBy(
      query === '' ? fallbackTokens : data?.tokens || [],
      ({ chain, ca }) => `${chain}:${ca}`,
    );
  }, [data, fallbackTokens, query]);

  const extraData = useCommonFlatListExtraData();

  const { triggerImpactAsync } = useHaptics();

  const t = useTheme();

  const renderItem = React.useCallback(
    ({ item }: { item: ApiTokenLink }) => {
      // Show ticker + formatTimeAgo as subtitle
      const subtitleComponent = (
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          {item.ticker && (
            <Text2
              color="tertiary"
              weight="medium"
              style={{ fontSize: 13, lineHeight: 15 }}
            >
              {item.ticker}
            </Text2>
          )}
          {item.source?.createdAt && (
            <>
              {item.ticker && (
                <Text2
                  color="tertiary"
                  weight="medium"
                  style={{ fontSize: 13, lineHeight: 15 }}
                >
                  ∙
                </Text2>
              )}
              <Text2
                color="tertiary"
                weight="medium"
                style={{ fontSize: 13, lineHeight: 15 }}
              >
                {formatTimeAgo(item.source.createdAt)}
              </Text2>
            </>
          )}
        </View>
      );
      return (
        <TokenListItem
          token={item}
          onPress={() => {
            triggerImpactAsync();

            onSelect({ token: item });
          }}
          subtitleComponent={subtitleComponent}
        />
      );
    },
    [onSelect, triggerImpactAsync, t],
  );

  const keyExtractor = React.useCallback((item: ApiTokenLink) => {
    return `${item.chain}:${item.ca}`;
  }, []);

  if (tokens.length === 0 && isLoading) {
    return <TokenListItemPlaceholder avatarSize={48} />;
  }

  return (
    <BottomSheetFlashList
      data={tokens}
      extraData={extraData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
    />
  );
};

function useWalletBalancesTokenIdsForFallback() {
  const { balances } = useWalletBalances();

  // Capping the max on balances to 20 as otherwise query is suspending
  // far too long. Should be sufficient in this case anyway.
  const walletBalanceTokenIds = balances.slice(0, 20).map((token) => token.id);

  return { tokenIds: walletBalanceTokenIds };
}

export { CastTokenSelectorPromptAutoDisplaying };
