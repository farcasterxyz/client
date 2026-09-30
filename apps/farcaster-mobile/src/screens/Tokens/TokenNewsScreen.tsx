import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TokenNews } from 'farcaster-expo';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { CommonStackParamList } from '~/types';

type TokenNewsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenNews'
>;

const TokenNewsScreen = buildScreen<TokenNewsScreenProps>(
  { name: 'TokenNews', insetTop: false, themeV2: true },
  ({
    route: {
      params: { newsItems, symbol },
    },
  }) => {
    if (!newsItems || !symbol) {
      return null;
    }
    return (
      <TokenNews newsItems={newsItems} symbol={symbol} showAuthors={false} />
    );
  },
);

TokenNewsScreen.displayName = 'TokenNewsScreen';

export { TokenNewsScreen };
