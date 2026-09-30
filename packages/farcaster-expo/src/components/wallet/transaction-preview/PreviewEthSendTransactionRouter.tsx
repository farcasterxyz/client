import {
  ApiChainId,
  ApiEthSignTypedDataV4Request,
  ApiFarcasterWalletAction,
  ApiWalletActionValidationType,
  Chain,
  chainIdToChainOrThrow,
  GASLESS_CHAINS,
  getChainByChainId,
} from 'farcaster-client-data';
import {
  useEmbeddedWalletsQuery,
  useEvmScanAction,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { hexToNumber, hexToString, parseUnits } from 'viem';

import { useEmbeddedWallet } from '../../../contexts';
import {
  SwapForGasIntent,
  useCurrentUserFid,
  useEvmBalance,
  useExecuteSwapForGas,
  useSecondaryWalletsEnabled,
  useTotalEvmGasFeeEstimate,
  useWalletBalances,
} from '../../../hooks';
import { ConnectionContext, EvmPreviewRequest } from '../../../types';
import { NATIVE_ASSET_SYMBOLS, parseSendCalls } from '../../../utils';
import { assertHex } from '../../../utils/DataUtils';
import { logInDevOnly } from '../../../utils/LogUtils';
import {
  MaliciousScanSection,
  TestnetPreviewSection,
  WarningScanSection2,
} from './common/StateChangesView';
import { resolveEvmPreviewRequestAddress } from './PreviewEthSendTransactionUtils';
import {
  ErrorDisplayScreen,
  GaslessSwapPendingScreen,
  TransactionValidationLoadingScreen,
  ValidationAssertionScreen,
  VerifiedTransactionScreen,
} from './screens';
import { SwapBeforeSimulationScreen } from './screens/SwapBeforeSimulationScreen';
import { WalletSignMessageContent } from './sign/WalletSignMessageContent';
import { getChainFromEvmChainId } from './utils';

/**
 * Parses the `params[1]` value of an `eth_signTypedData_v4` RPC request.
 *
 * Per EIP-712 / EIP-1193 common practice, dapps may pass the typed-data
 * payload either as a JSON-encoded string (MetaMask legacy convention) or as
 * an already-deserialized object (modern injected providers such as the
 * Uniswap Interface). This helper normalizes both forms so downstream code
 * can assume a structured object.
 */
function parseTypedDataParam(raw: unknown): unknown {
  if (raw && typeof raw === 'object') {
    return raw;
  }
  if (typeof raw === 'string') {
    return JSON.parse(raw);
  }
  throw new Error('Unsupported eth_signTypedData_v4 payload shape');
}

export const VALIDATION_FAILURE_MESSAGE =
  'We were unable to confirm the safety of this operation. Proceeding could put your funds at risk.';

export const UNSUPPORTED_NETWORK_MESSAGE =
  "This network doesn't support the tools we use for safety checks. If you're confident in the source, you may proceed.";

export const MALICIOUS_TRANSACTION_MESSAGE =
  'We believe this transaction is malicious and unsafe';

const GASLESS_METHODS: Set<
  | 'eth_signTypedData_v4'
  | 'personal_sign'
  | 'eth_sendTransaction'
  | 'wallet_sendCalls'
> = new Set(['eth_signTypedData_v4', 'personal_sign']);

// chainIds permitted in `domain.chainId` for `eth_signTypedData_v4` only.
// Off-chain protocol sentinels — no RPC, no broadcast. Read solely inside
// `getSignedTypedDataChain` (invoked only for `eth_signTypedData_v4`) and
// the `offChainSignatureLabel` memo, so these IDs cannot leak into
// `eth_sendTransaction` / `wallet_sendCalls` paths.
// 1337 = Hyperliquid L1 actions (setReferrer, etc.).
const SIGN_ONLY_SENTINEL_LABELS: ReadonlyMap<number, string> = new Map([
  [1337, 'Hyperliquid'],
]);

type ChainResolve =
  | { kind: 'ok'; chain: Chain }
  | { kind: 'absent' }
  | { kind: 'error' };

type GasFeeValidation =
  | { canEstimate: false }
  | { canEstimate: true; hasEnough: boolean };

/**
 * Router component that handles the different states of transaction previews
 * and renders the appropriate screen component
 */
export function PreviewEthSendTransactionRouter({
  connectionContext,
  request,
  blockNumber,
  onConfirmTransaction,
  onCancelTransaction,
  isTopLevelConfirming,
  isTopLevelCancelling,
  setTopLevelChainId,
  setTransactionSubmitted,
}: {
  connectionContext: ConnectionContext;
  request: EvmPreviewRequest<
    | 'eth_sendTransaction'
    | 'eth_signTypedData_v4'
    | 'personal_sign'
    | 'wallet_sendCalls'
  >;
  blockNumber?: number;
  onConfirmTransaction: () => Promise<void>;
  onCancelTransaction: () => void;
  isTopLevelConfirming: boolean;
  isTopLevelCancelling: boolean;
  setTopLevelChainId: (chainId: ApiChainId) => void;
  setTransactionSubmitted: (submitted: boolean) => void;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [ignoreValidation, setIgnoreValidation] = useState(false);
  const [validationResult, setValidationResult] = useState<
    ApiWalletActionValidationType | 'ERROR' | undefined
  >(undefined);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPreflightError, setIsPreflightError] = useState(false);
  const [derivedChainId, setDerivedChainId] = useState<ApiChainId | undefined>(
    undefined,
  );

  const { refetch: refetchWalletBalancesHook } = useWalletBalances();

  const {
    evmAddress,
    evmMiniAppProvider,
    getWalletClient,
    miniAppEvmAddress,
    scanResultsMap,
  } = useEmbeddedWallet();
  const fallbackAddress = miniAppEvmAddress ?? evmAddress;

  // Address derivation
  const address = useMemo(() => {
    return resolveEvmPreviewRequestAddress(request, fallbackAddress);
  }, [fallbackAddress, request]);

  // Off-chain protocol label when `eth_signTypedData_v4` uses a sentinel
  // chainId (e.g., Hyperliquid 1337). Replaces the misleading EVM chain
  // badge in the preview UI for these signatures.
  const offChainSignatureLabel = useMemo((): string | undefined => {
    if (request.request.method !== 'eth_signTypedData_v4') {
      return undefined;
    }
    let parsed: ApiEthSignTypedDataV4Request['params'];
    try {
      parsed = JSON.parse(request.request.params[1]);
    } catch {
      return undefined;
    }
    const raw = parsed?.domain?.chainId;
    let numeric: number | undefined;
    if (typeof raw === 'number') {
      numeric = raw;
    } else if (typeof raw === 'string') {
      try {
        numeric = hexToNumber(assertHex(raw));
      } catch {
        return undefined;
      }
    }
    if (numeric === undefined) {
      return undefined;
    }
    return SIGN_ONLY_SENTINEL_LABELS.get(numeric);
  }, [request]);

  // Wallet Action
  const walletAction = useMemo((): ApiFarcasterWalletAction => {
    const currentChainIdStr = derivedChainId?.toString() ?? '';
    if (request.request.method === 'eth_sendTransaction') {
      const params = request.request.params[0];
      return {
        method: request.request.method,
        params: {
          to: params.to ?? '',
          data: params.data ?? '',
          value: params.value ?? '',
          chainId: currentChainIdStr,
          from: params.from ?? '',
        },
      };
    } else if (request.request.method === 'eth_signTypedData_v4') {
      // parseTypedDataParam throws on malformed JSON / unrecognized
      // shapes. This useMemo runs synchronously during render, so
      // letting it throw crashes the preview modal before the init
      // effect's getSignedTypedDataChain has a chance to surface the
      // parse error via handlePreflightError. Fall back to an empty
      // params object: the init effect will re-run the same parse and
      // flip isPreflightError, which renders ErrorDisplayScreen instead
      // of this placeholder action.
      let params: unknown = {};
      try {
        params = parseTypedDataParam(request.request.params[1]);
      } catch {
        // Intentional no-op; see comment above.
      }
      return {
        method: request.request.method,
        params: params as ApiEthSignTypedDataV4Request['params'],
        chainId: derivedChainId ?? 0,
      };
    } else if (request.request.method === 'personal_sign') {
      const [message, address] = request.request.params;
      return {
        method: 'eth_personalSign',
        params: {
          message,
          address,
        },
      };
    } else if (request.request.method === 'wallet_sendCalls') {
      return parseSendCalls(request.request, derivedChainId ?? 0, address);
    }

    return {
      method: 'eth_sendTransaction',
      params: {
        to: '',
        data: '',
        value: '',
        chainId: currentChainIdStr,
        from: address ?? '',
      },
    };
  }, [request, derivedChainId, address]);

  const handlePreflightError = useCallback((message: string) => {
    logInDevOnly('PreviewEthSendTransactionRouter preflight error', message);
    setErrorMessage(message);
    setValidationResult('ERROR');
    setIsPreflightError(true);
    setIsInitialized(true);
  }, []);

  // Central small helpers
  const toNumericChainIdOrReport = useCallback(
    (raw: unknown, parseErrorMessage: string): number | undefined => {
      // Bounds-check every bigint-shaped chainId before narrowing to Number.
      // Number(bigint) silently drops precision past MAX_SAFE_INTEGER which
      // can resolve to the *wrong* chain (e.g. adjacent IDs collapse onto
      // each other). Reject out-of-range values instead of guessing.
      const safeBigIntToNumber = (value: bigint): number => {
        if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error(
            `chainId ${value.toString()} is outside the safe integer range`,
          );
        }
        return Number(value);
      };

      try {
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          if (!Number.isSafeInteger(raw) || raw < 0) {
            throw new Error(
              `chainId ${raw} is not a safe non-negative integer`,
            );
          }
          return raw;
        }
        if (typeof raw === 'bigint') {
          return safeBigIntToNumber(raw);
        }
        if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (trimmed.length === 0) {
            throw new Error('empty chainId string');
          }
          if (trimmed.startsWith('0x') || trimmed.startsWith('0X')) {
            // Route hex through BigInt so oversized values throw here
            // rather than silently round via hexToNumber.
            return safeBigIntToNumber(BigInt(trimmed));
          }
          if (/^\d+$/.test(trimmed)) {
            return safeBigIntToNumber(BigInt(trimmed));
          }
          throw new Error(`unrecognized chainId string: ${trimmed}`);
        }
      } catch {
        // fall through
      }
      handlePreflightError(parseErrorMessage);
      return undefined;
    },
    [handlePreflightError],
  );

  const getSupportedChainOrError = useCallback(
    (numericChainId: number): Chain | undefined => {
      const chain = getChainByChainId(numericChainId);
      if (chain === null) {
        handlePreflightError(
          `Unknown or unsupported chain ID ${numericChainId}`,
        );
        return undefined;
      }
      return chain;
    },
    [handlePreflightError],
  );

  // Per-method helpers (they DO call handlePreflightError internally)
  const getSendTransactionChain = useCallback(
    (req: EvmPreviewRequest<'eth_sendTransaction'>): ChainResolve => {
      const raw = req.request.params?.[0]?.chainId;
      if (raw === null || raw === undefined) {
        return { kind: 'absent' };
      } // fallback to provider
      const numeric = toNumericChainIdOrReport(
        raw,
        'Unable to parse chainId from eth_sendTransaction params',
      );
      if (numeric === undefined) {
        return { kind: 'error' };
      }
      const chain = getSupportedChainOrError(numeric);
      if (!chain) {
        return { kind: 'error' };
      }
      return { kind: 'ok', chain };
    },
    [getSupportedChainOrError, toNumericChainIdOrReport],
  );

  const getSignedTypedDataChain = useCallback(
    (req: EvmPreviewRequest<'eth_signTypedData_v4'>): ChainResolve => {
      // params[1] may be a JSON string (common from some dapps/wallets) or
      // an already-parsed typed-data object (per EIP-1193 convention). Accept
      // both shapes so injected-provider dapps like Uniswap don't fail early.
      let params: ApiEthSignTypedDataV4Request['params'];
      try {
        params = parseTypedDataParam(
          req.request.params?.[1],
        ) as ApiEthSignTypedDataV4Request['params'];
      } catch {
        handlePreflightError(
          'Unable to parse chainId from eth_signTypedData_v4 params',
        );
        return { kind: 'error' };
      }
      if (!params?.domain?.chainId) {
        return { kind: 'absent' };
      } // fallback to provider
      const maybeNumeric =
        typeof params.domain.chainId === 'number'
          ? params.domain.chainId
          : toNumericChainIdOrReport(
              params.domain.chainId,
              'Unable to parse chainId from eth_signTypedData_v4 params',
            );
      if (maybeNumeric === undefined) {
        return { kind: 'error' };
      }
      if (SIGN_ONLY_SENTINEL_LABELS.has(maybeNumeric)) {
        return { kind: 'absent' };
      }
      const chain = getSupportedChainOrError(maybeNumeric);
      if (!chain) {
        return { kind: 'error' };
      }
      return { kind: 'ok', chain };
    },
    [getSupportedChainOrError, toNumericChainIdOrReport, handlePreflightError],
  );

  const getSendCallsChain = useCallback(
    (req: EvmPreviewRequest<'wallet_sendCalls'>): ChainResolve => {
      const raw = req.request.params?.[0]?.chainId;
      if (raw === null || raw === undefined) {
        return { kind: 'absent' };
      } // fallback to provider
      const numeric = toNumericChainIdOrReport(
        raw,
        'Unable to parse chainId from wallet_sendCalls params',
      );
      if (numeric === undefined) {
        return { kind: 'error' };
      }
      const chain = getSupportedChainOrError(numeric);
      if (!chain) {
        return { kind: 'error' };
      }
      return { kind: 'ok', chain };
    },
    [getSupportedChainOrError, toNumericChainIdOrReport],
  );

  const getPersonalSignChain = useCallback(
    (_req: EvmPreviewRequest<'personal_sign'>): ChainResolve => {
      // No chain in personal_sign; fallback to provider
      return { kind: 'absent' };
    },
    [],
  );

  // No lookup table to avoid unsafe any casts in invocation; use a typed switch instead

  // Initialize chainId
  useEffect(() => {
    if (isInitialized) {
      return;
    }

    const init = async () => {
      const method = request.request.method;

      // 1) Try to resolve from request-specific data via typed helpers
      let result: ChainResolve | undefined;
      switch (method) {
        case 'eth_sendTransaction':
          result = getSendTransactionChain(
            request as EvmPreviewRequest<'eth_sendTransaction'>,
          );
          break;
        case 'eth_signTypedData_v4':
          result = getSignedTypedDataChain(
            request as EvmPreviewRequest<'eth_signTypedData_v4'>,
          );
          break;
        case 'wallet_sendCalls':
          result = getSendCallsChain(
            request as EvmPreviewRequest<'wallet_sendCalls'>,
          );
          break;
        case 'personal_sign':
          result = getPersonalSignChain(
            request as EvmPreviewRequest<'personal_sign'>,
          );
          break;
        default:
          result = undefined;
      }
      if (result?.kind === 'error') {
        // error already reported by helper; stop without fallback
        return;
      }
      if (result?.kind === 'ok') {
        const ensured = result.chain.getEnsuredChainId();
        setDerivedChainId(ensured);
        setTopLevelChainId(ensured);
        setIsInitialized(true);
        return;
      }

      // 2) Fallback to provider eth_chainId
      const fetched = await evmMiniAppProvider
        .request({ method: 'eth_chainId' })
        .catch(() => undefined);

      if (fetched === undefined) {
        handlePreflightError(
          'Failed to determine chain ID. Network may be unavailable or an ad-blocker might be interfering.',
        );
        return;
      }

      const numeric = toNumericChainIdOrReport(
        fetched,
        'Failed to determine chain ID. Network may be unavailable or an ad-blocker might be interfering.',
      );
      if (numeric === undefined) {
        return;
      } // error already reported

      const supported = getSupportedChainOrError(numeric);
      if (!supported) {
        return;
      } // error already reported

      const ensuredFallback = supported.getEnsuredChainId();
      setDerivedChainId(ensuredFallback);
      setTopLevelChainId(ensuredFallback);
      setIsInitialized(true);
    };

    init();
  }, [
    isInitialized,
    request,
    getSendTransactionChain,
    getSignedTypedDataChain,
    getSendCallsChain,
    getPersonalSignChain,
    getSupportedChainOrError,
    toNumericChainIdOrReport,
    evmMiniAppProvider,
    handlePreflightError,
    setTopLevelChainId,
  ]);

  // EVM Scan Action
  const fid = useCurrentUserFid();
  const secondaryWalletsEnabled = useSecondaryWalletsEnabled();
  const { data: embeddedWalletsData } = useEmbeddedWalletsQuery({
    params: { includePrivate: true },
    scopeKey: fid,
    enabled: secondaryWalletsEnabled && !!fid,
  });
  const walletId = useMemo(() => {
    return embeddedWalletsData?.wallets.find(
      (wallet) =>
        wallet.protocol === 'ethereum' &&
        wallet.address.toLowerCase() === address?.toLowerCase(),
    )?.id;
  }, [address, embeddedWalletsData?.wallets]);

  const {
    data: evmScanData,
    isPending: isValidating,
    isError: validationFailed,
    refetch: refetchEvmScanAction,
  } = useEvmScanAction({
    account: address ?? '',
    chainId: derivedChainId ?? 0,
    action: walletAction,
    blockNumber: blockNumber,
    domain: connectionContext.domain,
    walletId,
    enabled: isInitialized && !!derivedChainId && !!address,
  });

  // Balance
  const {
    data: balanceData,
    isLoading: balanceIsLoading,
    refetch: refetchBalanceHook,
  } = useEvmBalance({
    address: address,
    chainId: derivedChainId ?? 0,
    scopeKey: JSON.stringify(request),
    query: {
      refetchInterval: 2000,
      enabled: isInitialized && !!derivedChainId && !!address,
    },
  });

  // Update validationResult and errorMessage based on evmScanData
  useEffect(() => {
    if (evmScanData?.error) {
      setErrorMessage(evmScanData.error.message);
      setValidationResult('ERROR');
    } else if (evmScanData?.validation?.type) {
      setValidationResult(evmScanData.validation.type);
      if (evmScanData.validation.description) {
        setErrorMessage(evmScanData.validation.description);
      }
    } else if (evmScanData && !evmScanData.error && !evmScanData.validation) {
      if (
        evmScanData &&
        Object.keys(evmScanData).length > 0 &&
        !validationResult
      ) {
        // If we have data but no specific validation type set, assume it's OK
        setValidationResult('BENIGN');
      }
    }
  }, [evmScanData, validationResult]);

  const requestFingerprint = React.useMemo(
    () => JSON.stringify(request.request),
    [request.request],
  );

  // Report scan results
  const scanResultsReported = useRef(false);
  useEffect(() => {
    if (evmScanData && !scanResultsReported.current && walletAction) {
      scanResultsMap.set(requestFingerprint, {
        scanResponse: evmScanData,
        action: walletAction,
      });
      scanResultsReported.current = true;
    }
  }, [evmScanData, walletAction, requestFingerprint, scanResultsMap]);

  // Gas Fee Estimate
  const { estimatedFee, estimatedFeeUsd } = useTotalEvmGasFeeEstimate({
    chainId: derivedChainId,
    estimatedGas: evmScanData?.gasEstimation?.estimate
      ? BigInt(evmScanData.gasEstimation.estimate)
      : undefined,
  });

  // Sufficient Funds Check
  const gasFeeValidation: GasFeeValidation = useMemo(() => {
    if (GASLESS_METHODS.has(request.request.method)) {
      return { canEstimate: true, hasEnough: true };
    }
    if (!estimatedFee || !balanceData) {
      return { canEstimate: false };
    }
    return { canEstimate: true, hasEnough: estimatedFee <= balanceData.value };
  }, [balanceData, estimatedFee, request.request.method]);

  // Swap Intent for Gasless
  const swapIntent = useMemo((): SwapForGasIntent | undefined => {
    if (walletAction.method !== 'eth_sendTransaction') {
      return undefined;
    }

    if (
      evmScanData?.error?.type === 'INSUFFICIENT_FUNDS' &&
      evmScanData.error.details?.assetMetadata?.assetType === 'NATIVE' &&
      evmScanData.error.details?.assetMetadata?.ca !== undefined &&
      evmScanData.error.details.assetMetadata.decimals !== undefined &&
      evmScanData.error.details.requiredBalance !== undefined
    ) {
      const sellAmountBaseUnits = parseUnits(
        evmScanData.error.details.requiredBalance.toString(),
        evmScanData.error.details.assetMetadata.decimals,
      );
      return {
        sellToken: evmScanData.error.details.assetMetadata.ca,
        sellAmountBaseUnits: sellAmountBaseUnits.toString(),
      };
    }
    if (
      evmScanData?.validation?.type === 'BENIGN' &&
      gasFeeValidation.canEstimate === true &&
      gasFeeValidation.hasEnough === false
    ) {
      const outgoing = evmScanData.stateChanges?.filter(
        (change) =>
          change.direction === 'OUT' &&
          change.assetMetadata.assetType === 'TOKEN' &&
          change.assetMetadata.ca !== undefined &&
          change.assetMetadata.decimals !== undefined &&
          change.value !== undefined,
      );
      if (outgoing?.length !== 1) {
        return undefined;
      }
      const { assetMetadata, value } = outgoing[0];
      const baseUnitsAmount = parseUnits(
        value.toString(),
        assetMetadata.decimals!,
      );
      return {
        sellToken: assetMetadata.ca!,
        sellAmountBaseUnits: baseUnitsAmount.toString(),
      };
    }
    return undefined;
  }, [evmScanData, gasFeeValidation, walletAction]);

  const needsGaslessSwap =
    (gasFeeValidation.canEstimate === true &&
      gasFeeValidation.hasEnough === false) ||
    (evmScanData?.error?.type === 'INSUFFICIENT_FUNDS' &&
      evmScanData.error.details?.assetMetadata?.assetType === 'NATIVE');

  const {
    executeQuote,
    status: gaslessSwapState,
    gaslessQuote,
    reset: resetExecuteSwapForGas,
  } = useExecuteSwapForGas({
    chainId: derivedChainId,
    swapIntent,
    getWalletClient,
    enabled:
      !!derivedChainId &&
      needsGaslessSwap &&
      GASLESS_CHAINS.includes(chainIdToChainOrThrow(derivedChainId.toString())),
    applicationUsage: 'frame_interaction',
  });

  // Effect for Gasless Swap Success
  const hasTriggeredConfirmAfterGasless = useRef(false);
  useEffect(() => {
    if (hasTriggeredConfirmAfterGasless.current) {
      return;
    }
    if (gaslessSwapState.state !== 'success') {
      return;
    }

    const isBenign = evmScanData?.validation?.type === 'BENIGN';
    if (isBenign) {
      hasTriggeredConfirmAfterGasless.current = true;
      onConfirmTransaction().then(() => setTransactionSubmitted(true));
    } else {
      refetchEvmScanAction();
      resetExecuteSwapForGas();
      refetchBalanceHook();
      if (address && derivedChainId) {
        refetchWalletBalancesHook();
      }
    }
  }, [
    gaslessSwapState.state,
    evmScanData?.validation?.type,
    onConfirmTransaction,
    refetchEvmScanAction,
    resetExecuteSwapForGas,
    refetchBalanceHook,
    refetchWalletBalancesHook,
    address,
    derivedChainId,
    setTransactionSubmitted,
  ]);

  const canProceedWithTransaction = useMemo(() => {
    if (
      request.request.method === 'personal_sign' ||
      request.request.method === 'eth_signTypedData_v4'
    ) {
      return true;
    }
    return (
      (gasFeeValidation.canEstimate === true &&
        gasFeeValidation.hasEnough === true) ||
      (gaslessSwapState.state === 'idle' && gaslessQuote !== null)
    );
  }, [
    gasFeeValidation,
    gaslessSwapState,
    gaslessQuote,
    request.request.method,
  ]);

  const handleConfirm = useCallback(async () => {
    const proceedWithGaslessExecution =
      needsGaslessSwap && gaslessQuote && gaslessSwapState.state === 'idle';

    if (proceedWithGaslessExecution) {
      executeQuote();
    } else {
      await onConfirmTransaction();
      setTransactionSubmitted(true);
    }
  }, [
    needsGaslessSwap,
    gaslessQuote,
    gaslessSwapState.state,
    executeQuote,
    onConfirmTransaction,
    setTransactionSubmitted,
  ]);

  // Loading states
  const isGaslessQuoteLoading =
    gaslessSwapState.state === 'loading' && gaslessSwapState.what === 'quote';
  const overallLoading =
    !isInitialized || isValidating || balanceIsLoading || isGaslessQuoteLoading;
  const isGaslessSwapExecuting =
    gaslessSwapState.state === 'loading' &&
    (gaslessSwapState.what === 'execute' ||
      gaslessSwapState.what === 'monitor');

  // Common props for screens
  const screenCommonProps = {
    onCancel: onCancelTransaction,
    isCancelling: isTopLevelCancelling,
    isConfirming: isTopLevelConfirming,
    connectionContext: connectionContext,
  };

  if (isPreflightError) {
    return (
      <ErrorDisplayScreen
        {...screenCommonProps}
        chain={
          derivedChainId ? getChainFromEvmChainId(derivedChainId) : undefined
        }
        type="UNKNOWN"
        message={errorMessage}
        details={undefined}
      />
    );
  }

  if (overallLoading && !isGaslessSwapExecuting) {
    return (
      <TransactionValidationLoadingScreen
        {...screenCommonProps}
        onConfirm={handleConfirm}
        disabled={
          isValidating ||
          isTopLevelConfirming ||
          gaslessSwapState.state === 'loading'
        }
      />
    );
  }

  if (isGaslessSwapExecuting) {
    return <GaslessSwapPendingScreen title={null} />;
  }

  const chain = getChainFromEvmChainId(derivedChainId!);

  if (validationFailed && !evmScanData) {
    return (
      <ErrorDisplayScreen
        {...screenCommonProps}
        chain={chain}
        type="UNKNOWN"
        message={
          errorMessage ||
          'This wallet action could not be validated and cannot continue.'
        }
        details={undefined}
      />
    );
  }

  // Routing Logic for eth_signTypedData_v4 and personal_sign
  if (
    request.request.method === 'personal_sign' ||
    request.request.method === 'eth_signTypedData_v4'
  ) {
    // Personal Sign - reuses the WalletSignMessageContent component
    if (
      validationResult === 'BENIGN' &&
      request.request.method === 'personal_sign'
    ) {
      return (
        <WalletSignMessageContent
          message={hexToString(request.request.params[0])}
          approve={onConfirmTransaction}
          cancel={onCancelTransaction}
          status="pending"
        />
      );
    }

    if (validationResult === 'BENIGN' || ignoreValidation) {
      return (
        <VerifiedTransactionScreen
          {...screenCommonProps}
          onConfirm={handleConfirm}
          disabled={isTopLevelConfirming || isTopLevelCancelling}
          chain={chain}
          request={request.request}
          data={evmScanData}
          offChainSignatureLabel={offChainSignatureLabel}
        />
      );
    }
    if (validationResult === 'WARNING' && !ignoreValidation) {
      return (
        <VerifiedTransactionScreen
          {...screenCommonProps}
          onConfirm={handleConfirm}
          disabled={isTopLevelConfirming || isTopLevelCancelling}
          chain={chain}
          request={request.request}
          data={evmScanData}
          offChainSignatureLabel={offChainSignatureLabel}
          innerView={
            <WarningScanSection2
              message={
                errorMessage ||
                evmScanData?.validation?.description ||
                VALIDATION_FAILURE_MESSAGE
              }
            />
          }
        />
      );
    }
    if (validationResult === 'MALICIOUS' && !ignoreValidation) {
      return (
        <ValidationAssertionScreen
          {...screenCommonProps}
          onContinue={() => setIgnoreValidation(true)}
          onCancel={onCancelTransaction}
          innerView={
            <MaliciousScanSection
              message={
                errorMessage ||
                evmScanData?.validation?.description ||
                MALICIOUS_TRANSACTION_MESSAGE
              }
            />
          }
        />
      );
    }
    if (validationResult === 'ERROR') {
      return (
        <ErrorDisplayScreen
          {...screenCommonProps}
          chain={chain}
          type={evmScanData?.error?.type ?? 'UNKNOWN'}
          message={errorMessage}
          details={evmScanData?.error?.details}
        />
      );
    }
    if (validationResult === 'UNSUPPORTED') {
      const innerView = evmScanData?.details?.features.isTestnet ? (
        <TestnetPreviewSection />
      ) : (
        <WarningScanSection2 message={UNSUPPORTED_NETWORK_MESSAGE} />
      );
      return (
        <VerifiedTransactionScreen
          {...screenCommonProps}
          onConfirm={handleConfirm}
          disabled={isTopLevelConfirming || isTopLevelCancelling}
          chain={chain}
          request={request.request}
          data={evmScanData}
          offChainSignatureLabel={offChainSignatureLabel}
          innerView={innerView}
        />
      );
    }

    return (
      <TransactionValidationLoadingScreen
        {...screenCommonProps}
        onConfirm={handleConfirm}
        disabled={true}
      />
    );
  }

  // Routing Logic for eth_sendTransaction
  if (canProceedWithTransaction === false && derivedChainId) {
    return (
      <ErrorDisplayScreen
        {...screenCommonProps}
        chain={chain}
        type="INSUFFICIENT_GAS"
        message="Not enough gas for this transaction."
        details={
          evmScanData?.error?.details ??
          (address
            ? {
                address,
                assetMetadata: {
                  assetType: 'NATIVE',
                  symbol: chain ? NATIVE_ASSET_SYMBOLS[chain] : undefined,
                  decimals: balanceData?.decimals,
                },
              }
            : undefined)
        }
      />
    );
  }

  if (validationResult === 'WARNING' && !ignoreValidation) {
    return (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={handleConfirm}
        disabled={isTopLevelConfirming || isTopLevelCancelling}
        chain={chain}
        request={request.request}
        data={evmScanData}
        estimatedFeeUsd={estimatedFeeUsd}
        gaslessQuote={
          gasFeeValidation.canEstimate === true &&
          gasFeeValidation.hasEnough === false
            ? gaslessQuote
            : undefined
        }
        innerView={
          <WarningScanSection2
            message={
              errorMessage ||
              evmScanData?.validation?.description ||
              VALIDATION_FAILURE_MESSAGE
            }
          />
        }
      />
    );
  }

  if (validationResult === 'MALICIOUS' && !ignoreValidation) {
    return (
      <ValidationAssertionScreen
        {...screenCommonProps}
        onContinue={() => setIgnoreValidation(true)}
        innerView={
          <MaliciousScanSection
            message={
              errorMessage ||
              evmScanData?.validation?.description ||
              MALICIOUS_TRANSACTION_MESSAGE
            }
          />
        }
      />
    );
  }

  if (validationResult === 'UNSUPPORTED' && derivedChainId) {
    const innerView = evmScanData?.details?.features.isTestnet ? (
      <TestnetPreviewSection />
    ) : (
      <WarningScanSection2 message={UNSUPPORTED_NETWORK_MESSAGE} />
    );
    return (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={handleConfirm}
        disabled={isTopLevelConfirming || isTopLevelCancelling}
        chain={chain}
        request={request.request}
        data={evmScanData}
        gaslessQuote={
          gasFeeValidation.canEstimate === true &&
          gasFeeValidation.hasEnough === false
            ? gaslessQuote
            : undefined
        }
        estimatedFeeUsd={estimatedFeeUsd}
        innerView={innerView}
      />
    );
  }

  // Special case for insufficient funds error - if we have a gasless quote, we can proceed with the transaction
  if (
    evmScanData?.error?.type === 'INSUFFICIENT_FUNDS' &&
    evmScanData.error.details?.assetMetadata?.assetType === 'NATIVE' &&
    evmScanData.error.details?.assetMetadata?.ca !== undefined &&
    evmScanData.error.details.assetMetadata.decimals !== undefined &&
    evmScanData.error.details.requiredBalance !== undefined &&
    canProceedWithTransaction &&
    gaslessQuote
  ) {
    return (
      <SwapBeforeSimulationScreen
        gaslessQuote={gaslessQuote}
        onConfirmTransaction={handleConfirm}
        onCancelTransaction={onCancelTransaction}
      />
    );
  }

  if (validationResult === 'BENIGN' || ignoreValidation) {
    return (
      <VerifiedTransactionScreen
        {...screenCommonProps}
        onConfirm={handleConfirm}
        disabled={isTopLevelConfirming || isTopLevelCancelling}
        chain={chain}
        request={request.request}
        data={evmScanData}
        gaslessQuote={
          gasFeeValidation.canEstimate === true &&
          gasFeeValidation.hasEnough === false
            ? gaslessQuote
            : undefined
        }
        estimatedFeeUsd={estimatedFeeUsd}
      />
    );
  }

  if (validationResult === 'ERROR' && derivedChainId) {
    return (
      <ErrorDisplayScreen
        {...screenCommonProps}
        chain={chain}
        type={evmScanData?.error?.type ?? 'UNKNOWN'}
        message={errorMessage}
        details={evmScanData?.error?.details}
      />
    );
  }

  // Default fallback
  return (
    <TransactionValidationLoadingScreen
      {...screenCommonProps}
      onConfirm={handleConfirm}
      disabled={true}
    />
  );
}
