import {
  ApiOnchainTokenMinimal,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import { useTokenLinks } from 'farcaster-client-hooks';
import {
  SkeletonPlaceholder,
  useTheme,
  useWalletBalances,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import {
  FIXED_TOKEN_FIP2_CARD_HEIGHT,
  TokenCardOnDismiss,
  TokenFIP2Card,
} from '~/components/TokenFIP2Card';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

function useTokenSearch({ ticker }: { ticker: string }): {
  token: ApiOnchainTokenMinimal | undefined;
} {
  const { balances } = useWalletBalances();
  const { fid: viewerFid } = useCurrentUser_UNSAFE();
  const { data: tokenLinks } = useTokenLinks({
    ticker: ticker,
    intent: 'typeahead',
    contextFid: viewerFid,
  });

  const matchFromBalances = balances.find(
    (o) =>
      typeof o.token !== 'undefined' &&
      typeof o.symbol !== 'undefined' &&
      o.symbol.toLowerCase() === ticker.toLowerCase() &&
      !o.hidden &&
      !o.userHidden,
  );

  if (
    typeof matchFromBalances !== 'undefined' &&
    matchFromBalances !== null &&
    typeof matchFromBalances.token !== 'undefined'
  ) {
    const token = matchFromBalances.token;

    return {
      token: {
        ca: token.ca,
        chain: token.chain,
        decimals: token.decimals || 0,
        imageUrl: token.imageUrl,
        name: token.name,
        priceUsd: Number(token.priceUsd || 0),
        symbol: token.ticker,
        marketCap: token.marketCap,
        priceChangePct: token.priceChangePct?.h6,
        volumeH6: token.volume?.h6,
      },
    };
  }

  if (
    typeof tokenLinks !== 'undefined' &&
    typeof tokenLinks.tokens !== 'undefined' &&
    tokenLinks.tokens.length !== 0
  ) {
    const token = tokenLinks.tokens[0];

    if (
      token.name.toLowerCase() !== ticker.toLowerCase() &&
      token.ticker.toLowerCase() !== ticker.toLowerCase()
    ) {
      return { token: undefined };
    }

    return {
      token: {
        ca: token.ca,
        chain: token.chain,
        decimals: token.decimals || 0,
        imageUrl: token.imageUrl,
        name: token.name,
        priceUsd: Number(token.priceUsd || 0),
        symbol: token.ticker,
        marketCap: token.marketCap,
        priceChangePct: token.priceChangePct?.h6,
        volumeH6: token.volume?.h6,
      },
    };
  }

  return { token: undefined };
}

export function CommentBannerForTicker({
  ticker,
  setTokenKeyOnLoad,
  tokenCardOnDismiss,
}: {
  ticker: string;
  setTokenKeyOnLoad: (tokenKey: string) => void;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const t = useTheme();

  return (
    <View style={[t.mX4]}>
      <React.Suspense
        fallback={
          <SkeletonPlaceholder
            style={[
              {
                width: '100%',
                height: FIXED_TOKEN_FIP2_CARD_HEIGHT,
                borderRadius: 12,
              },
            ]}
          />
        }
      >
        <CommentBannerForTickerContent
          ticker={ticker}
          setTokenKeyOnLoad={setTokenKeyOnLoad}
          tokenCardOnDismiss={tokenCardOnDismiss}
        />
      </React.Suspense>
    </View>
  );
}

export function CommentBannerForTickerContent({
  ticker,
  setTokenKeyOnLoad,
  tokenCardOnDismiss,
}: {
  ticker: string;
  setTokenKeyOnLoad: (tokenKey: string) => void;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const { token } = useTokenSearch({ ticker });

  const tokenKey = React.useMemo(() => {
    if (typeof token === 'undefined') {
      return undefined;
    }

    return buildCaip19TokenUri(token.chain, token.ca);
  }, [token]);

  const tokenKeySetRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (
      (typeof tokenKeySetRef.current === 'undefined' ||
        tokenKeySetRef.current === null) &&
      typeof tokenKey !== 'undefined'
    ) {
      tokenKeySetRef.current = tokenKey;

      setTokenKeyOnLoad(tokenKey);
    }

    return () => {
      tokenKeySetRef.current = undefined;
    };
  }, [setTokenKeyOnLoad, tokenKey]);

  if (typeof tokenKey === 'undefined' || typeof token === 'undefined') {
    return null;
  }

  return (
    <TokenFIP2Card
      token={token}
      tx={undefined}
      tokenCardOnDismiss={tokenCardOnDismiss}
    />
  );
}
