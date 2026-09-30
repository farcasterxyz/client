import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiChain, ApiTokenLink } from 'farcaster-client-data';
import {
  formatTimeAgo,
  useNonSuspenseTokenLinks,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../contexts/ThemeContext';
import { useCurrentUserFid } from '../../../hooks/useCurrentUser';
import { tokenLinkToMinimalToken } from '../../../utils/CryptoUtils';
import { Text2 } from '../../design-system/Text';
import { useRecentlySearchedTokens } from './swap/useRecentlySearchedTokens';
import { TokenListItem, TokenListItemPlaceholder } from './TokenListItem';

interface TokenSearchResultsProps {
  query: string;
  debouncedQuery: string;
  onSelectToken: (token: ApiTokenLink) => void;
  chain?: ApiChain;
}

export function TokenSearchResults({
  query,
  debouncedQuery,
  onSelectToken,
  chain,
}: TokenSearchResultsProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { trackRecentlySearchedTokens } = useRecentlySearchedTokens();
  const viewerFid = useCurrentUserFid();

  // Fetch search results
  const { data, isPending } = useNonSuspenseTokenLinks({
    ticker: debouncedQuery,
    chain,
    intent: 'typeahead',
    contextFid: viewerFid,
  });

  const searchTokens = useMemo(() => {
    return data?.tokens || [];
  }, [data]);

  // Handle token selection
  const handleSelectToken = useCallback(
    (token: ApiTokenLink) => {
      trackRecentlySearchedTokens([tokenLinkToMinimalToken(token)]);
      onSelectToken(token);
    },
    [onSelectToken, trackRecentlySearchedTokens],
  );

  const keyExtractor = useCallback((token: ApiTokenLink) => {
    return `${token.chain}:${token.ca}`;
  }, []);

  const renderItem = useCallback<ListRenderItem<ApiTokenLink>>(
    ({ item }) => {
      // Always show ticker + age as subtitle
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
          onPress={handleSelectToken}
          subtitleComponent={subtitleComponent}
        />
      );
    },
    [handleSelectToken, t],
  );

  const ListEmptyComponent = useMemo(() => {
    // Loading state
    if (isPending && debouncedQuery) {
      return (
        <View>
          {Array.from({ length: 5 }).map((_, index) => (
            <TokenListItemPlaceholder key={index} hideValue />
          ))}
        </View>
      );
    }

    // No results found
    if (!isPending && debouncedQuery && searchTokens.length === 0) {
      return (
        <View style={[t.p4]}>
          <Text2 color="tertiary" align="center">
            No results found for "{debouncedQuery}"
          </Text2>
        </View>
      );
    }

    return null;
  }, [isPending, debouncedQuery, searchTokens.length, t]);

  // Determine what data to show
  const displayData = useMemo(() => {
    if (query) {
      return searchTokens;
    }
    return []; // Recent tokens are shown in ListHeaderComponent
  }, [query, searchTokens]);

  return (
    <FlashList
      data={displayData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="always"
    />
  );
}
