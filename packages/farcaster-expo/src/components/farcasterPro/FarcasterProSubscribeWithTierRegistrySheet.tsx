import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import formatDistanceStrict from 'date-fns/formatDistanceStrict';
import enUS from 'date-fns/locale/en-US';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  apiChainToViemChainOrThrow,
  type ApiFarcasterProSubscriptionUsdcInfo,
  ApiWalletRequestMetadata,
  chainIdToChainOrThrow,
  getTransactionExplorerUrl,
  tierRegistryAbi,
} from 'farcaster-client-data';
import {
  useFarcasterProSubscribeWithUsdc,
  useFarcasterProSubscribeWithUsdcDetails,
  useFarcasterProSubscribeWithUsdcStatus,
  useRecordWalletTransaction,
} from 'farcaster-client-hooks';
import { ExternalLinkIcon } from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import {
  concat,
  encodeFunctionData,
  erc20Abi,
  Hex,
  keccak256,
  parseUnits,
  toHex,
} from 'viem';

import {
  useEmbeddedWallet,
  usePublicClient,
  useSharedTelemetry,
  useTheme,
} from '../../contexts';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useWalletBalances } from '../../hooks/useWalletBalances';
import { AutoDisplayingBottomSheetModal } from '../bottom-sheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '../design-system/ButtonV2';
import { Text2 } from '../design-system/Text';
import { TextWithPress } from '../design-system/TextWithPress';
import { BaseLogoIcon, FarcasterArchIcon, USDCIcon } from '../icons';

// USDC contract address on Base (used in useWalletPositionsQuery)
const USDC_CONTRACT_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDC_CONTRACT_DECIMALS = 6;
const MIN_AMOUNT_REQUIRED_FOR_GASLESS_SWAP = 0.25;
const BASE_ETH_MIN_AMOUNT = 0.0001;
const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const DELEGATED_ACCOUNT_IN_FLIGHT_ERROR =
  'in-flight transaction limit reached for delegated accounts';
const DELEGATED_ACCOUNT_RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

const PRO_TIER_TYPE = 1;

const hasSufficientUsdcAllowance = async ({
  readAllowance,
  requiredAmount,
}: {
  readAllowance: () => Promise<bigint>;
  requiredAmount: bigint;
}) => {
  try {
    return (await readAllowance()) >= requiredAmount;
  } catch {
    return false;
  }
};

const sendPurchaseWithDelegatedAccountRetry = async <T,>({
  sendPurchase,
}: {
  sendPurchase: () => Promise<T>;
}): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await sendPurchase();
    } catch (error) {
      const retryDelay = DELEGATED_ACCOUNT_RETRY_DELAYS_MS[attempt];
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (
        retryDelay === undefined ||
        !errorMessage.includes(DELEGATED_ACCOUNT_IN_FLIGHT_ERROR)
      ) {
        throw error;
      }

      await new Promise<void>((resolve) => setTimeout(resolve, retryDelay));
    }
  }
};

type FarcasterProUSDCPlanAnalyticsProps = {
  source?: string;
  paymentMethod: 'usdc';
  subscriptionType?: ApiFarcasterProSubscriptionUsdcInfo['subscriptionType'];
  billingInterval?: ApiFarcasterProSubscriptionUsdcInfo['billingInterval'];
  durationInDays?: number;
  priceInUsdc?: number;
  chainId?: number;
  transactionType?: ApiFarcasterProSubscriptionUsdcInfo['transactionType'];
};

const buildFarcasterProUSDCPlanAnalyticsProps = ({
  plan,
  source,
}: {
  plan?: Pick<
    ApiFarcasterProSubscriptionUsdcInfo,
    | 'billingInterval'
    | 'chainId'
    | 'durationInDays'
    | 'priceInUsdc'
    | 'subscriptionType'
    | 'transactionType'
  >;
  source?: string;
}): FarcasterProUSDCPlanAnalyticsProps => ({
  source,
  paymentMethod: 'usdc',
  subscriptionType: plan?.subscriptionType,
  billingInterval: plan?.billingInterval,
  durationInDays: plan?.durationInDays,
  priceInUsdc: plan?.priceInUsdc,
  chainId: plan?.chainId,
  transactionType: plan?.transactionType,
});

