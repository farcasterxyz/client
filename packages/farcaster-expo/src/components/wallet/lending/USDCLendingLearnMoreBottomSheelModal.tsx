import { openBrowserAsync } from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOnchainMorphoVault } from 'farcaster-client-data';
import {
  BanknoteArrowDownIcon,
  HandshakeIcon,
  LockOpenIcon,
} from 'lucide-react-native';
import React from 'react';
import { Dimensions, Image, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_PADDING = 24; // pX3 = 12px each side
const IMAGE_WIDTH = SCREEN_WIDTH - IMAGE_PADDING;
const IMAGE_HEIGHT = IMAGE_WIDTH * (239 / 378);

import { useSharedTelemetry, useTheme } from '../../../contexts';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AnimatedPressable, Text2, TextWithPress } from '../../design-system';

export function USDCLendingLearnMoreBottomSheetModal({
  vault,
  showSkip = false,
  onDepositNow,
  onDismiss,
}: {
  vault: ApiOnchainMorphoVault;
  showSkip?: boolean;
  onDepositNow: () => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { trackEvent } = useSharedTelemetry();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewUSDCLendingLearnMore);
  }, [trackEvent]);

  const openTermsOfUse = React.useCallback(() => {
    openBrowserAsync(`https://app.morpho.org/${vault.chain}/vault/${vault.ca}`);
  }, [vault]);

  return (
    <AutoDisplayingBottomSheetModal
      name="usdc-lending-learn-more-bottom-sheet"
      handleIndicatorStyle={{ backgroundColor: t.colors.text.tertiary }}
      onDismiss={onDismiss}
      snapPoints={['100%']}
      enableDynamicSizing={false}
      disableBottomSheetContentContainer
      backgroundStyle={[
        t.borderHairline,
        t.borderDefault,
        t.bgDefault,
        { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
      ]}
    >
      <View
        style={[t.flex1, t.flexCol, t.pX3, { paddingBottom: insets.bottom }]}
      >
        <Image
          source={require('../../../assets/brand/USDCLendingLearnMoreHeader.png')}
          style={{ borderRadius: 16, width: IMAGE_WIDTH, height: IMAGE_HEIGHT }}
        />
        <View style={[t.pX3, t.mY6]}>
          <Text2 weight="semibold" color="brand" size="lg">
            Introducing
          </Text2>
          <Text2 weight="semibold" color="primary" size="2xl">
            USDC Lending
          </Text2>
        </View>
        <View style={[t.pX3, { gap: 24 }]}>
          <View style={[t.flexRow, { gap: 12 }]}>
            <BanknoteArrowDownIcon size={20} color={t.colors.text.primary} />
            <View style={[t.flexCol, { gap: 4 }]}>
              <Text2 weight="semibold" color="primary">
                Earn
              </Text2>
              <Text2 color="secondary">
                Lend USDC onchain and earn up to{' '}
                {(vault.avgApy * 100).toFixed(2)}%
              </Text2>
            </View>
          </View>
          <View style={[t.flexRow, { gap: 12 }]}>
            <LockOpenIcon size={20} color={t.colors.text.primary} />
            <View style={[t.flexCol, { gap: 4 }]}>
              <Text2 weight="semibold" color="primary">
                No Lockups
              </Text2>
              <Text2 color="secondary">
                You can deposit and withdraw funds at any time.
              </Text2>
            </View>
          </View>
          <View style={[t.flexRow, { gap: 12 }]}>
            <HandshakeIcon size={20} color={t.colors.text.primary} />
            <View style={[t.flexCol, { gap: 4 }]}>
              <Text2 weight="semibold" color="primary">
                Institutional Grade Security
              </Text2>
              <Text2 color="secondary">
                Powered by Morpho + Steakhouse, who also power Coinbase's
                lending.
                <TextWithPress style={[t.texts.brand]} onPress={openTermsOfUse}>
                  {' '}
                  Learn more
                </TextWithPress>
              </Text2>
            </View>
          </View>
        </View>
      </View>
      <View style={[t.p3, t.mB6]}>
        <AnimatedPressable
          onPress={onDepositNow}
          style={[
            t.itemsCenter,
            t.justifyCenter,
            t.backgrounds.brand,
            t.p3,
            t.roundedFull,
          ]}
        >
          <Text2 size="lg" weight="semibold" color="light">
            Deposit Now
          </Text2>
        </AnimatedPressable>
        {showSkip && (
          <AnimatedPressable
            onPress={onDismiss}
            style={[t.flexRow, t.itemsCenter, t.justifyCenter]}
          >
            <Text2
              size="lg"
              weight="semibold"
              color="secondary"
              style={[t.mT3]}
            >
              Skip
            </Text2>
          </AnimatedPressable>
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
