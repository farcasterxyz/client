import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiOnchainTokenMinimal,
  ApiOnchainTransactionSwapEmbed,
} from 'farcaster-client-data';
import { AnimatedPressable } from 'farcaster-expo';
import React from 'react';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { TokenFIP2CardContent } from './TokenFIP2Card';

function PressableTokenFIP2Card({
  token,
  tx,
  disabled = false,
}: {
  token: ApiOnchainTokenMinimal;
  tx: ApiOnchainTransactionSwapEmbed | undefined;
  disabled?: boolean;
}) {
  const push = usePush();

  const { trackEvent } = useAnalytics();

  const onTokenFIP2Press = React.useCallback(() => {
    if (disabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressFIP2TokenEmbed, {
      ca: token.ca,
      chain: token.chain,
    });

    push('Token', {
      ca: token.ca,
      chain: token.chain,
      via: 'fip2-embed',
    });
  }, [disabled, push, token.ca, token.chain, trackEvent]);

  return (
    <AnimatedPressable onPress={onTokenFIP2Press} disabled={disabled}>
      <TokenFIP2CardContent
        token={token}
        tx={tx}
        tokenCardOnDismiss={undefined}
      />
    </AnimatedPressable>
  );
}

export { PressableTokenFIP2Card };
