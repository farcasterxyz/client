import * as WebBrowser from 'expo-web-browser';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ETHER_DECIMALS } from 'farcaster-client-data';
import {
  formatTokenQuantity,
  getNotionLinkTarget,
} from 'farcaster-client-hooks';
import { AlertCircle, Info } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Chain } from 'viem';

import { useSharedTelemetry, useTheme } from '../../contexts';
import { AutoDisplayingBottomSheetModal } from '../bottom-sheet';
import { ButtonV2, Text2 } from '../design-system';

const GAS_EDUCATION_NOTION_URL = getNotionLinkTarget({ to: 'what-is-gas' });

function GasEducationBottomSheet({
  onDismiss,
  onNavigateToEducationPage,
  feeAsset,
  fee,
  feeShortfall,
  chain,
}: {
  onDismiss: () => void;
  onNavigateToEducationPage: () => void;
  feeAsset?: {
    symbol: string;
    decimals?: number;
    price?: number;
  };
  fee?: bigint;
  feeShortfall?: bigint;
  chain: Chain;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const handleNavigate = () => {
    bottomSheetRef.current?.dismiss();
    onNavigateToEducationPage();
  };

  const getDetailedMessage = () => {
    if (feeAsset !== undefined) {
      if (feeShortfall !== undefined) {
        return (
          <Text2 color="secondary" style={[t.mY2]}>
            You need{' '}
            {formatTokenQuantity({
              quantity: feeShortfall,
              decimals: feeAsset.decimals ?? ETHER_DECIMALS,
              price: feeAsset.price,
              strategy: 'round',
            })}{' '}
            more {feeAsset.symbol} to complete this transaction on {chain.name}.
          </Text2>
        );
      }

      if (fee !== undefined) {
        return (
          <Text2 color="warning" style={[t.mY2]}>
            You need{' '}
            {formatTokenQuantity({
              quantity: fee,
              decimals: feeAsset.decimals ?? ETHER_DECIMALS,
              price: feeAsset.price,
              strategy: 'round',
            })}{' '}
            {feeAsset.symbol} to complete this transaction on {chain.name}.
          </Text2>
        );
      }

      return (
        <Text2 color="warning" style={[t.mY2]}>
          You need more {feeAsset.symbol} to complete this transaction on{' '}
          {chain.name}.
        </Text2>
      );
    }

    return (
      <Text2 color="warning" style={[t.mY2]}>
        You need gas tokens to complete this transaction on {chain.name}.
      </Text2>
    );
  };

  return (
    <AutoDisplayingBottomSheetModal
      name="gasEducationBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[t.flexGrow, t.flex, t.flexCol, t.justifyBetween, { gap: 16 }]}
      >
        <View>
          <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
            <View style={[t.roundedFull]}>
              <Info size={18} style={[t.texts.secondary]} />
            </View>
            <Text2 weight="semibold" size="lg">
              What is Gas?
            </Text2>
          </View>
          <Text2
            color="secondary"
            size="base"
            weight="regular"
            style={[t.mB1, t.mT2]}
          >
            Gas is a fee required to execute transactions on blockchain
            networks.
          </Text2>
          {getDetailedMessage()}
        </View>
        <ButtonV2
          title="Learn how to fund your wallet"
          onPress={handleNavigate}
          width="full"
          height="normal"
          textSize="lg"
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

export function InsufficientFundsForGas({
  feeAsset,
  fee,
  feeShortfall,
  action,
  chain,
  assetBeingSent,
}: {
  feeAsset?: {
    symbol: string;
    decimals?: number;
    price?: number;
  };
  fee?: bigint;
  feeShortfall?: bigint;
  action: 'send';
  chain: Chain;
  assetBeingSent: string;
}) {
  const t = useTheme();
  const { trackEvent } = useSharedTelemetry();
  const sentOnce = useRef(false);
  const [isEducationBottomSheetOpen, setIsEducationBottomSheetOpen] =
    useState(false);

  useEffect(() => {
    if (sentOnce.current === false) {
      sentOnce.current = true;
      trackEvent(AnalyticsEvent.TransactionPreviewInsufficientFunds, {
        action,
        assetBeingSent,
        chain: chain.name,
        version: 'v2',
        shortfall:
          feeShortfall !== undefined &&
          feeAsset &&
          formatTokenQuantity({
            quantity: feeShortfall,
            decimals: feeAsset.decimals ?? ETHER_DECIMALS,
            price: feeAsset.price,
            strategy: 'round',
          }),
        fee:
          fee !== undefined &&
          feeAsset &&
          formatTokenQuantity({
            quantity: fee,
            decimals: feeAsset.decimals ?? ETHER_DECIMALS,
            price: feeAsset.price,
            strategy: 'round',
          }),
      });
    }
  }, [action, chain, fee, feeAsset, feeShortfall, trackEvent, assetBeingSent]);

  const handlePress = () => {
    setIsEducationBottomSheetOpen(true);
  };

  const handleNavigateToEducationPage = async () => {
    await WebBrowser.openBrowserAsync(GAS_EDUCATION_NOTION_URL);
  };

  const educationBottomSheet = useMemo(() => {
    if (!isEducationBottomSheetOpen) {
      return null;
    }
    return (
      <GasEducationBottomSheet
        onDismiss={() => setIsEducationBottomSheetOpen(false)}
        onNavigateToEducationPage={handleNavigateToEducationPage}
        feeAsset={feeAsset}
        fee={fee}
        feeShortfall={feeShortfall}
        chain={chain}
      />
    );
  }, [isEducationBottomSheetOpen, feeAsset, fee, feeShortfall, chain]);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[
          t.flexRow,
          t.justifyBetween,
          t.itemsCenter,
          t.backgrounds.warning,
          { gap: 6, borderRadius: 12 },
          t.pX2,
        ]}
      >
        <View style={[t.p2, t.flexRow, t.itemsCenter, { gap: 6 }]}>
          <AlertCircle size={20} color={t.colors.text.warning} />
          <Text2 color="warning" size="base">
            {feeAsset
              ? `Not enough ${feeAsset.symbol} on ${chain.name} for gas`
              : 'Not enough gas to continue'}
          </Text2>
        </View>
        <Text2
          color="warning"
          weight="semibold"
          style={[t.pY2, t.pR2, t.underline]}
        >
          Learn more
        </Text2>
      </TouchableOpacity>
      {educationBottomSheet}
    </>
  );
}
