import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTokenLinkCore } from 'farcaster-client-data';
import React from 'react';
import { TextStyle } from 'react-native';

import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { usePush } from '~/hooks/navigation/usePush';

function UpdatedTokenLink({
  token,
  style,
  castAuthorFid,
}: {
  token: ApiTokenLinkCore;
  style: TextStyle[];
  castAuthorFid?: number;
}) {
  const { trackEvent } = useAnalytics();

  const push = usePush();

  return (
    <TextWithPress
      style={style}
      onPress={async () => {
        trackEvent(AnalyticsEvent.ClickTokenEmbedLink, {
          chain: token.chain,
          ca: token.ca,
        });

        push('Token', {
          ca: token.ca,
          chain: token.chain,
          via: 'cast_ticker',
          castAuthorFid,
        });
      }}
    >
      ${token.ticker}
    </TextWithPress>
  );
}

export { UpdatedTokenLink };
