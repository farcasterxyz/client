import { Octicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  ApiInAppPurchaseRentStorageMetadata,
  ApiWalletRequestMetadata,
  chainIdToChainOrThrow,
  formatCents,
  getStoragePurchaseErrorMessage,
  parseEip155ChainId,
} from 'farcaster-client-data';
import {
  formatShorthandNumber,
  getNotionLinkTarget,
  useInvalidateStorageUtilization,
  useRecordWalletTransaction,
  useRentStorageOfferings,
  useRentTransactionData,
  useSimulateRentStorage,
  useStorageUtilization,
} from 'farcaster-client-hooks';
import { ButtonV2, useEmbeddedWallet, usePublicClient } from 'farcaster-expo';
import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { formatEther, Hex } from 'viem';
import { optimism } from 'viem/chains';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { StorageCapacity } from '~/components/StorageCapacity';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDeviceId } from '~/contexts/DeviceProvider';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CommonStackParamList, InAppPurchaseError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type BuyStorageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'BuyStorage'
>;

const StoragePurchaseDetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.p3,
        t.bgDefault,
      ]}
    >
      <Text style={[t.textBase, t.texts.secondary, t.fontMedium]}>{label}</Text>
      <Text style={[t.textBase, t.texts.secondary, t.fontMedium]}>{value}</Text>
    </View>
  );
};

