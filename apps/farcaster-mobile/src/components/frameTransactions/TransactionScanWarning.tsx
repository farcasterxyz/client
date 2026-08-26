import { Octicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChain } from 'farcaster-client-data';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FrameTransacationFlagIcon } from '~/components/images/FrameTransactionFlagIcon';
import { PromptScrollView } from '~/components/prompts/PromptScrollView';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

import { TransactionContext } from './shared';

export function TransactionScanWarning({
  severity,
  warnings,
  frameUrl,
  chain,
  address,
  onReportMalicious,
  onContinue,
  onCancel,
}: {
  severity: 'WARN' | 'BLOCK';
  warnings: string[];
  frameUrl: string;
  chain: ApiChain;
  address: string;
  onReportMalicious: () => void;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewTxnWarning, { severity });
  }, [trackEvent, severity]);

  const onPressContinue = useCallback(async () => {
    trackEvent(AnalyticsEvent.ClickTxnWarningContinue, { severity });
    onContinue();
  }, [onContinue, trackEvent, severity]);

  const onPressCancel = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickTxnWarningCancel, { severity });
    onCancel();
  }, [onCancel, trackEvent, severity]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.pX4,
          t.pY2,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 250 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.itemsCenter,
              t.flex,
              t.flexRow,
              t.justifyBetween,
              t.mB5,
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
              {severity === 'WARN' ? 'Review warnings' : 'Do not proceed'}
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
          <View style={[t.flex, t.flexCol, t.wFull, t.mB5]}>
            <Text style={[t.texts.primary, t.textBase, t.mB3]}>
              Our simulation shows that this transaction:
            </Text>
            {warnings.length !== 0 ? (
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
                {warnings.map((warning, index) => (
                  <View
                    key={index}
                    style={[
                      t.pY3,
                      t.pX4,
                      index !== 0 && [t.borderDefault, t.borderTHairline],
                    ]}
                  >
                    <Text style={[t.textBase, t.texts.primary]}>{warning}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  key={'report'}
                  style={[
                    t.flex1,
                    t.pY3,
                    t.pX4,
                    [t.borderDefault, t.borderTHairline],
                    t.wFull,
                    t.itemsCenter,
                    t.flex,
                    t.flexRow,
                    t.justifyCenter,
                  ]}
                  onPress={onReportMalicious}
                  activeOpacity={0.75}
                >
                  <FrameTransacationFlagIcon />
                  <Text style={[t.textBase, t.texts.tertiary, t.mL1]}>
                    Report
                  </Text>
                </TouchableOpacity>
              </PromptScrollView>
            ) : (
              <View
                style={[
                  t.flex,
                  t.flexCol,
                  t.bgFrameActionsUnderneath,
                  t.rounded,
                ]}
              >
                <Text
                  style={[t.textBase, t.texts.primary, t.pY3, t.pX4, t.italic]}
                >
                  Transaction scan results not available. Please proceed with
                  caution.
                </Text>
              </View>
            )}
          </View>
          <View style={[t.mB5]}>
            <TransactionContext
              frameUrl={frameUrl}
              address={address}
              chain={chain}
            />
          </View>
        </View>
        {severity === 'BLOCK' ? (
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
              ]}
              activeOpacity={0.75}
              onPress={onPressCancel}
            >
              <Text style={[t.textBase, t.fontSemibold, t.texts.light]}>
                Cancel transaction
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                t.mT2,
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
              onPress={onPressCancel}
            >
              <Text style={[t.texts.tertiary, t.textBase]}>
                Continue anyway
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
            <TouchableOpacity
              style={[
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
                { backgroundColor: t.colors.yellow900 },
              ]}
              activeOpacity={0.75}
              onPress={onPressContinue}
            >
              <Text style={[t.textBase, t.fontSemibold, t.texts.light]}>
                Continue
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                t.mT2,
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
              onPress={onPressCancel}
            >
              <Text style={[t.texts.tertiary, t.textBase]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </BottomSheetView>
  );
}
