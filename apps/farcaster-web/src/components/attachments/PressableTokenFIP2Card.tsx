import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
} from 'farcaster-client-data';
import React, { useCallback } from 'react';

import { useOptionalEmbeddedWalletBridge } from '~/components/EmbeddedWallet';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';

import { TokenFIP2CardContent } from './TokenFIP2Card';

function PressableTokenFIP2Card({
  token,
  tx,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
}) {
  const navigate = useExternalNavigate();
  const embeddedWalletBridge = useOptionalEmbeddedWalletBridge();
  const navigateInWallet = embeddedWalletBridge?.navigate;
  const isGeoRestricted = useWalletGeoRestricted();

  const { trackEvent } = useAnalytics();

  const onTokenFIP2Press = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      trackEvent(AnalyticsEvent.PressFIP2TokenEmbed, {
        ca: token.ca,
        chain: token.chain,
      });

      if (!isGeoRestricted && navigateInWallet) {
        navigateInWallet({
          path: 'Token',
          params: {
            chain: token.chain,
            ca: token.ca,
            via: 'fip2-embed',
          },
        });
      } else {
        const url = `https://dexscreener.com/${token.chain}/${token.ca}`;
        navigate({ to: url, openInNewTab: true });
      }
    },
    [
      navigate,
      navigateInWallet,
      isGeoRestricted,
      token.ca,
      token.chain,
      trackEvent,
    ],
  );

  return (
    <div
      className="relative w-full cursor-pointer rounded-[12px]"
      onClick={onTokenFIP2Press}
    >
      <TokenFIP2CardContent
        token={token}
        tx={tx}
        tokenCardOnDismiss={undefined}
      />
    </div>
  );
}

export { PressableTokenFIP2Card };
