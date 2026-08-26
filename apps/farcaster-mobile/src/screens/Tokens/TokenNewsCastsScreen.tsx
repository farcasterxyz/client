import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiCast } from 'farcaster-client-data';
import { extractCastKey } from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { FlatList, ListRenderItem } from 'react-native';

import { Cast } from '~/components/casts/Cast';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type TokenNewsCastsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenNewsCasts'
>;

const TokenNewsCastsScreen = buildScreen<TokenNewsCastsScreenProps>(
  { name: 'TokenNewsCasts', insetTop: false, themeV2: true },
  ({
    route: {
      params: { newsItem },
    },
  }) => {
    const t = useTheme();

    const renderItem: ListRenderItem<ApiCast> = useCallback(
      ({ item: cast }) => {
        return (
          <Cast
            cast={cast}
            hideActions={false}
            showChannelTags={true}
            avatarDiameter={40}
          />
        );
      },
      [],
    );

    const keyExtractor = useCallback((cast: ApiCast) => {
      return extractCastKey(cast);
    }, []);

    if (!newsItem) {
      return null;
    }

    if (!newsItem.casts || newsItem.casts.length === 0) {
      return null;
    }

    return (
      <FlatList
        data={newsItem.casts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[t.pB4]}
      />
    );
  },
);

TokenNewsCastsScreen.displayName = 'TokenNewsCastsScreen';

export { TokenNewsCastsScreen };
