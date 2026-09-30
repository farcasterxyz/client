/* eslint-disable react-hooks/exhaustive-deps */
import { SignManifest } from '@farcaster/miniapp-core';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiJsonFarcasterSignature } from 'farcaster-client-data';
import {
  generateSignedDomainManifest,
  SharedSignManifestProvider,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useEmbeddedWallet } from 'farcaster-expo';
import React, { useCallback } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hexToBytes } from 'viem';
import { mainnet } from 'viem/chains';

import { useBottomSheetModalRef } from '~/components/BottomSheet';
import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';

// Mobile-specific bottom sheet function that renders native UI
function SignManifestBottomSheet({
  domain,
  hostDomain,
  onApprove,
  onReject,
}: {
  domain: string;
  hostDomain: string;
  onApprove: () => void;
  onReject: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = useBottomSheetModalRef();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  return (
    <AutoDisplayingBottomSheetModal
      name="sign-manifest"
      ref={bottomSheetRef}
      onDismiss={onReject}
      maxDynamicContentSize={screenHeight * 0.85}
      disableBottomSheetContentContainer
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          gap: 20,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
        }}
      >
        <Text2 size="2xl" weight="semibold">
          Security verification
        </Text2>

        <Text2 size="base" color="primary">
          Mini app "{hostDomain}" is requesting to sign a domain manifest for:
        </Text2>

        <View
          style={[
            {
              paddingVertical: 6,
              paddingHorizontal: 12,
              backgroundColor: t.colors.background.secondary,
            },
          ]}
        >
          <Text2 color="brand" weight="medium">
            {domain}
          </Text2>
        </View>

        <Text2 size="base" color="primary">
          This creates a cryptographic signature proving your ownership of this
          domain for Farcaster integration.
        </Text2>

        <View style={[t.flexRow, { gap: 12 }]}>
          <View style={[t.flex1]}>
            <ButtonV2 title="Reject" onPress={onReject} variant="secondary" />
          </View>
          <View style={[t.flex1]}>
            <ButtonV2 title="Approve" onPress={onApprove} />
          </View>
        </View>
      </BottomSheetScrollView>
    </AutoDisplayingBottomSheetModal>
  );
}

export function MobileSpecificSignManifestProvider({
  children,
  hostDomain,
}: {
  children: React.ReactNode;
  hostDomain: string;
}) {
  const currentUser = useCurrentUser();
  const { evmAddress, getWalletClient } = useEmbeddedWallet();
  const { trackEvent } = useTrackEvent();

  // Mobile-specific signer function that uses mobile wallet
  const signManifestFn = useCallback(
    async (domain: string): Promise<ApiJsonFarcasterSignature> => {
      if (!currentUser || !evmAddress) {
        throw new SignManifest.GenericError('User or wallet not found');
      }
      const walletClient = await getWalletClient(mainnet);
      const manifest = await generateSignedDomainManifest({
        domain,
        fid: currentUser.fid,
        address: evmAddress,
        type: 'auth',
        includeFrameConfig: false,
        signMessage: async (message) => {
          const signed = await walletClient.signMessage({ message });
          return hexToBytes(signed as `0x{string}`);
        },
      });
      return manifest.accountAssociation;
    },
    [currentUser],
  );

  // Mobile-specific bottom sheet function that renders native UI
  const bottomSheetFn = useCallback(
    ({
      onOpen,
      onConfirm,
      domain,
      hostDomain: bottomSheetHostDomain,
    }: {
      onOpen: () => void;
      onConfirm: () => void;
      domain: string;
      hostDomain: string;
    }) => (
      <SignManifestBottomSheet
        domain={domain}
        hostDomain={bottomSheetHostDomain}
        onApprove={onConfirm}
        onReject={onOpen}
      />
    ),
    [],
  );

  const handleSignManifestRequest = useCallback(
    (params: { domain: string; hostDomain: string }) => {
      trackEvent(AnalyticsEvent.SignManifestAction, {
        domain: params.domain,
        hostDomain: params.hostDomain,
      });
    },
    [trackEvent],
  );

  return (
    <SharedSignManifestProvider
      url={`https://${hostDomain}`}
      signManifestFn={signManifestFn}
      bottomSheetFn={bottomSheetFn}
      onSignManifestRequest={handleSignManifestRequest}
    >
      {children}
    </SharedSignManifestProvider>
  );
}

// Keep the old name as an alias for backward compatibility
export const SignManifestProvider = MobileSpecificSignManifestProvider;
