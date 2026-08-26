import { ApiTokenLink, ApiTokenSourcePlatform } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../contexts';
import { useHaptics } from '../../../hooks';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AnimatedPressable, Text2 } from '../../design-system';
import { TokenPlatformIcon } from './TokenPlatformIcon';
import { TokenVerifiedBadge } from './TokenVerifiedBadge';

export function TokenBadges({
  token,
  sheetEnabled = false,
}: {
  token: ApiTokenLink;
  sheetEnabled?: boolean;
}) {
  const t = useTheme();
  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const { triggerImpactAsync } = useHaptics();

  const verified = (token.verifications?.length ?? 0) > 0;
  const platform = token.source?.platform;

  const handleOpen = React.useCallback(() => {
    if (!sheetEnabled) {
      return;
    }

    triggerImpactAsync();
    setIsBottomSheetOpen(true);
  }, [triggerImpactAsync, sheetEnabled]);

  const handleClose = React.useCallback(() => {
    setIsBottomSheetOpen(false);
  }, []);

  if (!verified && !platform) {
    return null;
  }

  return (
    <>
      <AnimatedPressable
        onPress={handleOpen}
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyCenter,
          {
            gap: 2,
          },
        ]}
        disabled={!sheetEnabled}
      >
        {verified && <TokenVerifiedBadge />}
        {platform && <TokenPlatformIcon platform={platform} />}
      </AnimatedPressable>
      {isBottomSheetOpen && (
        <TokenBadgesBottomSheet token={token} onDismiss={handleClose} />
      )}
    </>
  );
}

function TokenBadgesBottomSheet({
  token,
  onDismiss,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const OPTIONS: Record<
    ApiTokenSourcePlatform,
    { label: string; description: string }
  > = {
    zora: {
      label: 'Zora',
      description:
        'This token was launched on Zora, a token launchpad built on the Base blockchain.',
    },
    pumpfun: {
      label: 'Pump.fun',
      description:
        'This token was launched on pump.fun, a token launchpad built on the Solana blockchain.',
    },
    bonk: {
      label: 'Bonk token',
      description:
        'This token was launched on Bonk, a token launchpad built on the Solana blockchain.',
    },
    clanker: {
      label: 'Clanker token',
      description:
        'This token was launched on Clanker, a secure and audited token launchpad built on the Base blockchain.',
    },
    heaven: {
      label: 'Heaven',
      description:
        'This token was launched on Heaven, a token launchpad built on the Solana blockchain.',
    },
    paragraph: {
      label: 'Paragraph',
      description:
        'This token was launched on Paragraph, a token launchpad built on the Base blockchain.',
    },
    'base-solana-bridge': {
      label: 'Base Solana Bridge',
      description:
        'This token was bridged from the Solana blockchain to the Base blockchain.',
    },
  };

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View style={{ gap: 12 }}>
        <Text2 weight="semibold" size="lg" numberOfLines={1}>
          {token.name}
        </Text2>
        <View
          style={[
            t.wFull,
            {
              borderColor: t.colors.border.primary,
            },
            t.borderTHairline,
          ]}
        />
        {token.source?.platform && (
          <View style={{ gap: 8 }}>
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <TokenPlatformIcon platform={token.source.platform} size={16} />
              <Text2 weight="medium">
                {OPTIONS[token.source.platform].label}
              </Text2>
            </View>
            <Text2 color="secondary" size="sm">
              {OPTIONS[token.source.platform].description}
            </Text2>
          </View>
        )}
        {token.verifications && token.verifications.length > 0 && (
          <View style={{ gap: 8 }}>
            <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
              <TokenVerifiedBadge />
              <Text2 weight="medium">Verified</Text2>
            </View>
            <Text2 color="secondary" size="sm">
              This token's data has been verified by CoinGecko. It does not mean
              that the token is safe to trade, only that the data is correct.
            </Text2>
          </View>
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
