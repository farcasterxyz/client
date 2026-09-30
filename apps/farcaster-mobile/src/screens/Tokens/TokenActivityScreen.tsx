import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useToken } from 'farcaster-client-hooks';
import { TokenActivity } from 'farcaster-expo';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { CommonStackParamList } from '~/types';

type TokenActivityScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenActivity'
>;

const TokenActivityScreen = buildScreen<TokenActivityScreenProps>(
  { name: 'TokenActivity', insetTop: true, themeV2: true },
  ({
    route: {
      params: { chain, ca },
    },
  }) => {
    const { data: token } = useToken({
      params: {
        chain,
        ca,
      },
    });

    if (!token?.token) {
      return null;
    }

    return <TokenActivity token={token.token} />;
  },
);

TokenActivityScreen.displayName = 'TokenActivityScreen';

export { TokenActivityScreen };
