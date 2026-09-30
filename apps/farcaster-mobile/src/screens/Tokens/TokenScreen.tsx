import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiCast,
  ApiChain,
  ApiTokenLink,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import { useTokenLinks } from 'farcaster-client-hooks';
import {
  Token,
  useCachedOrQueryToken,
  useChartTypePreference,
  useTheme,
  WalletScreenHeader,
} from 'farcaster-expo';
import { CircleX } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import {
  measure,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { TokenCast } from '~/components/Tokens/TokenCast';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useLightbox } from '~/contexts/LightboxProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useHideAdminFeatures } from '~/hooks/useHideAdminFeatures';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { CommonStackParamList } from '~/types';
import { usePossiblyNavigateOrOpenUrl } from '~/utils/LinkingUtils';

type TokenScreenProps = NativeStackScreenProps<CommonStackParamList, 'Token'>;

const TokenScreen = buildScreen<TokenScreenProps>(
  {
    name: 'Token',
    insetTop: true,
    themeV2: true,
  },
  ({
    route: {
      params: { chain, ca, attributedDomain, via },
    },
  }) => {
    return (
      <TokenScreenInner
        chain={chain}
        ca={ca}
        attributedDomain={attributedDomain}
        via={via}
      />
    );
  },
);

TokenScreen.displayName = 'TokenScreen';

type TokenCAScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenCA'
>;

const TokenCAScreen = buildScreen<TokenCAScreenProps>(
  {
    name: 'TokenCA',
    insetTop: true,
    themeV2: true,
  },
  ({
    route: {
      params: { ca, via, attributedDomain },
    },
  }) => {
    const t = useTheme();
    const { data: searchedToken } = useTokenLinks({
      ticker: ca,
      intent: 'submit',
    });
    const goBack = useGoBack();

    if (searchedToken.tokens.length === 0) {
      return (
        <View style={[t.hFull]}>
          <View style={[t.flexGrow, t.itemsCenter, t.justifyCenter]}>
            <Empty
              message="Token not found"
              subMessage="The token you are looking for does not exist."
              icon={<CircleX size={40} color={t.colors.text.tertiary} />}
            />
          </View>
          <View style={[t.absolute, t.top0, t.left0, t.right0]}>
            <WalletScreenHeader title="" onBackCallback={goBack} />
          </View>
        </View>
      );
    }

    const chain = searchedToken.tokens[0].chain;

    return (
      <TokenScreenInner
        chain={chain}
        ca={ca}
        attributedDomain={attributedDomain}
        via={via}
      />
    );
  },
);

TokenCAScreen.displayName = 'TokenCA';

const TokenScreenInner = ({
  chain,
  ca,
  attributedDomain,
  via,
}: {
  chain: ApiChain;
  ca: string;
  attributedDomain?: string;
  via: string;
}) => {
  const pushToUserProfile = usePushToUserProfile();
  const { openLightbox } = useLightbox();
  const ref = useAnimatedRef<View>();
  const [hideAdminFeatures] = useHideAdminFeatures();
  const { checkUserAppContextGate } = useUserAppContextGate();
  const showTokenIntents = checkUserAppContextGate('wallet-intents').value;

  const { trackEvent } = useAnalytics();
  const [chartTypePreference] = useChartTypePreference();

  const { data: token } = useCachedOrQueryToken({
    chain,
    ca,
    query: { staleTime: 15_000 },
  });

  useFocusEffect(
    React.useCallback(() => {
      const chartType =
        chartTypePreference === 'candlestick' ? 'candlestick' : 'line';

      trackEvent(AnalyticsEvent.ViewToken, {
        chain,
        ca,
        via,
        attributedDomain,
        chartType,
      });
    }, [chain, ca, attributedDomain, via, trackEvent, chartTypePreference]),
  );

  const handleUserPress = useCallback(
    ({ fid, initialTab }: { fid: number; initialTab?: 'tokens' }) => {
      pushToUserProfile({ fid, initialTab });
    },
    [pushToUserProfile],
  );

  const possiblyNavigateOrOpenUrl = usePossiblyNavigateOrOpenUrl();

  const onLinkPress = useCallback(
    ({ target }: { target: string }) => {
      possiblyNavigateOrOpenUrl({ url: target });
    },
    [possiblyNavigateOrOpenUrl],
  );

  const onImagePress = useCallback(
    (url: string) => {
      runOnUI(() => {
        'worklet';
        runOnJS(openLightbox)({
          images: [
            {
              original: url,
              thumbnail: url,
              width: 72,
              aspectRatio: 1,
              rect: measure(ref),
              type: 'circle',
            },
          ],
          index: 0,
        });
      })();
    },
    [openLightbox, ref],
  );

  const { activeLightboxRef } = useLightbox();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity:
        activeLightboxRef.value === token?.imageUrl
          ? withTiming(0, { duration: 100 })
          : 1,
    };
  });

  const CastComponent = React.useCallback(
    ({ cast, token }: { cast: ApiCast; token: ApiTokenLink }) => {
      return <TokenCast cast={cast} token={token} />;
    },
    [],
  );

  const openComposer = useOpenComposer();

  const onCreateCastPress = React.useCallback(() => {
    if (typeof token === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.ComposeTokenComment, { chain, ca });

    openComposer({
      intent: {
        text: '',
        embeds: [],
        tokenKey: buildCaip19TokenUri(chain, ca),
        mentions: [],
      },
    });
  }, [ca, chain, openComposer, token, trackEvent]);

  return (
    <Token
      chain={chain}
      ca={ca}
      onLinkPress={onLinkPress}
      onUserPress={handleUserPress}
      onImagePress={onImagePress}
      imageRef={ref}
      imageStyle={animatedStyle as unknown as StyleProp<ViewStyle>}
      hideAdminFeatures={hideAdminFeatures}
      showIntents={showTokenIntents}
      showTokenWarnings={true}
      CastComponent={CastComponent}
      onCreateCastPress={onCreateCastPress}
    />
  );
};

export { TokenCAScreen, TokenScreen };
