import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { AtomsButton } from 'farcaster-expo';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useNavigationHistory } from '~/contexts/NavigationHistoryProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type DebugNavigationHistoryScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugFeed'
>;

const DebugNavigationHistoryScreen =
  buildScreen<DebugNavigationHistoryScreenProps>(
    { name: 'DebugNavigationHistory' },
    () => {
      const t = useTheme();
      const { navigationHistory: unsortedNavigationHistory } =
        useNavigationHistory();
      const toast = useToast();

      const navigationHistory = useMemo(() => {
        return unsortedNavigationHistory.sort(
          (a, b) => b.timestamp - a.timestamp,
        );
      }, [unsortedNavigationHistory]);

      return (
        <View style={[t.hFull, t.justifyBetween]}>
          <FlashList
            data={navigationHistory}
            keyExtractor={(item) => String(item.id)}
            {...STANDARD_FLASHLIST_PERF_PROPS}
            renderItem={({ item }) => {
              return (
                <View style={[t.p4, t.flexRow]}>
                  <Text style={[t.texts.primary, t.textXs]}>
                    {JSON.stringify(item, null, 2)}
                  </Text>
                </View>
              );
            }}
          />
          <AtomsButton
            size="l"
            style={[t.m2, t.mB2]}
            onPress={() => {
              Clipboard.setStringAsync(
                JSON.stringify(navigationHistory, null, 2),
              );
              toast.show('Navigation history copied to clipboard', {
                placement: 'top',
              });
            }}
          >
            Copy to clipboard
          </AtomsButton>
        </View>
      );
    },
  );

DebugNavigationHistoryScreen.displayName = 'DebugNavigationHistoryScreen';

export { DebugNavigationHistoryScreen };
