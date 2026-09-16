import { Octicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChain } from 'farcaster-client-data';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PromptScrollView } from '~/components/prompts/PromptScrollView';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

import { TransactionContext } from './shared';

export function TransactionScanErrors({
  errors,
  frameUrl,
  chain,
  onTryAgain,
  onContinue,
  address,
}: {
  errors: string[];
  frameUrl: string;
  chain: ApiChain;
  address: string;
  onContinue: () => void;
  onTryAgain: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewTxnError, {});
  }, [trackEvent]);

  const onPressDismiss = useCallback(async () => {
    trackEvent(AnalyticsEvent.ClickTxnErrorDismiss, {});
    onContinue();
  }, [onContinue, trackEvent]);

  const onPressTryAgain = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickTxnErrorTryAgain, {});
    onTryAgain();
  }, [onTryAgain, trackEvent]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 250 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.mB5,
              t.itemsCenter,
              t.flex,
              t.flexRow,
              t.justifyBetween,
            ]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
              ]}
            >
              Error
            </Text>
            <TouchableOpacity
              style={[
                t.roundedLg,
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.itemsCenter,
                t.roundedLg,
                t.pX2,
              ]}
              activeOpacity={0.5}
              onPress={async () => {
                Linking.openURL(getNotionLinkTarget({ to: 'trx-simulations' }));
              }}
            >
              <Octicons name="info" size={16} style={[t.texts.tertiary]} />
            </TouchableOpacity>
          </View>
          <View style={[t.mB5, t.wFull]}>
            <Text style={[t.texts.primary, t.textBase, t.mB3]}>
              Our simulation shows that this transaction:
            </Text>
            <PromptScrollView
              style={[
                t.flex,
                t.flexCol,
                t.bgFrameActionsUnderneath,
                t.rounded,
                t.flexGrow,
                t.wFull,
                { maxHeight: 240 },
              ]}
            >
              {errors.map((error, index) => (
                <View
                  key={index}
                  style={[
                    t.pY3,
                    t.pX4,
                    index !== 0 && [t.borderDefault, t.borderTHairline],
                  ]}
                >
                  <Text style={[t.textBase, t.texts.primary]}>
                    {error.indexOf('(Insufficient funds)') !== -1
                      ? 'You do not have enough funds.'
                      : error}
                  </Text>
                </View>
              ))}
            </PromptScrollView>
          </View>
          <View style={[t.mB5]}>
            <TransactionContext
              frameUrl={frameUrl}
              chain={chain}
              address={address}
            />
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
              t.fontSemibold,
            ]}
            activeOpacity={0.75}
            onPress={onPressDismiss}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Dismiss
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              t.mT1,
              t.bgTransparent,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
            ]}
            activeOpacity={0.75}
            onPress={onPressTryAgain}
          >
            <Octicons name="sync" size={12} style={[t.texts.tertiary, t.mR1]} />
            <Text style={[t.texts.tertiary, t.textBase]}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}
