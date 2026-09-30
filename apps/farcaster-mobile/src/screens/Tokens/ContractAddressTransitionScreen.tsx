import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useTokenLinks } from 'farcaster-client-hooks';
import React, { Suspense } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { NoTokensIcon } from '~/components/Tokens/NoTokensIcon';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUnmediatedReplace } from '~/hooks/navigation/methods/replace';
import { CommonStackParamList } from '~/types';

type ContractAddressTransitionScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ContractAddressTransition'
>;

const ContractAddressTransitionScreen =
  buildScreen<ContractAddressTransitionScreenProps>(
    { name: 'ContractAddressTransition' },
    ({
      route: {
        params: { address },
      },
    }) => {
      const t = useTheme();

      return (
        <View style={[t.flex, t.flexCol, { gap: 12 }, t.mB2, t.pY2]}>
          <Suspense fallback={<LoadingIndicator size="small" />}>
            <ContractAddressTransitionInner address={address} />
          </Suspense>
        </View>
      );
    },
  );

ContractAddressTransitionScreen.displayName = 'ContractAddressTransitionScreen';

function ContractAddressTransitionInner({ address }: { address: string }) {
  const replace = useUnmediatedReplace();

  const { data } = useTokenLinks({ ticker: address, intent: 'submit' });

  const token = React.useMemo(() => {
    return data.tokens.length !== 0 ? data.tokens[0] : undefined;
  }, [data.tokens]);

  React.useEffect(() => {
    if (typeof token !== 'undefined') {
      replace('TokenSearch', {
        ticker: token.ticker,
      });
    }
  }, [replace, token]);

  if (typeof token === 'undefined') {
    return <NoTokensFound address={address} />;
  }

  return <LoadingIndicator size="small" />;
}

function NoTokensFound({ address }: { address: string }) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.NoTokensFound, { address });
  }, [address, trackEvent]);

  return (
    <View style={[t.flex, t.flexCol, { gap: 8 }, t.mX3]}>
      <View
        style={[
          t.wFull,
          t.bgFaint,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          t.h18,
          t.p3,
          { borderRadius: 16 },
        ]}
      >
        <View style={[t.flex, t.relative, t.w13, t.h13, t.mR2]}>
          <View
            style={[
              t.bgMuted,
              t.roundedFull,
              t.w12,
              t.h12,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
            ]}
          >
            <NoTokensIcon />
          </View>
        </View>
        <Text2
          color="secondary"
          size="base"
          weight="regular"
          style={[t.flex1, t.flexGrow]}
        >
          Still gathering data — check back later.
        </Text2>
      </View>
    </View>
  );
}

export { ContractAddressTransitionScreen };
