import { Octicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { View } from 'react-native';

import { AppBackButton } from '~/components/AppBackButton';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { HeaderIconButton, TokenSearch } from '~/components/Tokens/TokenSearch';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { CommonStackParamList } from '~/types';
import { shareUrl } from '~/utils/SharingUtils';

type TokenSearchScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'TokenSearch'
>;

const TokenSearchScreen = buildScreen<TokenSearchScreenProps>(
  { name: 'TokenSearch' },
  ({
    route: {
      params: { ticker: encodedTokenTicker },
    },
  }) => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const ticker = decodeURI(encodedTokenTicker).toLowerCase();

    const navigation = useNavigation();

    const onSharePress = React.useCallback(() => {
      trackEvent(AnalyticsEvent.PressShareToken, {
        ticker: ticker,
      });

      shareUrl({
        title: `${ticker} on Farcaster`,
        url: `https://farcaster.xyz/~/token/${ticker}`,
      });
    }, [ticker, trackEvent]);

    const goBack = useGoBack();

    const onHeaderBackPress = React.useCallback(() => {
      goBack();
    }, [goBack]);

    const headerLeft = React.useMemo(() => {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t._mL2]}>
          <AppBackButton onPress={onHeaderBackPress} />
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.mL1]}>
            <Text style={[t.texts.primary, t.textLg, t.fontSemibold]}>
              ${ticker}
            </Text>
          </View>
        </View>
      );
    }, [
      onHeaderBackPress,
      t._mL2,
      t.flex,
      t.flexRow,
      t.fontSemibold,
      t.itemsCenter,
      t.mL1,
      t.texts.primary,
      t.textLg,
      ticker,
    ]);

    const headerRight = React.useMemo(() => {
      return (
        <View style={[t.flex, t.flexRow, { gap: 12 }]}>
          <HeaderIconButton
            Icon={({ color, size }) => (
              <Octicons name="share" size={size} color={color} />
            )}
            onPress={onSharePress}
          />
        </View>
      );
    }, [onSharePress, t.flex, t.flexRow]);

    React.useEffect(() => {
      navigation.setOptions({
        headerLeft: () => headerLeft,
        headerRight: () => headerRight,
      });
    }, [headerLeft, headerRight, navigation]);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewToken, {
          ticker,
        });
      }, [ticker, trackEvent]),
    );

    return (
      <View style={[t.hFull, t.wFull]}>
        <TokenSearch ticker={ticker} />
      </View>
    );
  },
);

TokenSearchScreen.displayName = 'TokenSearchScreen';

export { TokenSearchScreen };
