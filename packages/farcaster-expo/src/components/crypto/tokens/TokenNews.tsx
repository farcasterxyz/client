import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiTokenNewsItem } from 'farcaster-client-data';
import { TrendingUp } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { Avatar } from '../../Avatar';
import { Text2 } from '../../design-system';

const PFP_DISPLAY_LIMIT = 3;

export function TokenNews({
  newsItems,
  showAuthors = false,
}: {
  symbol: string;
  newsItems: ApiTokenNewsItem[];
  showAuthors: boolean;
}) {
  const t = useTheme();
  // const { push } = useSharedNavigationContext();

  const getUniqueAuthors = React.useCallback((item: ApiTokenNewsItem) => {
    if (!item.casts || item.casts.length === 0) {
      return [];
    }

    // Get unique authors from the news item's casts
    return item.casts
      .map((cast) => cast.author)
      .filter(
        (author, index, arr) =>
          // Remove duplicates by fid
          arr.findIndex((a) => a.fid === author.fid) === index,
      )
      .slice(0, PFP_DISPLAY_LIMIT)
      .reverse();
  }, []);

  const renderNewsItem: ListRenderItem<ApiTokenNewsItem> = React.useCallback(
    ({ item, index }) => {
      const authors = showAuthors ? getUniqueAuthors(item) : [];

      return (
        // <TouchableOpacity
        //   onPress={() =>
        //     push({
        //       path: 'TokenNewsCasts',
        //       params: {
        //         symbol: symbol,
        //         newsItem: item,
        //       },
        //     })
        //   }
        // >
        <View
          style={[
            t.pX4,
            t.pY3,
            { gap: 8 },
            t.borders.secondary,
            t.borderT,
            index === newsItems.length - 1 ? t.borderB : null,
          ]}
        >
          <View style={[t.flexRow, t.itemsStart, { gap: 12 }]}>
            <TrendingUp size={16} color={t.colors.text.brand} style={t.mT1} />
            <Text2
              style={[
                t.texts.primary,
                t.flex1,
                { lineHeight: 20 },
                t.textSm,
                t.fontNormal,
              ]}
              size="sm"
              weight="medium"
            >
              {item.title}
            </Text2>
          </View>
          {authors.length > 0 && (
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                { paddingLeft: 28 }, // Align with text (16px icon + 12px gap)
              ]}
            >
              {authors.map((author, i) => (
                <View
                  key={author.fid}
                  style={[{ marginLeft: i === 0 ? 0 : -6 }]}
                >
                  <Avatar pfpUrl={author.pfp?.url} diameter={20} />
                </View>
              ))}
            </View>
          )}
        </View>
        // </TouchableOpacity>
      );
    },
    [showAuthors, t, newsItems.length, getUniqueAuthors],
  );

  if (!newsItems || newsItems.length === 0) {
    return null;
  }

  return (
    <FlashList
      data={newsItems}
      renderItem={renderNewsItem}
      keyExtractor={(item, index) => `${item.title}-${index}`}
    />
  );
}