type FarcasterProUSDCTransactionStatus =
  | 'pending'
  | 'approving'
  | 'confirming'
  | 'validating'
  | 'succeeded'
  | 'error-purchasing'
  | 'error-validating'
  | 'error-approving'
  | 'error-settling'
  | 'timeout';

const isSameFarcasterProUSDCPlan = (
  subscription: ApiFarcasterProSubscriptionUsdcInfo,
  selectedSubscription: ApiFarcasterProSubscriptionUsdcInfo,
) =>
  subscription.subscriptionType === selectedSubscription.subscriptionType &&
  subscription.transactionType === selectedSubscription.transactionType &&
  subscription.billingInterval === selectedSubscription.billingInterval &&
  subscription.durationInDays === selectedSubscription.durationInDays &&
  subscription.priceInUsdc === selectedSubscription.priceInUsdc &&
  subscription.chainId === selectedSubscription.chainId &&
  subscription.targetAddress.toLowerCase() ===
    selectedSubscription.targetAddress.toLowerCase();

const DetailRow = ({
  label,
  value,
  valueNode,
  align = 'row',
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  align?: 'row' | 'col';
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        align === 'row' ? t.flexRow : t.flexCol,
        align === 'row' ? t.justifyBetween : undefined,
        align === 'row' ? t.itemsCenter : undefined,
        t.p3,
        { backgroundColor: t.colors.bgNewLightGray },
      ]}
    >
      <Text2 size="base" color="secondary" weight="medium">
        {label}
      </Text2>
      {valueNode ? (
        valueNode
      ) : value ? (
        <Text2 size="base" color="secondary" weight="medium">
          {value}
        </Text2>
      ) : null}
    </View>
  );
};

