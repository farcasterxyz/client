import { Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ApiUserProfile, ApiWalletLabel } from 'farcaster-client-data';
import { formatAddress } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React, { useCallback, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Text, Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import {
  formatNeynarScore,
  getDisplayedNeynarScore,
} from '~/utils/NeynarScoreUtils';

const LABELS: Record<ApiWalletLabel, string> = {
  auth: 'Auth',
  primary: 'Primary',
  warpcast: 'Farcaster Wallet',
};

function WalletAddressWithCopyAction({
  walletAddress,
  tags,
}: {
  walletAddress: string;
  tags: ApiWalletLabel[];
}) {
  const t = useTheme();

  const [copied, setCopied] = React.useState<boolean>(false);

  const copyToClipboard = React.useCallback(() => {
    Clipboard.setStringAsync(walletAddress);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [walletAddress]);

  if (copied) {
    return (
      <View style={[t.h8, t.itemsCenter, t.flex, t.flexRow]}>
        <Text2 color="secondary">Copied!</Text2>
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={[t.flex, t.flexRow, t.itemsCenter, t.h8]}
      onPress={copyToClipboard}
    >
      <View style={[t.flex, t.flexRow, t.itemsCenter]}>
        <Text2 style={[t.texts.primary, t.textBase, t.fontMono]}>
          {formatAddress(walletAddress)}
        </Text2>
        {!copied && (
          <Octicons
            onPress={copyToClipboard}
            size={11}
            name="copy"
            style={[t.texts.brand, t.mL1]}
          />
        )}
        <View
          style={[t.flex1, t.flexRow, { columnGap: 4 }, t.itemsCenter, t.mL2]}
        >
          {tags.map((tag) => (
            <View
              key={tag}
              style={[t.bgLightPurple, t.roundedFull, t.pX2, t.pY1]}
            >
              <Text2 size="xs" style={{ color: '#8A63D2' }} weight="medium">
                {LABELS[tag]}
              </Text2>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

type AboutUserBottomSheetProps = {
  userProfile: ApiUserProfile;
  onDismiss: () => void;
};

export const AboutUserBottomSheet = ({
  userProfile,
  onDismiss,
}: AboutUserBottomSheetProps) => {
  const { extras } = userProfile;
  const t = useTheme();
  const toast = useToast();
  const copyFidToClipboard = useCallback(() => {
    Clipboard.setStringAsync(extras.fid.toString());
    toast.show('Copied FID to clipboard', {
      type: 'success',
      duration: 1000,
    });
  }, [extras.fid, toast]);

  const bottomSheetRef = useRef<{ dismiss: () => void }>(null);

  const getTagsForWallet = useCallback(
    (walletAddress: string): ApiWalletLabel[] => {
      const result = extras.walletLabels?.find(
        (label) => label.address.toLowerCase() === walletAddress.toLowerCase(),
      );
      return result?.labels ?? [];
    },
    [extras.walletLabels],
  );

  return (
    <AutoDisplayingBottomSheetModal
      name="aboutUserBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
    >
      <View style={[t.flexGrow, t.flex, t.flexCol, t.itemsStart, t.mY4, t.mB6]}>
        <View style={[t.flex, t.flexCol]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>FID</Text>
          <TouchableOpacity
            style={[t.flex, t.flexRow, t.itemsCenter]}
            onPress={copyFidToClipboard}
          >
            <Text style={[t.texts.primary, t.textBase, t.mT1]}>
              {extras.fid}
            </Text>
            <Octicons
              onPress={copyFidToClipboard}
              size={10}
              name="copy"
              style={[t.texts.brand, t.mL1, { marginTop: 2 }]}
            />
          </TouchableOpacity>
        </View>
        <View style={[t.flex, t.flexCol, t.mT4]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
            Farcaster custody address
          </Text>
          <WalletAddressWithCopyAction
            walletAddress={extras.custodyAddress}
            tags={getTagsForWallet(extras.custodyAddress)}
          />
        </View>
        {typeof extras.ethWallets !== 'undefined' &&
          extras.ethWallets.length !== 0 && (
            <View style={[t.flex, t.flexCol, t.mT4]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Connected Ethereum wallets
              </Text>
              {extras.ethWallets.map((ew) => (
                <WalletAddressWithCopyAction
                  key={ew}
                  walletAddress={ew}
                  tags={getTagsForWallet(ew)}
                />
              ))}
            </View>
          )}
        {typeof extras.solanaWallets !== 'undefined' &&
          extras.solanaWallets.length !== 0 && (
            <View style={[t.flex, t.flexCol, t.mT4]}>
              <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
                Connected Solana wallets
              </Text>
              {extras.solanaWallets.map((sw) => (
                <WalletAddressWithCopyAction
                  key={sw}
                  walletAddress={sw}
                  tags={getTagsForWallet(sw)}
                />
              ))}
            </View>
          )}
        <View style={[t.flex, t.flexCol, t.mT4]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
            Neynar score
          </Text>
          <Text style={[t.texts.primary, t.textBase, t.mT1]}>
            {formatNeynarScore(getDisplayedNeynarScore(userProfile))}
          </Text>
        </View>
      </View>
      <AtomsButton
        hierarchy="tertiary"
        size="l"
        onPress={() => {
          bottomSheetRef.current?.dismiss();
        }}
        style={[t.mT2]}
      >
        Close
      </AtomsButton>
    </AutoDisplayingBottomSheetModal>
  );
};