const StoragePurchaseConfirmationSheet = ({
  errorMessage,
  isPurchasing,
  onConfirm,
  onDismiss,
  price,
  units,
}: {
  errorMessage?: string;
  isPurchasing: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  price: string;
  units: number;
}) => {
  const t = useTheme();

  return (
    <AutoDisplayingBottomSheetModal
      name="storage-purchase-confirmation"
      onDismiss={onDismiss}
      handleComponent={null}
      enableContentPanningGesture={!isPurchasing}
    >
      <View style={[t.flexCol, t.pT3, { gap: 12 }]}>
        <Text style={[t.textLg, t.texts.primary, t.fontSemibold]}>
          Farcaster Storage
        </Text>
        {errorMessage && (
          <View
            style={[
              t.flex,
              t.flexCol,
              t.p3,
              t.roundedLg,
              t.bgErrorBubble,
              { gap: 4 },
            ]}
          >
            <Text style={[t.textBase, t.texts.primary, t.fontMedium]}>
              {errorMessage}
            </Text>
          </View>
        )}
        <View style={[t.flexCol, t.roundedLg, { gap: 1, overflow: 'hidden' }]}>
          <StoragePurchaseDetailRow
            label="Storage"
            value={`${units} ${units === 1 ? 'unit' : 'units'}`}
          />
          <StoragePurchaseDetailRow label="Cost" value={`${price} per year`} />
          <StoragePurchaseDetailRow label="Network" value="Optimism" />
        </View>
        <View style={[t.flexRow, t.justifyBetween, { gap: 12 }]}>
          <ButtonV2
            title="Cancel"
            onPress={onDismiss}
            variant="secondary"
            width="flex1"
            textSize="lg"
            disabled={isPurchasing}
          />
          <ButtonV2
            title={isPurchasing ? 'Confirming...' : 'Confirm'}
            onPress={onConfirm}
            loading={isPurchasing}
            disabled={isPurchasing}
            width="flex1"
            textSize="lg"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

const BuyStorageScreen = buildScreen<BuyStorageScreenProps>(
  { name: 'BuyStorage', insetBottom: true },
  () => {
    const t = useTheme();
    const navigation = useNavigation();
    const { trackEvent } = useAnalytics();
    const toast = useToast();
    const navigate = useNavigate();
    const currentUser = useCurrentUser();
    const {
      device: { deviceId },
    } = useDeviceId();
    const {
      addPendingTransaction,
      getWalletClient,
      applyLimitedFunctionality,
      evmAddress,
    } = useEmbeddedWallet();
    const {
      getAvailableOffering,
      purchase,
      requestedPurchaseSucceeded,
      requestedPurchaseFailed,
      requestedPurchaseTrackingId,
      resetPurchaseState,
      inAppPurchasingIsEnabled,
      isInitialized: inAppPurchasesIsInitialized,
      retryProductFetch,
    } = useInAppPurchases();
    const rentTransactionData = useRentTransactionData();
    const invalidateStorageUtilization = useInvalidateStorageUtilization();
    const recordWalletTransaction = useRecordWalletTransaction();
    const { getEthereumClient } = usePublicClient();
    const simulateRentStorage = useSimulateRentStorage();
    const [walletPurchasePending, setWalletPurchasePending] =
      React.useState(false);
    const [storePurchasePending, setStorePurchasePending] =
      React.useState(false);
    const [walletPurchaseErrorMessage, setWalletPurchaseErrorMessage] =
      React.useState<string>();
    const [showWalletPurchaseConfirmation, setShowWalletPurchaseConfirmation] =
      React.useState(false);
    const { data } = useRentStorageOfferings();
    const { data: storageUtilizationData } = useStorageUtilization();

    const alreadyRentedUnits = React.useMemo(() => {
      return storageUtilizationData?.storageUtilization.rentedUnits || 0;
    }, [storageUtilizationData?.storageUtilization.rentedUnits]);

    const [selectedProductId, setSelectedProductId] = React.useState<string>();

    const storageScreenHeaderRight = React.useMemo(() => {
      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Linking.openURL(getNotionLinkTarget({ to: 'storage' }));
          }}
          hitSlop={hitSlop}
        >
          <Octicons name="info" size={18} style={[t.texts.secondary]} />
        </TouchableOpacity>
      );
    }, [t.texts.secondary]);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewBuyStorageScreen, {});
      }, [trackEvent]),
    );

    const utilization = React.useMemo(() => {
      return {
        casts: storageUtilizationData?.storageUtilization.casts || {
          rented: 0,
          used: 0,
        },
        reactions: storageUtilizationData?.storageUtilization.reactions || {
          rented: 0,
          used: 0,
        },
        links: storageUtilizationData?.storageUtilization.links || {
          rented: 0,
          used: 0,
        },
      };
    }, [
      storageUtilizationData?.storageUtilization.casts,
      storageUtilizationData?.storageUtilization.links,
      storageUtilizationData?.storageUtilization.reactions,
    ]);

    const rentStorageOfferings = React.useMemo(() => {
      return data?.rentStorageOfferings || [];
    }, [data?.rentStorageOfferings]);

    const matchedAndConfirmedOfferings = React.useMemo(() => {
      const availableOfferings: { [productId: string]: string } = {};
      for (const offering of rentStorageOfferings) {
        const availableOffering = getAvailableOffering({
          productId: offering.sku.productId,
        });
        if (typeof availableOffering !== 'undefined') {
          availableOfferings[availableOffering.productId] =
            availableOffering.localizedPrice ||
            formatCents(availableOffering.price);
        }
      }
      return availableOfferings;
    }, [getAvailableOffering, rentStorageOfferings]);

    const showWalletPayment =
      !applyLimitedFunctionality && typeof currentUser?.fid !== 'undefined';

    const visibleRentStorageOfferings = React.useMemo(() => {
      if (showWalletPayment && typeof evmAddress !== 'undefined') {
        return rentStorageOfferings;
      }

      return rentStorageOfferings.filter(
        (offering) =>
          typeof matchedAndConfirmedOfferings[offering.sku.productId] !==
          'undefined',
      );
    }, [
      evmAddress,
      matchedAndConfirmedOfferings,
      rentStorageOfferings,
      showWalletPayment,
    ]);

    const selectedRentStorageOffering = React.useMemo(() => {
      if (typeof selectedProductId === 'undefined') {
        return undefined;
      }

      const offering = visibleRentStorageOfferings.find(
        (o) => o.sku.productId === selectedProductId,
      );

      return offering;
    }, [selectedProductId, visibleRentStorageOfferings]);

    const selectedStorePrice = React.useMemo(() => {
      if (typeof selectedRentStorageOffering === 'undefined') {
        return undefined;
      }

      return matchedAndConfirmedOfferings[
        selectedRentStorageOffering.sku.productId
      ];
    }, [matchedAndConfirmedOfferings, selectedRentStorageOffering]);

    const paymentInProgress = walletPurchasePending || storePurchasePending;
    const storePaymentAvailable =
      inAppPurchasingIsEnabled &&
      inAppPurchasesIsInitialized &&
      typeof selectedStorePrice !== 'undefined';
    const walletPaymentAvailable =
      showWalletPayment && typeof evmAddress !== 'undefined';
    const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<
      'wallet' | 'store'
    >(walletPaymentAvailable ? 'wallet' : 'store');

    React.useEffect(() => {
      if (!showWalletPayment) {
        setSelectedPaymentMethod('store');
        return;
      }

      if (selectedPaymentMethod === 'wallet' && !walletPaymentAvailable) {
        setSelectedPaymentMethod('store');
        return;
      }

      if (
        selectedPaymentMethod === 'store' &&
        !storePaymentAvailable &&
        walletPaymentAvailable
      ) {
        setSelectedPaymentMethod('wallet');
      }
    }, [
      selectedPaymentMethod,
      showWalletPayment,
      storePaymentAvailable,
      walletPaymentAvailable,
    ]);

    const walletPurchasingDisabled = React.useMemo(() => {
      return (
        !showWalletPayment ||
        !walletPaymentAvailable ||
        paymentInProgress ||
        typeof currentUser === 'undefined'
      );
    }, [
      currentUser,
      paymentInProgress,
      showWalletPayment,
      walletPaymentAvailable,
    ]);

    const storePurchasingDisabled = React.useMemo(() => {
      return (
        !inAppPurchasingIsEnabled ||
        !inAppPurchasesIsInitialized ||
        paymentInProgress ||
        typeof selectedStorePrice === 'undefined'
      );
    }, [
      inAppPurchasesIsInitialized,
      inAppPurchasingIsEnabled,
      paymentInProgress,
      selectedStorePrice,
    ]);

    React.useEffect(() => {
      setWalletPurchaseErrorMessage(undefined);
    }, [selectedProductId]);

    const onOpenWalletPurchaseConfirmation = React.useCallback(() => {
      setWalletPurchaseErrorMessage(undefined);
      setShowWalletPurchaseConfirmation(true);
    }, []);

    const onDismissWalletPurchaseConfirmation = React.useCallback(() => {
      setShowWalletPurchaseConfirmation(false);
    }, []);

    const onWalletPurchasePress = React.useCallback(async () => {
      if (
        typeof selectedRentStorageOffering === 'undefined' ||
        typeof currentUser === 'undefined' ||
        typeof evmAddress === 'undefined'
      ) {
        return;
      }

      const units = selectedRentStorageOffering.units;
      const price = formatCents(selectedRentStorageOffering.sku.price);

      try {
        trackEvent(AnalyticsEvent.ClickStoragePurchase, {
          units: units,
          price: price,
          paymentMethod: 'wallet',
        });

        setWalletPurchasePending(true);
        setWalletPurchaseErrorMessage(undefined);

        const intent = await rentTransactionData({
          fid: currentUser.fid,
          units,
        });

        const chainId = parseEip155ChainId(intent.chainId);
        if (chainId !== optimism.id) {
          throw new Error(`Unsupported storage chain id: ${intent.chainId}`);
        }

        const chain = apiChainToViemChainOrThrow(
          chainIdToChainOrThrow(chainId.toString()),
        );
        const publicClient = getEthereumClient({ chain });
        const walletClient = await getWalletClient(chain);
        const value = BigInt(intent.params.value);
        const balance = await publicClient.getBalance({
          address: walletClient.account.address,
        });

        if (balance < value) {
          setWalletPurchaseErrorMessage(
            `You need at least ${formatEther(
              value,
            )} ETH on Optimism to purchase storage.`,
          );
          return;
        }

        const txHash = await walletClient.sendTransaction({
          data: intent.params.data as Hex,
          to: intent.params.to as Hex,
          value,
        });

        const walletRequestMetadata: ApiWalletRequestMetadata = {
          type: 'request',
          request: {
            method: 'eth_sendTransaction',
            params: {
              to: intent.params.to,
              data: intent.params.data,
              value: intent.params.value,
              chainId: walletClient.chain.id.toString(),
              from: walletClient.account.address,
            },
          },
        };

        addPendingTransaction({
          chain: chainIdToChainOrThrow(chain.id.toString()),
          txHash,
          metadata: walletRequestMetadata,
        });

        void recordWalletTransaction({
          params: {
            ethAddress: walletClient.account.address,
            ethChainId: walletClient.chain.id,
            ethTxHash: txHash,
            provider: 'warpcast',
            metadata: walletRequestMetadata,
          },
        });

        await invalidateStorageUtilization();

        setShowWalletPurchaseConfirmation(false);

        toast.show(
          'Storage transaction submitted. Your limits will update shortly.',
          {
            type: 'success',
            placement: 'top',
          },
        );
      } catch (error) {
        trackError(error);

        const message = getStoragePurchaseErrorMessage(error);

        setWalletPurchaseErrorMessage(message);

        toast.show(message, {
          type: 'danger',
          placement: 'top',
        });
      } finally {
        setWalletPurchasePending(false);
      }
    }, [
      addPendingTransaction,
      currentUser,
      evmAddress,
      getEthereumClient,
      getWalletClient,
      invalidateStorageUtilization,
      recordWalletTransaction,
      rentTransactionData,
      selectedRentStorageOffering,
      toast,
      trackEvent,
    ]);

    const onStorePurchasePress = React.useCallback(async () => {
      if (
        typeof selectedRentStorageOffering === 'undefined' ||
        typeof selectedStorePrice === 'undefined'
      ) {
        return;
      }

      const units = selectedRentStorageOffering.units;

      try {
        trackEvent(AnalyticsEvent.ClickStoragePurchase, {
          units,
          price: selectedStorePrice,
          paymentMethod: 'store',
        });

        setStorePurchasePending(true);

        await simulateRentStorage({ units });

        const metadata: ApiInAppPurchaseRentStorageMetadata = {
          type: 'rent-storage',
          content: { units },
          deviceId,
          devicePlatform: Platform.OS,
        };

        await purchase({
          onchainTransactionType: 'rent-storage',
          productId: selectedRentStorageOffering.sku.productId,
          metadata,
        });
      } catch (error) {
        trackError(error);

        trackEvent(AnalyticsEvent.RegisterIAPFail, {
          units,
        });

        toast.show('Failed to purchase. Please try again, later.', {
          type: 'danger',
          placement: 'top',
        });

        setStorePurchasePending(false);

        resetPurchaseState();
      }
    }, [
      deviceId,
      purchase,
      resetPurchaseState,
      selectedRentStorageOffering,
      selectedStorePrice,
      simulateRentStorage,
      toast,
      trackEvent,
    ]);

    React.useEffect(() => {
      navigation.setOptions({
        headerRight: () => storageScreenHeaderRight,
      });
    }, [navigation, storageScreenHeaderRight]);

    React.useEffect(() => {
      if (
        visibleRentStorageOfferings.length !== 0 &&
        (typeof selectedProductId === 'undefined' ||
          !visibleRentStorageOfferings.some(
            (offering) => offering.sku.productId === selectedProductId,
          ))
      ) {
        setSelectedProductId(visibleRentStorageOfferings[0].sku.productId);
      }
    }, [selectedProductId, visibleRentStorageOfferings]);

    React.useEffect(() => {
      if (typeof selectedRentStorageOffering === 'undefined') {
        return;
      }

      if (requestedPurchaseFailed) {
        trackError(
          new InAppPurchaseError({
            productId: selectedRentStorageOffering.sku.productId,
          }),
        );

        setStorePurchasePending(false);

        trackEvent(AnalyticsEvent.StoragePurchaseIAPFail, {
          units: selectedRentStorageOffering.units,
        });

        toast.show('Failed to purchase. Please try again, later.', {
          placement: 'top',
        });

        resetPurchaseState();
        return;
      }
      if (
        requestedPurchaseSucceeded &&
        typeof requestedPurchaseTrackingId !== 'undefined'
      ) {
        setStorePurchasePending(false);

        trackEvent(AnalyticsEvent.StoragePurchaseIAPSuccess, {
          units: selectedRentStorageOffering.units,
        });

        navigate('StorageTransaction', {
          productPurchaseTrackingId: requestedPurchaseTrackingId,
          units: selectedRentStorageOffering.units,
        });

        resetPurchaseState();
        return;
      }
    }, [
      navigate,
      requestedPurchaseFailed,
      requestedPurchaseSucceeded,
      requestedPurchaseTrackingId,
      resetPurchaseState,
      selectedRentStorageOffering,
      toast,
      trackEvent,
    ]);

    const storePaymentTitle = React.useMemo(() => {
      if (storePurchasePending) {
        return 'Confirming payment...';
      }

      if (!inAppPurchasingIsEnabled) {
        return 'Store payments unavailable';
      }

      if (!inAppPurchasesIsInitialized) {
        return 'Loading store payments...';
      }

      if (typeof selectedStorePrice === 'undefined') {
        return 'Store payment unavailable';
      }

      const price = ` (${selectedStorePrice})`;

      if (!showWalletPayment) {
        return `Purchase${price}`;
      }

      if (Platform.OS === 'ios') {
        return `Pay with App Store${price}`;
      }

      if (Platform.OS === 'android') {
        return `Pay with Play Store${price}`;
      }

      return `Pay with store${price}`;
    }, [
      inAppPurchasesIsInitialized,
      inAppPurchasingIsEnabled,
      selectedStorePrice,
      showWalletPayment,
      storePurchasePending,
    ]);

    const primaryButtonTitle = React.useMemo(() => {
      if (selectedPaymentMethod === 'store') {
        return storePaymentTitle;
      }

      if (walletPurchasePending) {
        return 'Confirming in wallet...';
      }

      if (typeof evmAddress === 'undefined') {
        return 'Wallet unavailable';
      }

      return 'Pay with wallet';
    }, [
      evmAddress,
      selectedPaymentMethod,
      storePaymentTitle,
      walletPurchasePending,
    ]);

    const primaryButtonDisabled =
      selectedPaymentMethod === 'store'
        ? storePurchasingDisabled
        : walletPurchasingDisabled;

    const onPrimaryButtonPress =
      selectedPaymentMethod === 'store'
        ? onStorePurchasePress
        : onOpenWalletPurchaseConfirmation;

    const showPaymentMethodSelector =
      showWalletPayment && storePaymentAvailable && walletPaymentAvailable;

    const totalCost = React.useMemo(() => {
      if (
        selectedPaymentMethod === 'store' &&
        typeof selectedStorePrice !== 'undefined'
      ) {
        return selectedStorePrice;
      }

      if (typeof selectedRentStorageOffering === 'undefined') {
        return undefined;
      }

      return formatCents(selectedRentStorageOffering.sku.price);
    }, [
      selectedPaymentMethod,
      selectedRentStorageOffering,
      selectedStorePrice,
    ]);

    return (
      <View style={[t.hFull, t.flex, t.flexCol, t.justifyBetween, t.pB4]}>
        <ScrollView style={[]}>
          <Divider marginVertical="slim" />
          <View style={[t.flex, t.p4]}>
            <Text style={[t.textBase, t.texts.secondary, t.mB4]}>
              Select amount
            </Text>
            {visibleRentStorageOfferings.map((rso) => {
              const selected = rso.sku.productId === selectedProductId;

              return (
                <TouchableOpacity
                  key={rso.sku.productId}
                  style={[
                    t.flex,
                    t.flexRow,
                    t.itemsCenter,
                    t.wFull,
                    t.mB2,
                    t.p4,
                    t.rounded,
                    t.borderDefault,
                    t.borderHairline,
                    selected && [t.bgDefault],
                  ]}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedProductId(rso.sku.productId);
                  }}
                >
                  <View
                    style={[
                      t.h6,
                      t.w6,
                      t.borderHairline,
                      t.borderDefault,
                      t.roundedFull,
                      t.mR4,
                      t.flex,
                      t.flexRow,
                      t.itemsCenter,
                      t.justifyCenter,
                      selected && [t.bgPillHighlight],
                    ]}
                  >
                    {selected && (
                      <View style={[t.h3, t.w3, t.roundedFull, t.bgAction]} />
                    )}
                  </View>
                  <View style={[t.flex, t.flexCol]}>
                    <Text style={[t.texts.primary, t.textLg]}>
                      {rso.units} {rso.units === 1 ? 'unit' : 'units'}
                    </Text>
                    <Text style={[t.texts.secondary, t.textSm]}>
                      {formatShorthandNumber(rso.limits.casts)} casts,{' '}
                      {formatShorthandNumber(rso.limits.reactions)} reactions,{' '}
                      {formatShorthandNumber(rso.limits.links)} follows
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Divider marginVertical="slim" />
          {typeof selectedRentStorageOffering === 'undefined' && (
            <View
              style={[t.flex, t.flexRow, t.itemsCenter, t.justifyCenter, t.mY4]}
            >
              <Octicons
                name={'arrow-up'}
                size={12}
                style={[t.texts.secondary, t.mR1]}
              />
              <Text style={[t.texts.secondary, t.textXs]}>
                Please select an amount above to continue.
              </Text>
            </View>
          )}
          {typeof selectedRentStorageOffering !== 'undefined' && (
            <View>
              <View
                style={[
                  t.p4,
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyBetween,
                ]}
              >
                <Text style={[t.textBase, t.texts.secondary]}>
                  You will have
                </Text>
                <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>{`${
                  selectedRentStorageOffering.units + alreadyRentedUnits
                } ${
                  selectedRentStorageOffering.units + alreadyRentedUnits === 1
                    ? 'unit'
                    : 'units'
                }`}</Text>
              </View>
              <Divider marginVertical="slim" />
              <View style={[t.p4, t.flex, t.flexCol]}>
                <Text style={[t.textBase, t.texts.secondary]}>
                  Preview usage
                </Text>
                <View style={[t.mY2, t.flex, t.flexCol]}>
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.itemsCenter,
                      t.justifyBetween,
                      t.mY2,
                    ]}
                  >
                    <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                      Casts
                    </Text>
                    <StorageCapacity
                      used={utilization.casts.used}
                      rented={
                        utilization.casts.rented +
                        selectedRentStorageOffering.limits.casts
                      }
                    />
                  </View>
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.itemsCenter,
                      t.justifyBetween,
                      t.mY2,
                    ]}
                  >
                    <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                      Reactions
                    </Text>
                    <StorageCapacity
                      used={utilization.reactions.used}
                      rented={
                        utilization.reactions.rented +
                        selectedRentStorageOffering.limits.reactions
                      }
                    />
                  </View>
                  <View
                    style={[
                      t.flex,
                      t.flexRow,
                      t.itemsCenter,
                      t.justifyBetween,
                      t.mY2,
                    ]}
                  >
                    <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                      Follows
                    </Text>
                    <StorageCapacity
                      used={utilization.links.used}
                      rented={
                        utilization.links.rented +
                        selectedRentStorageOffering.limits.links
                      }
                    />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        {typeof selectedRentStorageOffering !== 'undefined' && (
          <View style={[t.flex, t.flexCol, t.mX4, t.justifyEnd]}>
            <Divider marginVertical="slim" />
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.mY2,
              ]}
            >
              <Text style={[t.textBase, t.texts.secondary]}>Total cost</Text>
              <View style={[t.flex, t.flexRow, t.itemsCenter]}>
                <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                  {totalCost}
                </Text>
                <Text style={[t.textBase, t.texts.secondary]}> per year</Text>
              </View>
            </View>
            <View style={[t.mT2]}>
              {showPaymentMethodSelector && (
                <View
                  style={[
                    t.flex,
                    t.flexRow,
                    t.itemsCenter,
                    t.p1,
                    t.roundedFull,
                    t.bgDefault,
                    t.mB2,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedPaymentMethod('wallet');
                    }}
                    style={[
                      t.flex1,
                      t.itemsCenter,
                      t.justifyCenter,
                      t.roundedFull,
                      t.pY2,
                      selectedPaymentMethod === 'wallet' && t.bgFaint,
                    ]}
                  >
                    <Text
                      style={[
                        t.textSm,
                        selectedPaymentMethod === 'wallet'
                          ? t.texts.primary
                          : t.texts.secondary,
                      ]}
                    >
                      Wallet
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setSelectedPaymentMethod('store');
                    }}
                    style={[
                      t.flex1,
                      t.itemsCenter,
                      t.justifyCenter,
                      t.roundedFull,
                      t.pY2,
                      selectedPaymentMethod === 'store' && t.bgFaint,
                    ]}
                  >
                    <Text
                      style={[
                        t.textSm,
                        selectedPaymentMethod === 'store'
                          ? t.texts.primary
                          : t.texts.secondary,
                      ]}
                    >
                      {Platform.OS === 'ios'
                        ? 'App Store'
                        : Platform.OS === 'android'
                          ? 'Play Store'
                          : 'Store'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <ButtonV2
                title={primaryButtonTitle}
                disabled={primaryButtonDisabled}
                onDisabledPress={
                  selectedPaymentMethod === 'store'
                    ? retryProductFetch
                    : undefined
                }
                onPress={onPrimaryButtonPress}
              />
            </View>
          </View>
        )}
        {showWalletPurchaseConfirmation &&
          typeof selectedRentStorageOffering !== 'undefined' && (
            <StoragePurchaseConfirmationSheet
              errorMessage={walletPurchaseErrorMessage}
              isPurchasing={walletPurchasePending}
              onConfirm={onWalletPurchasePress}
              onDismiss={onDismissWalletPurchaseConfirmation}
              price={formatCents(selectedRentStorageOffering.sku.price)}
              units={selectedRentStorageOffering.units}
            />
          )}
      </View>
    );
  },
);

BuyStorageScreen.displayName = 'BuyStorageScreen';

export { BuyStorageScreen };
