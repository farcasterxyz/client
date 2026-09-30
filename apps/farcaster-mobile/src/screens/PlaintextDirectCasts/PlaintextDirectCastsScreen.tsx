import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useCallback, useRef } from 'react';
import { View } from 'react-native';

import {
  DirectCastsFloatingCreate,
  DirectCastsFloatingSearch,
} from '~/components/DirectCastsFloatingSearch/DirectCastsFloatingSearch';
import { buildScreen } from '~/components/Screen';
import { topBarHeight } from '~/components/TopBar';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { PlaintextDirectCastsStackParamList } from '~/types';

import { DefaultInbox } from './DefaultInbox';
import { InboxHeader } from './InboxHeader';

type PlaintextDirectCastsScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'PlaintextDirectCasts'
>;

const PlaintextDirectCastsScreen = buildScreen<PlaintextDirectCastsScreenProps>(
  {
    name: 'PlaintextDirectCasts',
    avoidKeyboard: false,
    insetTop: true,
  },
  () => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const searchOpenRef = useRef<(() => void) | null>(null);
    const handleSearchPress = useCallback(() => {
      searchOpenRef.current?.();
    }, []);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewDirectCastsInbox, {
          inbox: 'default',
        });
      }, [trackEvent]),
    );

    return (
      <View style={[t.flex, t.hFull, t.wFull]}>
        <InboxHeader onSearchPress={handleSearchPress} />
        <View style={[t.flex1, t.hFull, t.wFull, { marginTop: topBarHeight }]}>
          <DefaultInbox />
        </View>
        <DirectCastsFloatingCreate />
        <DirectCastsFloatingSearch openRef={searchOpenRef} />
      </View>
    );
  },
);

PlaintextDirectCastsScreen.displayName = 'PlaintextDirectCasts';

export { PlaintextDirectCastsScreen };
