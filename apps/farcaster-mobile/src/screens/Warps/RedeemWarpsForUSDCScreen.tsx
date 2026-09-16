import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useExecuteWarpsDeal,
  useFetchWarpsDeal,
  WarpsEligible,
} from 'farcaster-client-hooks';
import {
  AutoDisplayingBottomSheetModal,
  useEmbeddedWallet,
  useRootToast,
} from 'farcaster-expo';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type RedeemWarpsForUSDCScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'RedeemWarpsForUSDC'
>;
import { AnalyticsEvent } from 'farcaster-analytics';
import { formatDecimal } from 'farcaster-client-data';
import { Clock, Info } from 'lucide-react-native';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { SuccessRedeemWarpsForUSDCScreen } from './ExecuteDeal';

const RedeemWarpsForUSDCScreen = buildScreen<RedeemWarpsForUSDCScreenProps>(
  { name: 'RedeemWarpsForUSDC' },
  () => {
    const { trackEvent } = useAnalytics();
    const navigate = useNavigate();
    const t = useTheme();
    const toast = useRootToast();
    const {
      mutate: executeWarpsDeal,
      isPending: isPendingExecuteWarpsDeal,
      data: dataExecuteWarpsDeal,
      isError: isErrorExecuteWarpsDeal,
    } = useExecuteWarpsDeal();
    const { data: warpsDeal } = useFetchWarpsDeal();
    const { evmAddress, connect, isReady } = useEmbeddedWallet();

    const [lastExecutedDealMetadata, setLastExecutedDealMetadata] = useState<
      Pick<WarpsEligible, 'exchangeUsdcAmount' | 'redeemableWarps'> | undefined
    >(undefined);

    // Connect to wallet if not connected, this should also force the creation of wallet if it doesn't exist
    useEffect(() => {
      if (!evmAddress && isReady) {
        connect();
      }
    }, [evmAddress, connect, isReady]);

    const [detailsInfo, setDetailsInfo] = React.useState<
      { title: string; message: string } | undefined
    >(undefined);

    const handleConvertPress = useCallback(() => {
      if (!warpsDeal || warpsDeal.status !== 'eligible') {
        return;
      }
      setLastExecutedDealMetadata({
        exchangeUsdcAmount: warpsDeal.exchangeUsdcAmount,
        redeemableWarps: warpsDeal.redeemableWarps,
      });
      executeWarpsDeal();
      trackEvent(AnalyticsEvent.WarpsRedeemExecuted, {});
    }, [warpsDeal, executeWarpsDeal, trackEvent]);

    // Update the last executed deal metadata when the deal is executed
    useEffect(() => {
      if (
        dataExecuteWarpsDeal?.isExecuted &&
        dataExecuteWarpsDeal.newStatus.status === 'pending'
      ) {
        setLastExecutedDealMetadata({
          exchangeUsdcAmount: dataExecuteWarpsDeal.newStatus.exchangeUsdcAmount,
          redeemableWarps: dataExecuteWarpsDeal.newStatus.redeemableWarps,
        });
      }
    }, [dataExecuteWarpsDeal]);

    // Show an error toast if the deal is not executed
    useEffect(() => {
      if (
        isErrorExecuteWarpsDeal ||
        dataExecuteWarpsDeal?.isExecuted === false
      ) {
        toast.show(
          'An error occurred while converting Warps to USDC. Please try again.',
        );
      }
    }, [isErrorExecuteWarpsDeal, dataExecuteWarpsDeal, toast]);

    useEffect(() => {
      if (warpsDeal?.status === 'complete') {
        toast.show('Your Warps have been converted to USDC');
        navigate('Wallet', {});
      }
    }, [warpsDeal, navigate, toast]);

    const deltaDays: string = useMemo(() => {
      if (!warpsDeal || warpsDeal.status !== 'eligible') {
        return '0';
      }
      const now = moment();
      const offerExpires = moment(warpsDeal.expiresAt);
      return offerExpires.diff(now, 'days').toString();
    }, [warpsDeal]);

    useEffect(() => {
      trackEvent(AnalyticsEvent.WarpsRedeemLanded, {});
    }, [trackEvent]);

    // Show the success screen if the deal is executed
    if (dataExecuteWarpsDeal?.isExecuted === true) {
      return (
        <SuccessRedeemWarpsForUSDCScreen
          warpsTradeMetadata={lastExecutedDealMetadata!}
        />
      );
    }

    // Format the expiration date
    const detailsInfoPanel = typeof detailsInfo !== 'undefined' && (
      <DetailsPanelInfo
        title={detailsInfo.title}
        message={detailsInfo.message}
        onDismiss={() => setDetailsInfo(undefined)}
      />
    );

    if (warpsDeal?.status !== 'eligible') {
      return (
        <View style={[t.hFull, t.bgDefault, t.justifyCenter, t.alignCenter]}>
          <LoadingIndicator />
        </View>
      );
    }

    return (
      <>
        <View style={[t.hFull, t.p4]}>
          <View style={[t.flex1]}>
            <Text2 size="2xl" weight="semibold" style={[t.mB2]}>
              Convert Warps to USDC
            </Text2>
            <Text2 color="secondary" style={[t.mB6]}>
              Your converted USDC will be deposited directly into your Farcaster
              wallet.
            </Text2>

            {/* Available to convert section */}
            <View style={[t.bgLightGray]}>
              <View
                style={[
                  t.flexRow,
                  t.justifyBetween,
                  t.itemsCenter,
                  t.borderB,
                  t.borderBackground,
                  { paddingVertical: 14, paddingHorizontal: 20 },
                ]}
              >
                <View style={[t.flexRow, t.itemsCenter, t.textSm, { gap: 4 }]}>
                  <Text2 color="secondary">Available to convert</Text2>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setDetailsInfo({
                        title: 'Available to Convert',
                        message: 'The number of Warps you can convert to USDC.',
                      });
                    }}
                    hitSlop={hitSlop}
                  >
                    <Info size={14} color={t.colors.text.secondary} />
                  </TouchableOpacity>
                </View>

                <Text2 weight="medium" align="right">
                  {warpsDeal.redeemableWarps} Warps
                </Text2>
              </View>

              {/* USDC Value section */}
              <View
                style={[
                  t.flexRow,
                  t.justifyBetween,
                  t.itemsCenter,
                  t.borderB,
                  t.borderBackground,
                  { paddingVertical: 14, paddingHorizontal: 20 },
                ]}
              >
                <Text2 color="secondary">Value</Text2>
                <Text2 style={[t.texts.success]} weight="medium" align="right">
                  {formatDecimal(warpsDeal.exchangeUsdcAmount)} USDC
                </Text2>
              </View>
              {/* Offer expires section */}
              <View
                style={[
                  t.flexRow,
                  t.justifyCenter,
                  t.itemsCenter,
                  { paddingVertical: 14, paddingHorizontal: 20 },
                ]}
              >
                <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                  <Clock size={18} color={t.colors.text.secondary} />
                  <Text2 color="secondary">
                    Offer expires in {deltaDays} days
                  </Text2>
                </View>
              </View>
            </View>
            {/* Funds will be deposited to section */}
            <View
              style={[
                t.bgLightGray,
                t.roundedLg,
                { paddingHorizontal: 20, paddingVertical: 14, gap: 4 },
                t.mT4,
              ]}
            >
              <Text2 color="secondary">Funds will be deposited to:</Text2>
              <Text2 weight="medium">
                Farcaster Wallet ({evmAddress?.slice(0, 4)}...
                {evmAddress?.slice(-4)})
              </Text2>
            </View>
          </View>
          <View>
            <ButtonV2
              title={
                isPendingExecuteWarpsDeal
                  ? 'Converting Warps to USDC'
                  : 'Convert'
              }
              variant="primary"
              onPress={handleConvertPress}
              disabled={
                isPendingExecuteWarpsDeal ||
                isErrorExecuteWarpsDeal ||
                dataExecuteWarpsDeal?.isExecuted === false
              }
              loading={isPendingExecuteWarpsDeal}
              width="full"
            />
          </View>
        </View>
        {detailsInfoPanel}
      </>
    );
  },
);

function DetailsPanelInfo({
  title,
  message,
  onDismiss,
}: {
  title: string;
  message: string;
  onDismiss: () => void;
}) {
  const t = useTheme();

  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  return (
    <AutoDisplayingBottomSheetModal
      name="detailsPanelInfoBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[t.flexGrow, t.flex, t.flexCol, t.justifyBetween, { gap: 8 }]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View style={[t.roundedFull]}>
            <Feather name="info" size={18} style={[t.texts.secondary]} />
          </View>
          <Text2 weight="semibold" size="lg">
            {title}
          </Text2>
        </View>
        <Text2 color="secondary" size="base" weight="regular" style={[t.mB1]}>
          {message}
        </Text2>
        <ButtonV2
          title={'Okay'}
          onPress={() => {
            bottomSheetRef.current?.dismiss();
          }}
          width="full"
          height="normal"
          textSize="lg"
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

RedeemWarpsForUSDCScreen.displayName = 'RedeemWarpsForUSDCScreen';

export { RedeemWarpsForUSDCScreen };
