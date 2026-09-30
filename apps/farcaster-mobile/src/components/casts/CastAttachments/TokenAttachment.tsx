import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChain, ApiTokenLinkCore } from 'farcaster-client-data';
import {
  useNonSuspenseTokenLinks,
  useTrackEvent,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  tokenLinkToMinimalToken,
  useCachedOrQueryToken,
} from 'farcaster-expo';
import React, { useCallback } from 'react';

import { TokenFIP2CardContent } from '~/components/TokenFIP2Card';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type TokenAttachmentProps = {
  chain: ApiChain;
  ca: string;
  disabled?: boolean;
  skipWrapperStyles?: boolean;
  focusedCastMode?: boolean;
};

function TokenAttachment({
  chain,
  ca,
  disabled = false,
  focusedCastMode = false,
}: TokenAttachmentProps) {
  const { data: token } = useCachedOrQueryToken({
    chain,
    ca,
  });

  if (!token) {
    return null;
  }

  return (
    <TokenAttachmentInner
      token={token}
      disabled={disabled}
      focusedCastMode={focusedCastMode}
    />
  );
}

function TokenAttachmentByCA({
  ca,
  disabled = false,
  focusedCastMode = false,
}: {
  ca: string;
  disabled?: boolean;
  focusedCastMode?: boolean;
}) {
  const { data: tokens } = useNonSuspenseTokenLinks({
    ticker: ca,
  });

  const token = React.useMemo(() => {
    return tokens?.tokens[0];
  }, [tokens]);

  if (!token) {
    return null;
  }

  return (
    <TokenAttachmentInner
      token={token}
      disabled={disabled}
      focusedCastMode={focusedCastMode}
    />
  );
}

function TokenAttachmentInner({
  token,
  disabled = false,
  focusedCastMode = false,
}: {
  token: ApiTokenLinkCore;
  disabled?: boolean;
  focusedCastMode?: boolean;
}) {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useTrackEvent();

  const handlePress = useCallback(() => {
    if (disabled || !token) {
      return;
    }

    push('Token', { chain: token.chain, ca: token.ca, via: 'cast_embed' });
    trackEvent(AnalyticsEvent.PressTokenEmbedOnFeed, {
      ticker: token?.ticker,
      ca: token?.ca,
    });
  }, [push, trackEvent, token, disabled]);

  if (!token) {
    return null;
  }

  return (
    <AnimatedPressable
      style={[t.flexShrink, t.wFull, focusedCastMode ? t.pR3 : undefined]}
      onPress={handlePress}
    >
      <TokenFIP2CardContent
        token={tokenLinkToMinimalToken(token)}
        tx={undefined}
        tokenCardOnDismiss={undefined}
      />
    </AnimatedPressable>
  );
}

export { TokenAttachment, TokenAttachmentByCA };
