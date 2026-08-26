import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiTokenLink } from 'farcaster-client-data';
import {
  ExploreTokens,
  ExploreTokensVia,
  tokenLinkToMinimalToken,
  useRecentlySearchedTokens,
} from 'farcaster-expo';
import React from 'react';

import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { WalletStackParamList } from '~/types';

type WalletExploreScreenProps = NativeStackScreenProps<
  WalletStackParamList,
  'WalletExplore'
>;

const WalletExploreScreen = buildScreen<WalletExploreScreenProps>(
  {
    name: 'WalletExplore',
    insetTop: true,
    themeV2: true,
  },
  ({
    route: {
      params: { prefilledQuery },
    },
  }) => {
    const push = usePush();
    const { trackRecentlySearchedTokens } = useRecentlySearchedTokens();
    const { trackEvent } = useAnalytics();

    const onSelectToken = React.useCallback(
      (token: ApiTokenLink, via: ExploreTokensVia) => {
        trackEvent(AnalyticsEvent.ViewWalletExploreToken, {
          chain: token.chain,
          ca: token.ca,
        });
        if (via === 'explore_search_query' || via === 'explore_search_ca') {
          trackRecentlySearchedTokens([tokenLinkToMinimalToken(token)]);
        }
        push('Token', {
          chain: token.chain,
          ca: token.ca,
          via,
        });
      },
      [push, trackEvent, trackRecentlySearchedTokens],
    );

    return (
      <ExploreTokens
        onSelectToken={onSelectToken}
        variant="explore"
        prefilledQuery={prefilledQuery}
      />
    );
  },
);
export { WalletExploreScreen };
