import { Octicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, { useCallback } from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FrameTransacationWalletIcon } from '~/components/images/FrameTransactionWalletIcon';
import { PromptScrollView } from '~/components/prompts/PromptScrollView';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

const warnings = ['Read account balances', 'Suggest onchain actions'];

export function FrameTransactionAckRisks({
  onAck,
  onCancel,
}: {
  onAck: () => void;
  onCancel: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewConnectWallet, {});
  }, [trackEvent]);

  const onPressContinue = useCallback(async () => {
    trackEvent(AnalyticsEvent.ClickConnectWalletContinue, {});
    onAck();
  }, [onAck, trackEvent]);

  const onPressCancel = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickConnectWalletCancel, {});
    onCancel();
  }, [onCancel, trackEvent]);

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pT2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
            ]}
          >
            <View
              style={[
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.roundedLg,
                t.w15,
                t.h15,
                t.bgFrameTxLight,
              ]}
            >
              <FrameTransacationWalletIcon />
            </View>
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
              ]}
              activeOpacity={0.5}
              onPress={async () => {
                Linking.openURL(getNotionLinkTarget({ to: 'connect-wallet' }));
              }}
            >
              <Octicons name="info" size={16} style={[t.texts.tertiary]} />
            </TouchableOpacity>
          </View>
          <View
            style={[t.wFull, t.mT5, t.mB3, t.itemsCenter, t.flex, t.flexRow]}
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
              Connect wallet
            </Text>
          </View>
          <View style={[t.flex, t.flexCol, t.wFull]}>
            <Text style={[t.texts.primary, t.textBase]}>
              When you click the transaction button (<Octicons name="zap" />
              ), a mini app will be able to:
            </Text>
            <PromptScrollView
              style={[
                t.flex,
                t.flexCol,
                t.bgFrameActionsUnderneath,
                t.rounded,
                t.flexGrow,
                t.wFull,
                t.mY5,
                { maxHeight: 200 },
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
            </PromptScrollView>
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
            ]}
            activeOpacity={0.75}
            onPress={onPressContinue}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Continue
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
            onPress={onPressCancel}
          >
            <Text style={[t.texts.tertiary, t.textBase]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}