const FarcasterProSubscribeWithTierRegistrySheet = ({
  farcasterProUSDCDetails: selectedFarcasterProUSDCDetails,
  onDismiss,
  onSuccess,
  source,
}: {
  farcasterProUSDCDetails: ApiFarcasterProSubscriptionUsdcInfo;
  onDismiss: () => void;
  onSuccess: () => void;
  source?: string;
}) => {
  const t = useTheme();
  const { trackEvent, trackError } = useSharedTelemetry();
  const [isConfirming, setIsConfirming] = useState(false);
  const {
    getWalletClient,
    addPendingTransaction,
    removePendingTransaction,
    transactionCounterRef,
    evmAddress,
  } = useEmbeddedWallet();
  const currentUser = useCurrentUser();
  const {
    data: subscribeWithUSDCDetails,
    isPending: subscribeWithUSDCDetailsPending,
    refetch: refetchSubscribeWithUSDCDetails,
  } = useFarcasterProSubscribeWithUsdcDetails();
  const recordWalletTransaction = useRecordWalletTransaction();
  const { getEthereumClient } = usePublicClient();
  const [approvalTxHash, setApprovalTxHash] = useState<Hex | undefined>(
    undefined,
  );
  const [purchaseTxHash, setPurchaseTxHash] = useState<Hex | undefined>(
    undefined,
  );
  const [txStatus, setTxStatus] = useState<
    FarcasterProUSDCTransactionStatus | undefined
  >(undefined);
  const [subscriptionWorkflowId, setSubscriptionWorkflowId] = useState<
    string | undefined
  >(undefined);
  const subscribeWithUsdc = useFarcasterProSubscribeWithUsdc();
  const subscriptionState = useFarcasterProSubscribeWithUsdcStatus({
    workflowId: subscriptionWorkflowId || '',
    enabled: !!subscriptionWorkflowId,
  });

  const farcasterProUSDCDetails = useMemo(() => {
    return (
      subscribeWithUSDCDetails?.subscriptions.find((subscription) =>
        isSameFarcasterProUSDCPlan(
          subscription,
          selectedFarcasterProUSDCDetails,
        ),
      ) ?? selectedFarcasterProUSDCDetails
    );
  }, [selectedFarcasterProUSDCDetails, subscribeWithUSDCDetails]);

  const usdcPlanAnalyticsProps = useMemo(
    () =>
      buildFarcasterProUSDCPlanAnalyticsProps({
        source,
        plan: farcasterProUSDCDetails,
      }),
    [farcasterProUSDCDetails, source],
  );

  const durationString = useMemo(() => {
    if (!farcasterProUSDCDetails) {
      return '';
    }
    return formatDistanceStrict(
      new Date(farcasterProUSDCDetails.durationInDays * 24 * 60 * 60 * 1000),
      new Date(0),
      {
        roundingMethod: 'floor',
        locale: enUS,
      },
    );
  }, [farcasterProUSDCDetails]);

  const modalRef = useRef<{ dismiss: () => void }>(null);

  const { balances, isPending: balancesPending } = useWalletBalances();

  const usdcBalance = useMemo(() => {
    return (
      balances?.find((p) => p?.address === USDC_CONTRACT_ADDRESS)?.quantity
        .float || 0
    );
  }, [balances]);

  const baseEthBalance = useMemo(() => {
    if (balancesPending) {
      return undefined;
    }
    return balances.find((p) => p?.id === 'base:native')?.quantity.float || 0;
  }, [balances, balancesPending]);

  const needsGasless =
    baseEthBalance !== undefined && baseEthBalance < BASE_ETH_MIN_AMOUNT;

  const hasEnoughUsdc = useMemo(() => {
    if (!farcasterProUSDCDetails) {
      return undefined;
    }
    return (
      usdcBalance >=
      farcasterProUSDCDetails.priceInUsdc +
        (needsGasless ? MIN_AMOUNT_REQUIRED_FOR_GASLESS_SWAP : 0)
    );
  }, [usdcBalance, farcasterProUSDCDetails, needsGasless]);

  const sendQuantity = useMemo(() => {
    if (!farcasterProUSDCDetails) {
      return undefined;
    }
    return BigInt(
      parseUnits(
        farcasterProUSDCDetails.priceInUsdc.toString(),
        USDC_CONTRACT_DECIMALS,
      ),
    );
  }, [farcasterProUSDCDetails]);

  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetViewTrackedRef = useRef(false);
  const terminalPurchaseEventTrackedRef = useRef(false);

  const trackTerminalPurchaseEvent = useCallback(
    (status: FarcasterProUSDCTransactionStatus) => {
      if (terminalPurchaseEventTrackedRef.current) {
        return;
      }

      if (status === 'succeeded') {
        trackEvent(
          AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetPurchaseSucceeded,
          {
            ...usdcPlanAnalyticsProps,
            state: status,
          },
        );
        terminalPurchaseEventTrackedRef.current = true;
        return;
      }

      if (status.startsWith('error') || status === 'timeout') {
        trackEvent(
          AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetPurchaseFailed,
          {
            ...usdcPlanAnalyticsProps,
            failureState: status,
          },
        );
        terminalPurchaseEventTrackedRef.current = true;
      }
    },
    [trackEvent, usdcPlanAnalyticsProps],
  );

  useEffect(() => {
    if (sheetViewTrackedRef.current) {
      return;
    }

    trackEvent(
      AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetView,
      usdcPlanAnalyticsProps,
    );
    sheetViewTrackedRef.current = true;
  }, [trackEvent, usdcPlanAnalyticsProps]);

  useEffect(() => {
    if (!subscriptionState) {
      return;
    }

    switch (subscriptionState) {
      case 'completed':
        setIsConfirming(false);
        setTxStatus('succeeded');
        setSubscriptionWorkflowId(undefined);
        trackTerminalPurchaseEvent('succeeded');
        onSuccess();
        break;
      case 'failed':
        setIsConfirming(false);
        setTxStatus('error-validating');
        setSubscriptionWorkflowId(undefined);
        trackTerminalPurchaseEvent('error-validating');
        break;
      case 'in-progress':
        setTxStatus('validating');
        break;
    }
  }, [subscriptionState, onSuccess, trackTerminalPurchaseEvent]);

  useEffect(() => {
    if (needsGasless) {
      trackEvent(
        AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetNotEnoughETH,
        usdcPlanAnalyticsProps,
      );
    }
  }, [needsGasless, trackEvent, usdcPlanAnalyticsProps]);

  useEffect(() => {
    if (hasEnoughUsdc === false) {
      trackEvent(
        AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetNotEnoughUSDC,
        usdcPlanAnalyticsProps,
      );
    }
  }, [hasEnoughUsdc, trackEvent, usdcPlanAnalyticsProps]);

  useEffect(() => {
    if (txStatus) {
      trackEvent(AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetStateChange, {
        ...usdcPlanAnalyticsProps,
        state: txStatus,
      });
    }
  }, [trackEvent, txStatus, usdcPlanAnalyticsProps]);

  useEffect(() => {
    if (!txStatus) {
      return;
    }

    trackTerminalPurchaseEvent(txStatus);
  }, [trackTerminalPurchaseEvent, txStatus]);

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const explorerUrl = useMemo(() => {
    const hash = purchaseTxHash || approvalTxHash;
    if (!hash || !farcasterProUSDCDetails) {
      return undefined;
    }
    return getTransactionExplorerUrl({
      type: 'tx',
      hash,
      chainId: farcasterProUSDCDetails.chainId.toString(),
    });
  }, [purchaseTxHash, approvalTxHash, farcasterProUSDCDetails]);

  const restartTimeoutCounter = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    const newTimeoutId = setTimeout(() => {
      setTxStatus('timeout');
      setSubscriptionWorkflowId(undefined);
      setIsConfirming(false);
    }, TIMEOUT_DURATION);
    timeoutIdRef.current = newTimeoutId;
  }, []);

  const handleConfirm = useCallback(async () => {
    if (
      !farcasterProUSDCDetails ||
      !sendQuantity ||
      !currentUser?.fid ||
      !evmAddress
    ) {
      return;
    }
    terminalPurchaseEventTrackedRef.current = false;
    trackEvent(
      AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetClickPay,
      usdcPlanAnalyticsProps,
    );

    setTxStatus('approving');
    setIsConfirming(true);

    const chain = apiChainToViemChainOrThrow(
      chainIdToChainOrThrow(farcasterProUSDCDetails.chainId.toString()),
    );

    const walletClient = await getWalletClient(chain);
    const dataSuffix = keccak256(toHex('warpcast.com')).slice(0, 10) as Hex;
    const publicClient = getEthereumClient({ chain });

    const hasSufficientAllowance = await hasSufficientUsdcAllowance({
      requiredAmount: sendQuantity,
      readAllowance: () =>
        publicClient.readContract({
          address: USDC_CONTRACT_ADDRESS as `0x${string}`,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [
            walletClient.account.address,
            farcasterProUSDCDetails.targetAddress as `0x${string}`,
          ],
        }),
    });

    if (!hasSufficientAllowance) {
      try {
        const approveData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [
            farcasterProUSDCDetails.targetAddress as `0x${string}`,
            sendQuantity,
          ],
        });

        const approvalTxHashInner = await walletClient.sendTransaction({
          to: USDC_CONTRACT_ADDRESS as `0x${string}`,
          data: concat([approveData, dataSuffix]),
        });
        setApprovalTxHash(approvalTxHashInner);
        restartTimeoutCounter();

        const approvalReceipt = await publicClient.waitForTransactionReceipt({
          hash: approvalTxHashInner,
          timeout: 120_000,
        });

        if (approvalReceipt.status !== 'success') {
          setTxStatus('error-approving');
          setIsConfirming(false);
          return;
        }
      } catch (error) {
        trackError(error);
        setTxStatus('error-approving');
        setIsConfirming(false);
        return;
      }
    }

    let workflowId: string | undefined;
    let purchaseTxHashInner: Hex;
    const purchaseData = encodeFunctionData({
      abi: tierRegistryAbi,
      functionName: 'purchaseTier',
      args: [
        BigInt(currentUser.fid),
        BigInt(PRO_TIER_TYPE),
        BigInt(farcasterProUSDCDetails.durationInDays),
      ],
    });

    try {
      setTxStatus('pending');
      purchaseTxHashInner = await sendPurchaseWithDelegatedAccountRetry({
        sendPurchase: () =>
          walletClient.sendTransaction({
            to: farcasterProUSDCDetails.targetAddress as `0x${string}`,
            data: concat([purchaseData, dataSuffix]),
          }),
      });
      setPurchaseTxHash(purchaseTxHashInner);
      restartTimeoutCounter();
    } catch (error) {
      trackError(error);
      setTxStatus('error-purchasing');
      setIsConfirming(false);
      return;
    }

    addPendingTransaction({
      chain: chainIdToChainOrThrow(chain.id.toString()),
      txHash: purchaseTxHashInner,
      metadata: {
        type: 'request',
        request: {
          method: 'eth_sendTransaction',
          params: {
            to: farcasterProUSDCDetails.targetAddress,
            data: purchaseData,
            value: '0',
            chainId: walletClient.chain.id.toString(),
            from: walletClient.account.address,
          },
        },
      } as ApiWalletRequestMetadata,
    });

    void recordWalletTransaction({
      params: {
        ethAddress: walletClient.account.address,
        ethChainId: walletClient.chain.id,
        ethTxHash: purchaseTxHashInner,
        provider: 'warpcast',
        metadata: {
          type: 'request',
          request: {
            method: 'eth_sendTransaction',
            params: {
              to: farcasterProUSDCDetails.targetAddress,
              data: purchaseData,
              value: '0',
              chainId: walletClient.chain.id.toString(),
              from: walletClient.account.address,
            },
          },
        } as ApiWalletRequestMetadata,
      },
    });

    try {
      workflowId = await subscribeWithUsdc({
        chainId: farcasterProUSDCDetails.chainId,
        txHash: purchaseTxHashInner,
        subscriptionType: 'farcaster-pro',
        usdcAmount: farcasterProUSDCDetails.priceInUsdc,
        durationInDays: farcasterProUSDCDetails.durationInDays,
        transactionType: 'farcaster-tier-registry',
      });
    } catch (error) {
      trackError(error);
    }

    try {
      setTxStatus('confirming');
      const purchaseReceipt = await publicClient.waitForTransactionReceipt({
        hash: purchaseTxHashInner,
        timeout: 120_000,
      });

      await removePendingTransaction(purchaseTxHashInner);

      if (purchaseReceipt.status === 'success') {
        if (workflowId) {
          setSubscriptionWorkflowId(workflowId);
        } else {
          setTxStatus('error-validating');
          setIsConfirming(false);
        }
      } else {
        setTxStatus('error-purchasing');
        setIsConfirming(false);
      }
    } catch (error) {
      trackError(error);
      if (workflowId) {
        setSubscriptionWorkflowId(workflowId);
      } else {
        setTxStatus('error-validating');
        setIsConfirming(false);
      }
      return;
    } finally {
      transactionCounterRef.current += 1;
    }
  }, [
    farcasterProUSDCDetails,
    sendQuantity,
    currentUser?.fid,
    evmAddress,
    trackEvent,
    getWalletClient,
    getEthereumClient,
    addPendingTransaction,
    recordWalletTransaction,
    restartTimeoutCounter,
    trackError,
    subscribeWithUsdc,
    removePendingTransaction,
    transactionCounterRef,
    usdcPlanAnalyticsProps,
  ]);

  const handleCancel = useCallback(() => {
    trackEvent(
      AnalyticsEvent.FarcasterProSubscribeWithUSDCSheetClickCancel,
      usdcPlanAnalyticsProps,
    );
    onDismiss();
  }, [onDismiss, trackEvent, usdcPlanAnalyticsProps]);

  useEffect(() => {
    if (
      txStatus === 'succeeded' ||
      (txStatus && txStatus.startsWith('error')) ||
      txStatus === 'timeout'
    ) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
    }
  }, [txStatus]);

  useEffect(() => {
    if (!farcasterProUSDCDetails) {
      return;
    }
    if (farcasterProUSDCDetails.pending) {
      setPurchaseTxHash(farcasterProUSDCDetails.pending.txHash as Hex);
      setSubscriptionWorkflowId(farcasterProUSDCDetails.pending.workflowId);
      setTxStatus('confirming');
      setIsConfirming(true);
      restartTimeoutCounter();
      return;
    }
  }, [farcasterProUSDCDetails, onSuccess, restartTimeoutCounter]);

  const errorMessage = useMemo(() => {
    switch (txStatus) {
      case 'timeout':
        return 'This operation took too long. It might have worked in the background, but we could not confirm it. Please check your wallet or try again later.';
      case 'error-purchasing':
      case 'error-settling':
        return "Couldn't complete the transaction. No USDC was transferred, please try again.";
      case 'error-validating':
        return "Your payment was received, but we couldn't activate your subscription yet. Our team is looking into it. This may take up to 24 hours.";
    }
  }, [txStatus]);

  const txStatusText = useMemo(() => {
    switch (txStatus) {
      case 'pending':
        return (
          <Text2 size="base" color="secondary" weight="medium">
            Pending
          </Text2>
        );
      case 'approving':
        return (
          <Text2 size="base" color="secondary" weight="medium">
            Approving USDC
          </Text2>
        );
      case 'confirming':
      case 'validating':
        return (
          <Text2 size="base" color="secondary" weight="medium">
            Confirming
          </Text2>
        );
      case 'succeeded':
        return (
          <Text2 size="base" color="success" weight="medium">
            Succeeded
          </Text2>
        );
      case 'error-purchasing':
        return (
          <Text2 size="base" color="danger" weight="medium">
            Error Purchasing
          </Text2>
        );
      case 'error-validating':
        return (
          <Text2 size="base" color="danger" weight="medium">
            Error Validating
          </Text2>
        );
      case 'error-settling':
        return (
          <Text2 size="base" color="danger" weight="medium">
            Error Settling
          </Text2>
        );
      case 'timeout':
        return (
          <Text2 size="base" color="danger" weight="medium">
            Timeout
          </Text2>
        );
    }
  }, [txStatus]);

  const enableContentPanningGesture = useMemo(() => {
    if (isConfirming) {
      return false;
    }
    return Platform.OS !== 'web';
  }, [isConfirming]);

  const backgroundStyle = useMemo(
    () => [
      t.borderHairline,
      t.borderDefault,
      t.bgDefault,
      { borderRadius: 24 },
    ],
    [t],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior={'close'}
        appearsOnIndex={1}
        disappearsOnIndex={-1}
        opacity={0.15}
      />
    ),
    [],
  );

  const displayedTxHash = purchaseTxHash || approvalTxHash;
  const displayedInModalPresentationScreen = Platform.OS !== 'web';

  const restProps = useMemo(() => {
    return { backdropComponent: renderBackdrop };
  }, [renderBackdrop]);

  return (
    <AutoDisplayingBottomSheetModal
      ref={modalRef}
      name="farcaster-pro-subscribe-with-tier-registry"
      onDismiss={onDismiss}
      handleComponent={null}
      enableContentPanningGesture={enableContentPanningGesture}
      backgroundStyle={backgroundStyle}
      animationConfigs={undefined}
      displayedInModalPresentationScreen={displayedInModalPresentationScreen}
      {...restProps}
    >
      {balancesPending ||
      subscribeWithUSDCDetailsPending ||
      !farcasterProUSDCDetails ? (
        <View style={[t.flex, t.justifyCenter, t.itemsCenter, { height: 260 }]}>
          <ActivityIndicator size="large" color={t.colors.text.primary} />
        </View>
      ) : (
        <>
          <SheetHeader />
          <View style={[t.flexCol, { gap: 12 }]}>
            {(!hasEnoughUsdc || needsGasless) && (
              <View
                style={[
                  t.flex,
                  t.flexCol,
                  t.p3,
                  t.bgFaint,
                  t.roundedLg,
                  {
                    backgroundColor: '#F43F5E1A',
                    gap: 4,
                  },
                ]}
              >
                <Text2 weight="medium" size="base" color="primary">
                  {needsGasless
                    ? "You don't have enough Base ETH to pay for the transaction."
                    : "You don't have enough USDC to subscribe to Farcaster Pro."}
                </Text2>
              </View>
            )}
            {txStatus &&
              (txStatus.startsWith('error') || txStatus === 'timeout') && (
                <View
                  style={[
                    t.flex,
                    t.flexCol,
                    t.p3,
                    t.bgFaint,
                    t.roundedLg,
                    {
                      backgroundColor: '#F43F5E1A',
                      gap: 4,
                    },
                  ]}
                >
                  <Text2 size="base" color="primary" weight="medium">
                    {errorMessage}
                  </Text2>
                </View>
              )}
            <View
              style={[
                t.flexCol,
                { borderRadius: 12 },
                { gap: 1 },
                { overflow: 'hidden' },
              ]}
            >
              <DetailRow label={`${durationString} of Farcaster Pro`} />
              <DetailRow
                label="Plan"
                value={
                  farcasterProUSDCDetails.billingInterval === 'monthly'
                    ? 'Monthly'
                    : 'Yearly'
                }
              />
              <DetailRow
                label="Send"
                valueNode={
                  <View
                    style={[
                      t.flexRow,
                      t.itemsCenter,
                      t.texts.primary,
                      { gap: 4 },
                    ]}
                  >
                    <USDCIcon size={16} />
                    <Text2
                      size="base"
                      weight="regular"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      -{farcasterProUSDCDetails.priceInUsdc.toLocaleString()}
                    </Text2>
                    <Text2 size="base" color="secondary" weight="medium">
                      USDC
                    </Text2>
                  </View>
                }
              />
              <DetailRow
                label="Network"
                valueNode={
                  <View
                    style={[
                      t.flexRow,
                      t.itemsCenter,
                      t.texts.primary,
                      { gap: 4 },
                    ]}
                  >
                    <BaseLogoIcon size={16} />
                    <Text2 size="base" color="secondary" weight="medium">
                      Base
                    </Text2>
                  </View>
                }
              />
              {displayedTxHash && explorerUrl && (
                <DetailRow
                  label="Transaction Hash"
                  value={displayedTxHash}
                  valueNode={
                    <TextWithPress
                      style={[
                        t.texts.tertiary,
                        t.textCenter,
                        t.underline,
                        t.textBase,
                        t.mL2,
                      ]}
                      onPress={() => {
                        Linking.openURL(explorerUrl);
                      }}
                    >
                      {`${displayedTxHash.slice(0, 13)}... `}
                      <ExternalLinkIcon size={10} />
                    </TextWithPress>
                  }
                />
              )}
              {txStatus && (
                <DetailRow
                  label="Transaction Status"
                  valueNode={txStatusText}
                />
              )}
            </View>
            <View style={{ flexGrow: 1 }} />
            <View style={[t.flexRow, t.justifyBetween, { gap: 12 }]}>
              {!isConfirming && (
                <ButtonV2
                  title={
                    txStatus === 'error-validating' || txStatus === 'timeout'
                      ? 'Close'
                      : 'Cancel'
                  }
                  textSize="lg"
                  onPress={handleCancel}
                  variant="secondary"
                  width="flex1"
                />
              )}
              {txStatus !== 'error-validating' && (
                <ButtonV2
                  title={
                    isConfirming
                      ? txStatus === 'approving'
                        ? 'Approving USDC'
                        : 'Confirming Payment'
                      : txStatus?.startsWith('error') || txStatus === 'timeout'
                        ? 'Retry'
                        : 'Confirm'
                  }
                  textSize="lg"
                  onPress={async () => {
                    if (txStatus === 'timeout') {
                      await refetchSubscribeWithUSDCDetails();
                    } else {
                      await handleConfirm();
                    }
                  }}
                  loading={isConfirming}
                  disabled={isConfirming || !hasEnoughUsdc}
                  width="flex1"
                />
              )}
            </View>
          </View>
        </>
      )}
    </AutoDisplayingBottomSheetModal>
  );
};

const SheetHeader = () => {
  const t = useTheme();

  return (
    <View style={[t.mY3, t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
      <View
        style={[
          t.justifyCenter,
          t.itemsCenter,
          t.w12,
          t.h12,
          t.borderHairline,
          t.borderDefault,
          { borderRadius: 14, backgroundColor: t.colors.text.brand },
        ]}
      >
        <FarcasterArchIcon width={36} height={36} variant="white" />
      </View>
      <View style={[t.flex, t.flexCol]}>
        <Text2 weight="semibold" size="lg">
          Farcaster Pro
        </Text2>
      </View>
    </View>
  );
};

export {
  buildFarcasterProUSDCPlanAnalyticsProps,
  FarcasterProSubscribeWithTierRegistrySheet,
};
