import {
  ApiChain,
  ApiOnchainTransactionSwapEmbed,
} from 'farcaster-client-data';
import {
  parseCaip19TokenUri,
  SkeletonPlaceholder,
  useCachedOrQueryToken,
  useTheme,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import {
  FIXED_TOKEN_FIP2_CARD_HEIGHT,
  TokenCardOnDismiss,
  TokenFIP2Card,
} from '~/components/TokenFIP2Card';

export function CommentBanner({
  tokenCaip19Key,
  tx,
  tokenCardOnDismiss,
}: {
  tokenCaip19Key: string;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const t = useTheme();

  const token = parseCaip19TokenUri(tokenCaip19Key);

  if (typeof token === 'undefined' || token === null) {
    return null;
  }

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
        <CommentBannerContent
          ca={token.ca}
          chain={token.chain}
          tx={tx}
          tokenCardOnDismiss={tokenCardOnDismiss}
        />
      </React.Suspense>
    </View>
  );
}

function CommentBannerContent({
  ca,
  chain,
  tx,
  tokenCardOnDismiss,
}: {
  ca: string;
  chain: ApiChain;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  tokenCardOnDismiss: TokenCardOnDismiss;
}) {
  const { data: token } = useCachedOrQueryToken({ chain, ca });

  if (typeof token === 'undefined') {
    return null;
  }

  return (
    <TokenFIP2Card
      token={{
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
      }}
      tx={tx}
      tokenCardOnDismiss={tokenCardOnDismiss}
    />
  );
}
