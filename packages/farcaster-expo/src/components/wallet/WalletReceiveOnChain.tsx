import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  apiChainDisplayName,
  ApiPlatformType,
} from 'farcaster-client-data';
import { Check, Copy } from 'lucide-react-native';
import * as React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useEmbeddedWallet } from '../../contexts/EmbeddedWalletContext';
import { useSharedNavigationContext } from '../../contexts/SharedNavigationContext';
import { useSharedTelemetry } from '../../contexts/SharedTelemetryContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  useCopyWalletAddress,
  useHaptics,
  useWalletGeoRestricted,
} from '../../hooks';
import { formatAddress } from '../../utils/WalletUtils';
import { ChainImage } from '../crypto';
import { Text2 } from '../design-system';
import { WalletNotConnected } from './auth';
import { WalletNotAvailableInRegion } from './auth/WalletNotAvailableInRegion';
import { WalletScreenHeader } from './WalletScreenHeader';

export function WalletReceiveOnChain({
  chain,
}: {
  chain: ApiChain;
  platformType: ApiPlatformType;
}) {
  const { evmAddress, solanaAddress } = useEmbeddedWallet();
  const geoRestricted = useWalletGeoRestricted();
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const { goBack } = useSharedNavigationContext();

  const label = apiChainDisplayName(chain);
  const address = chain === 'solana' ? solanaAddress : evmAddress;

  const { copy, copied } = useCopyWalletAddress(address ?? '');
  const { triggerImpactAsync } = useHaptics();

  const onCopyPress = React.useCallback(() => {
    triggerImpactAsync();
    trackEvent(AnalyticsEvent.PressWalletCopySelfAddress, {});
    copy();
  }, [copy, triggerImpactAsync, trackEvent]);

  if (geoRestricted) {
    return <WalletNotAvailableInRegion />;
  }

  if (!evmAddress) {
    return <WalletNotConnected source="wallet-receive-on-chain" />;
  }

  return (
    <ScrollView
      style={[{ minHeight: '100%' }]}
      contentContainerStyle={[t.flexGrow]}
      alwaysBounceVertical={false}
    >
      <WalletScreenHeader
        title={`Your ${label} Address`}
        onBackCallback={goBack}
      />
      <View style={[t.flex1, t.itemsCenter, t.justifyCenter, { gap: 32 }]}>
        <View style={[{ gap: 16 }]}>
          <View
            style={[
              t.borderHairline,
              t.borderDefault,
              t.p4,
              { borderRadius: 16 },
            ]}
          >
            <QRCode
              backgroundColor={t.colors.bgDefault}
              color={t.colors.text.primary}
              ecl="M"
              size={220}
              value={address ?? ''}
            />
            <View
              style={[
                t.absolute,
                t.top0,
                t.right0,
                t.left0,
                t.bottom0,
                t.justifyCenter,
                t.itemsCenter,
              ]}
            >
              <ChainImage
                chain={chain}
                size={56}
                inverted
                bordered
                borderWidth={3}
                borderRadius={18}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={onCopyPress}
            style={[t.bgFaint, t.itemsCenter, t.p2, { borderRadius: 12 }]}
          >
            <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
              <Text2 weight="medium">{formatAddress(address ?? '')}</Text2>
              {copied ? (
                <Check
                  size={16}
                  strokeWidth={2}
                  color={t.colors.text.primary}
                />
              ) : (
                <Copy size={16} strokeWidth={2} color={t.colors.text.primary} />
              )}
            </View>
          </TouchableOpacity>
        </View>
        <View style={[t.flexCol, t.itemsCenter, { width: 260, gap: 10 }]}>
          <Text2 size="lg" weight="medium">
            {`Your ${label} address`}
          </Text2>
          <Text2 color="secondary" align="center" weight="medium">
            {`Use this address to receive tokens and collectibles on ${label}`}
          </Text2>
        </View>
      </View>
    </ScrollView>
  );
}
