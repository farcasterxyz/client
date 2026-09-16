import { Dialog } from '@headlessui/react';
import {
  ChevronRightIcon,
  InfoIcon,
  LinkExternalIcon,
  SyncIcon,
} from '@primer/octicons-react';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiEthSendTransactionRequest,
  ApiEthSignTypedDataV4Request,
  ApiMiniAppWalletActionRequest,
  ApiTransactionScanAction,
  getFirstApiErrorBody,
  prettyChainName,
} from 'farcaster-client-data';
import {
  frameUrlToDomain,
  getNotionLinkTarget,
  TransactionFailureReason,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  BaseError,
  formatEther,
  Hex,
  SendTransactionErrorType,
  SignTypedDataErrorType,
  UserRejectedRequestError,
} from 'viem';
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSignTypedData,
  useSwitchChain,
} from 'wagmi';

import { ChainImage } from '~/components/chain/ChainImage';
import { ChainName } from '~/components/chain/ChainName';
import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { truncateAddress } from '~/utils/stringUtils';

type MiniAppTransactionModalProps = {
  tx: ApiMiniAppWalletActionRequest;
  appUrl: string;
  onTransactionSuccess: (args: {
    transactionHash: string;
    address: string;
    correlationId: string | undefined;
    chainId?: string;
    method: string;
  }) => void;
  onTransactionFailure: (args: {
    correlationId: string | undefined;
    reason: TransactionFailureReason;
    message?: string;
    details?: string;
  }) => void;
  onTransactionCancel: () => void;
  onClose: () => void;
  onSwitchWallet: () => void;
};

export type TransactionDebugData = {
  targetUrl: string;
  start: number;
  result?: unknown;
  error?: string;
};

const FlagIcon: React.FC = () => {
  return (
    <svg
      width="18"
      height="19"
      viewBox="0 0 18 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Frame">
        <path
          id="Vector"
          d="M2.25 2.75V3.875M2.25 3.875L4.3275 3.35525C5.8908 2.96453 7.54231 3.14597 8.9835 3.86675L9.0645 3.90725C10.4766 4.61323 12.0915 4.80192 13.6283 4.4405L15.9608 3.8915C15.6772 6.50866 15.6785 9.14886 15.9645 11.7657L13.629 12.3148C12.0921 12.6766 10.4769 12.4882 9.0645 11.7823L8.9835 11.7418C7.54231 11.021 5.8908 10.8395 4.3275 11.2303L2.25 11.75M2.25 3.875V11.75M2.25 16.25V11.75"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[#8b99a4]"
        />
      </g>
    </svg>
  );
};

const MiniAppTransactionModal: React.FC<MiniAppTransactionModalProps> =
  React.memo(
    ({
      tx,
      appUrl,
      onTransactionSuccess,
      onTransactionFailure,
      onTransactionCancel,
      onClose,
      onSwitchWallet,
    }) => {
      return (
        <Dialog open onClose={onClose} className="relative z-50">
          <DialogBackdrop />
          <DialogPanelContainer>
            <Dialog.Panel>
              <div className="flex h-auto w-[368px] flex-col items-start justify-center rounded-lg border p-6 pb-4 bg-app border-default">
                <React.Suspense
                  fallback={
                    <span className="flex w-full flex-row items-center justify-center py-8">
                      <LoadingIndicator />
                    </span>
                  }
                >
                  <ErrorBoundary
                    fallbackRender={() => {
                      return (
                        <MiniAppTransactionModalErrorBoundary
                          appUrl={appUrl}
                          onClose={onClose}
                        />
                      );
                    }}
                  >
                    <MiniAppTransactionModalContent
                      tx={tx}
                      appUrl={appUrl}
                      onTransactionSuccess={onTransactionSuccess}
                      onTransactionFailure={onTransactionFailure}
                      onTransactionCancel={onTransactionCancel}
                      onClose={onClose}
                      onSwitchWallet={onSwitchWallet}
                    />
                  </ErrorBoundary>
                </React.Suspense>
              </div>
            </Dialog.Panel>
          </DialogPanelContainer>
        </Dialog>
      );
    },
  );

type MiniAppTransactionModalErrorBoundaryProps = {
  appUrl: string;
  onClose: () => void;
};

const MiniAppTransactionModalErrorBoundary: React.FC<
  MiniAppTransactionModalErrorBoundaryProps
> = ({ appUrl, onClose }) => {
  const navigateExternal = useExternalNavigate();

  const frameDomain = frameUrlToDomain(appUrl);
  const frameUrl = appUrl;

  const onExternalClick = React.useCallback(() => {
    navigateExternal({ to: frameUrl, openInNewTab: true });
  }, [navigateExternal, frameUrl]);

  return (
    <div className="scrollbar-vert flex size-full flex-col justify-between space-y-4 overflow-y-auto">
      <span className="flex flex-col items-center space-y-4">
        <span className="flex w-full flex-col items-center space-y-2 text-sm">
          <span className="text-faint">Failed to request transaction from</span>
          <span
            dir="rtl"
            className="break w-full grow-0 truncate rounded border p-2 text-center border-default text-default"
          >
            {frameDomain}
          </span>
        </span>
        <div className="flex w-full flex-col space-y-1">
          <DefaultButton
            title="Continue in wallet"
            className="flex h-10 !w-full flex-row items-center !justify-center space-x-1 !text-base !font-normal !bg-action-primary hover:!bg-[#7C65C1F0]"
            onClick={onExternalClick}
          >
            <span className="flex flex-row items-center">
              <span>View</span>
              <LinkExternalIcon size={12} className="ml-1 text-light" />
            </span>
          </DefaultButton>
          <DefaultButton
            title="Cancel"
            className="flex h-10 w-min flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
            onClick={onClose}
          >
            <span className="flex flex-row items-center">
              <span className="">Cancel</span>
            </span>
          </DefaultButton>
        </div>
      </span>
    </div>
  );
};

type MiniAppTransactionModalContentProps = {
  tx: ApiMiniAppWalletActionRequest;
  appUrl: string;
  onTransactionSuccess: (args: {
    transactionHash: string;
    address: string;
    correlationId: string | undefined;
    chainId?: string;
    method: string;
  }) => void;
  onTransactionFailure: (args: {
    correlationId: string | undefined;
    reason: TransactionFailureReason;
    message: string | undefined;
    details: string | undefined;
  }) => void;
  onTransactionCancel: () => void;
  onClose: () => void;
  onSwitchWallet: () => void;
};

const MiniAppTransactionModalContent: React.FC<
  MiniAppTransactionModalContentProps
> = ({
  appUrl,
  onTransactionSuccess,
  onTransactionFailure,
  onTransactionCancel,
  onClose,
  onSwitchWallet,
}) => {
  // Deprecated: usePostMiniAppTransaction removed
  const frameDomain = frameUrlToDomain(appUrl);

  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync: sendTransaction } = useSendTransaction();

  const { trackEvent } = useAnalytics();
  // Deprecated: report transaction removed

  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string>();
  const [trxData] = useState<{
    transactionScan?: {
      stateChanges?: Array<{ humanReadableDiff: string }>;
      warnings?: Array<{ message: string }>;
      errors?: Array<{ humanReadableError: string }>;
      action?: ApiTransactionScanAction;
      riskScore?: {
        score: number;
      };
      riskFactors?: Array<{ factor: string; description: string }>;
    };
    transaction: ApiEthSendTransactionRequest | ApiEthSignTypedDataV4Request;
    correlationId?: string;
  }>();
  const [transactionInProgress, setTransactionInProgress] =
    React.useState<boolean>(false);
  const [dismissedScanModal, setDismissedScanModal] =
    React.useState<boolean>(false);

  const load = React.useCallback(async () => {
    if (!address) {
      throw new Error('Missing address');
    }

    try {
      setLoading(true);
      throw new Error('Mini App transaction posting removed');
    } catch (e) {
      const apiError = getFirstApiErrorBody(e);
      if (apiError && apiError.reason === 'frame_application_error') {
        setLoadingError(apiError.message);
      } else {
        setLoadingError('Failed to load action from the frame server.');
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const onTrxCancel = React.useCallback(() => {
    // No-op
    onTransactionCancel();
    onClose();
  }, [onClose, onTransactionCancel]);

  const onTrxError = React.useCallback(
    (error: SendTransactionErrorType | SignTypedDataErrorType) => {
      // This should not occur but lets make the TS engine happy
      if (trxData === undefined) {
        return;
      }

      let reason: TransactionFailureReason = 'unknown';
      let message: string | undefined = undefined;
      let details: string | undefined = undefined;
      if (error instanceof BaseError) {
        const rejectError = error.walk(
          (err) => err instanceof UserRejectedRequestError,
        );
        if (rejectError) {
          reason = 'user_rejected';
        }

        if (
          error.details.startsWith('insufficient funds') &&
          trxData.transaction.method === 'eth_sendTransaction'
        ) {
          reason = 'insufficient_funds';
          const chainName = prettyChainName(trxData.transaction.params.chainId);
          const eth = formatEther(BigInt(trxData.transaction.params.value));
          message = `Transaction requires ${eth} ETH + gas on ${chainName}.`;
        }
      } else {
        details = (error as Error).message;
      }

      onTransactionFailure({
        correlationId: trxData.correlationId,
        reason,
        message,
        details,
      });

      onClose();
    },
    [onClose, trxData, onTransactionFailure],
  );

  const requestSendTransaction = React.useCallback(
    async (transaction: ApiEthSendTransactionRequest) => {
      trackEvent(AnalyticsEvent.ContinueInWalletFrameTx, {
        method: transaction.method,
      });

      if (!address) {
        throw new Error('Missing address in requestSendTransaction');
      }

      const txChainId = Number(transaction.params.chainId);
      const txData = transaction.params.data as Hex;
      const txTo = transaction.params.to as Hex;
      const txValue = BigInt(transaction.params.value);
      const txGas = transaction.params.gas
        ? BigInt(transaction.params.gas)
        : undefined;

      setTransactionInProgress(true);

      try {
        if (txChainId !== chainId) {
          // Some wallets will error if a transaction is requested and the wallet is
          // not switched to that chain.
          await switchChainAsync({ chainId: txChainId });
        }

        const hash = await sendTransaction({
          chainId: txChainId,
          data: txData,
          to: txTo,
          value: txValue,
          gas: txGas,
        });

        trackEvent(AnalyticsEvent.FrameTxSuccess, {
          method: transaction.method,
        });

        onTransactionSuccess({
          address,
          transactionHash: hash,
          correlationId: trxData?.correlationId,
          chainId: transaction.params.chainId,
          method: 'eth_sendTransaction',
        });
      } catch (e) {
        onTrxError(e as SendTransactionErrorType);
      } finally {
        setTransactionInProgress(false);
      }
    },
    [
      chainId,
      trxData,
      address,
      onTrxError,
      sendTransaction,
      switchChainAsync,
      trackEvent,
      onTransactionSuccess,
    ],
  );

  const requestSignTypedDataV4 = React.useCallback(
    async (request: ApiEthSignTypedDataV4Request) => {
      trackEvent(AnalyticsEvent.ContinueInWalletFrameTx, {
        method: request.method,
      });

      if (!address) {
        throw new Error('Missing address in requestSendTransaction');
      }

      setTransactionInProgress(true);

      try {
        if (request.chainId !== chainId) {
          // Some wallets will error if a transaction is requested and the wallet is
          // not switched to that chain.
          await switchChainAsync({ chainId: request.chainId });
        }

        const signature = await signTypedDataAsync({
          message: request.params.message as Record<string, unknown>,
          types: request.params.types as Record<string, unknown>,
          primaryType: request.params.primaryType,
          domain: ((domain) => {
            if (!domain) {
              return undefined;
            }

            return {
              ...domain,
              verifyingContract: domain.verifyingContract as Hex | undefined,
              salt: domain.salt as Hex | undefined,
            };
          })(request.params.domain),
        });

        trackEvent(AnalyticsEvent.FrameTxSuccess, {
          method: request.method,
        });

        onTransactionSuccess({
          method: 'eth_signTypedData_v4',
          transactionHash: signature,
          correlationId: trxData?.correlationId,
          address,
        });
      } catch (e) {
        onTrxError(e as SignTypedDataErrorType);
      } finally {
        setTransactionInProgress(false);
      }
    },
    [
      chainId,
      trxData,
      address,
      onTrxError,
      signTypedDataAsync,
      switchChainAsync,
      trackEvent,
      onTransactionSuccess,
    ],
  );

  const submitTransactionToWallet = React.useCallback(async () => {
    if (typeof trxData === 'undefined') {
      return;
    }

    trackEvent(AnalyticsEvent.ContinueInWalletFrameTx, {
      method: trxData.transaction.method,
    });

    setTransactionInProgress(true);

    try {
      if (trxData.transaction.method === 'eth_sendTransaction') {
        await requestSendTransaction(trxData.transaction);
      } else if (trxData.transaction.method === 'eth_signTypedData_v4') {
        await requestSignTypedDataV4(trxData.transaction);
      } else {
        // TODO
      }

      onClose();
    } catch (e) {
    } finally {
      setTransactionInProgress(false);
    }
  }, [
    requestSendTransaction,
    requestSignTypedDataV4,
    trackEvent,
    onClose,
    trxData,
  ]);

  const onProceedAnyway = React.useCallback(() => {
    setDismissedScanModal(true);
  }, []);

  const stateChanges = React.useMemo(() => {
    const stateChanges = trxData?.transactionScan?.stateChanges || [];
    return stateChanges.map((c) => c.humanReadableDiff);
  }, [trxData?.transactionScan?.stateChanges]);

  const warnings = React.useMemo(() => {
    const warnings = trxData?.transactionScan?.warnings || [];
    return warnings.map((w) => w.message);
  }, [trxData?.transactionScan?.warnings]);

  const errors = React.useMemo(() => {
    const errors = trxData?.transactionScan?.errors || [];
    return errors.map((e) => e.humanReadableError);
  }, [trxData?.transactionScan?.errors]);

  const onReportFrame = React.useCallback(() => {
    // No-op
  }, []);

  const chain: ApiChain = React.useMemo(() => {
    if (typeof trxData === 'undefined') {
      return 'ethereum';
    }

    const chainId: string | undefined = ((request) => {
      if (request.method === 'eth_sendTransaction') {
        return request.params.chainId;
      } else if (request.method === 'eth_signTypedData_v4') {
        return request.chainId.toString();
      }
    })(trxData.transaction);

    switch (chainId) {
      case '7777777':
        return 'zora';
      case '666666666':
        return 'degen';
      case '8453':
        return 'base';
      case '84532':
        return 'base-sepolia';
      case '42161':
        return 'arbitrum';
      case '130':
        return 'unichain';
      case '137':
        return 'polygon';
      case '100':
        return 'gnosis';
      case '10':
        return 'optimism';
      case '4663':
        return 'robinhood';
      case '1':
      default:
        return 'ethereum';
    }
  }, [trxData]);

  const simulationObject = useMemo(() => {
    if (trxData?.transaction.method === 'eth_signTypedData_v4') {
      return 'message';
    }

    return 'transaction';
  }, [trxData?.transaction]);

  const opened = useRef<boolean>(false);
  useEffect(() => {
    if (opened.current === false && trxData && !trxData.transactionScan) {
      opened.current = true;
      submitTransactionToWallet();
    }
  }, [submitTransactionToWallet, trxData]);

  if (loadingError) {
    return (
      <div className="w-full">
        <div className="flex size-full flex-col justify-between">
          <div>
            <Dialog.Title className="text-xl font-semibold text-default">
              Unable to load
            </Dialog.Title>
            <div className="mb-5 mt-1.5 text-lg text-muted">{loadingError}</div>
          </div>
          <DefaultButton
            onClick={() => {
              //dismissAppError();
              onClose();
            }}
            size="lg"
            className="mb-4"
          >
            Dismiss
          </DefaultButton>
        </div>
      </div>
    );
  }

  if (loading || !trxData?.transactionScan) {
    return (
      <div className="h-[405px] w-full">
        <div className="flex size-full flex-row items-center justify-center">
          <LoadingIndicator />
        </div>
      </div>
    );
  }

  if (errors.length !== 0) {
    return (
      <FrameTransactionScanErrorModalContent
        appUrl={appUrl}
        onCancel={onTrxCancel}
        errors={errors}
        address={address!}
        chain={chain}
        onSwitchWallet={onSwitchWallet}
        onTryAgain={load}
        onReportFrame={onReportFrame}
        simulationObject={simulationObject}
      />
    );
  }

  if (
    !dismissedScanModal &&
    trxData.transactionScan &&
    trxData.transactionScan.action !== 'NONE'
  ) {
    return (
      <FrameTransactionScanModalContent
        appUrl={appUrl}
        chain={chain}
        onCancel={onTrxCancel}
        onProceed={onProceedAnyway}
        severity={trxData.transactionScan.action || 'WARN'}
        warnings={warnings}
        address={address!}
        onSwitchWallet={onSwitchWallet}
        onReportFrame={onReportFrame}
        simulationObject={simulationObject}
      />
    );
  }

  return (
    <div className="flex size-full flex-col justify-between space-y-4">
      <span className="flex w-full flex-col items-start space-y-1 text-sm">
        <Dialog.Title className="text-xl font-semibold text-default">
          Preview
        </Dialog.Title>
        <span className="text-base text-default">
          Our simulation shows this {simulationObject}:
        </span>
      </span>
      <div className="scroll-vert flex w-full flex-col overflow-y-auto rounded bg-overlay-light">
        {stateChanges.map((stateChange: string, index: number) => (
          <div
            key={index}
            className={classNames(
              index !== 0 && 'border-t border-default',
              'px-4 py-3 text-sm',
            )}
          >
            {stateChange}
          </div>
        ))}
        {stateChanges.length === 0 && (
          <span className="px-4 py-3 text-sm italic text-faint">
            Failed to determine state changes. Please proceed with caution.
          </span>
        )}
        <span
          className="flex cursor-pointer flex-row items-center justify-center space-x-1 border-t px-4 py-3 text-sm border-default text-faint"
          onClick={onReportFrame}
        >
          <FlagIcon />
          <span>Report</span>
        </span>
      </div>
      <div className="flex flex-col text-sm">
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Domain</div>
          <div
            dir="rtl"
            title={frameDomain}
            className="break ml-2 w-full max-w-[65%] grow-0 truncate text-default"
          >
            {frameDomain}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Chain</div>
          <span className="flex flex-row items-center">
            <div className="mr-1">
              <ChainImage chain={chain} />
            </div>
            <ChainName chain={chain} />
          </span>
        </div>
        <div className=" flex flex-row items-center justify-between py-2">
          <div className="text-faint">Account</div>
          <div className="flex flex-row items-center">
            {truncateAddress({ startSubstring: 6, hexAddress: address! })}
            <div
              onClick={onSwitchWallet}
              className="ml-1 flex cursor-pointer flex-row items-center text-sm text-faint"
            >
              <span>Change</span>
              <ChevronRightIcon size={8} className="ml-0.5 text-faint" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-1">
        <DefaultButton
          title="Continue in wallet"
          className={classNames(
            'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',
            '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
          )}
          onClick={submitTransactionToWallet}
          disabled={typeof trxData === 'undefined' || transactionInProgress}
        >
          <span className="flex flex-row items-center">
            <span className="flex flex-row items-center text-light">
              {transactionInProgress ? 'Check wallet' : 'Continue in wallet'}
            </span>
          </span>
        </DefaultButton>
        <DefaultButton
          title="Cancel"
          className="flex h-10 w-min flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
          onClick={onTrxCancel}
          disabled={transactionInProgress}
        >
          <span className="flex flex-row items-center">
            <span className="">Cancel</span>
          </span>
        </DefaultButton>
      </div>
    </div>
  );
};

MiniAppTransactionModal.displayName = 'TransactionModal';

type FrameTransactionInProgressModalContentProps = {
  onTryAgain: () => void;
};

const FrameTransactionInProgressModalContent: React.FC<
  FrameTransactionInProgressModalContentProps
> = ({ onTryAgain }) => {
  return (
    <div className="flex h-min w-full flex-col justify-between space-y-4">
      <div className="flex size-full flex-col items-center justify-center space-y-4 p-4">
        <div className="flex flex-col items-center justify-center rounded-full bg-[#8A63D21A] p-4">
          <LoadingIndicator containerClassName="!text-[#8A63D2] !border-[4px]" />
        </div>
        <span className="text-xl font-semibold">Check wallet</span>
        <span className="text-center text-sm text-faint">
          We have sent a request to your connected wallet.
        </span>
      </div>
      <div className="mt-4 flex flex-col space-y-1">
        <DefaultButton
          title="Cancel"
          className="flex h-10 flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-faint"
          onClick={onTryAgain}
        >
          <span className="flex flex-row items-center">
            <SyncIcon size={12} />
            <span className="ml-1">Try again</span>
          </span>
        </DefaultButton>
      </div>
    </div>
  );
};

FrameTransactionInProgressModalContent.displayName =
  'FrameTransactionInProgressModalContent';

type FrameTransactionScanModalContentProps = {
  appUrl: string;
  chain: ApiChain;
  severity: ApiTransactionScanAction;
  warnings: string[];
  address: string;
  simulationObject: string;
  onSwitchWallet: () => void;
  onProceed: () => void;
  onCancel: () => void;
  onReportFrame: () => void;
};

const FrameTransactionScanModalContent: React.FC<
  FrameTransactionScanModalContentProps
> = ({
  appUrl,
  severity,
  warnings,
  chain,
  onProceed,
  onCancel,
  address,
  simulationObject,
  onSwitchWallet,
  onReportFrame,
}) => {
  const navigate = useExternalNavigate();
  const frameDomain = frameUrlToDomain(appUrl);

  return (
    <div className="flex size-full flex-col justify-between space-y-4">
      <span className="flex w-full flex-col items-start space-y-1 text-sm">
        <div className="flex w-full flex-row items-center justify-between">
          <Dialog.Title className="text-xl font-semibold text-default">
            {severity === 'BLOCK' ? 'Do not proceed' : 'Review warnings'}
          </Dialog.Title>
          <DefaultButton
            title="Learn More"
            className="flex h-10 flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-default "
            onClick={(e) => {
              e.stopPropagation();

              navigate({
                to: getNotionLinkTarget({ to: 'trx-simulations' }),
                openInNewTab: true,
              });
            }}
          >
            <span className="mr-0.5 flex flex-row items-center">
              <InfoIcon size={16} className="text-faint" />
            </span>
          </DefaultButton>
        </div>
        <span className="text-base text-default">
          Our simulation shows that this {simulationObject}:
        </span>
      </span>
      <div className="scroll-vert flex w-full flex-col overflow-y-auto rounded bg-overlay-light">
        {warnings.map((warning, index) => (
          <div
            key={index}
            className={classNames(
              index !== 0 && 'border-t border-default',
              'px-4 py-3 text-sm',
            )}
          >
            {warning}
          </div>
        ))}
        {warnings.length === 0 && (
          <span className="px-4 py-3 text-sm italic text-faint">
            Scan results not available. Please proceed with caution.
          </span>
        )}
        <span
          className="flex cursor-pointer flex-row items-center justify-center space-x-1 border-t px-4 py-3 text-sm border-default text-faint"
          onClick={onReportFrame}
        >
          <FlagIcon />
          <span>Report</span>
        </span>
      </div>
      <div className="flex flex-col text-sm">
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Domain</div>
          <div
            dir="rtl"
            title={frameDomain}
            className="break ml-2 w-full max-w-[65%] grow-0 truncate text-default"
          >
            {frameDomain}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Chain</div>
          <span className="flex flex-row items-center">
            <div className="mr-1">
              <ChainImage chain={chain} />
            </div>
            <ChainName chain={chain} />
          </span>
        </div>
        <div className=" flex flex-row items-center justify-between py-2">
          <div className="text-faint">Account</div>
          <div className="flex flex-row items-center">
            {truncateAddress({ startSubstring: 6, hexAddress: address })}
            <div
              onClick={onSwitchWallet}
              className="ml-1 flex cursor-pointer flex-row items-center text-sm text-faint"
            >
              <span>Change</span>
              <ChevronRightIcon size={8} className="ml-0.5 text-faint" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-1">
        <DefaultButton
          title="Continue in wallet"
          className={classNames(
            'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',
            severity === 'WARN' && '!bg-[#D6A243] hover:!bg-[#D6A243F0]',
            severity === 'BLOCK' && '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
          )}
          onClick={severity === 'WARN' ? onProceed : onCancel}
        >
          <span className="flex flex-row items-center">
            <span className="text-light">
              {severity === 'WARN' ? 'Continue' : `Cancel`}
            </span>
          </span>
        </DefaultButton>
        <DefaultButton
          title="Cancel"
          className="flex h-10 w-max flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
          onClick={severity === 'WARN' ? onCancel : onProceed}
        >
          <span className="flex flex-row items-center">
            <span className="">
              {severity === 'WARN' ? 'Cancel' : 'Continue anyway'}
            </span>
          </span>
        </DefaultButton>
      </div>
    </div>
  );
};

FrameTransactionScanModalContent.displayName =
  'FrameTransactionScanModalContent';

type FrameTransactionScanErrorModalContentProps = {
  appUrl: string;
  address: string;
  errors: string[];
  chain: ApiChain;
  simulationObject: string;
  onCancel: () => void;
  onSwitchWallet: () => void;
  onTryAgain: () => void;
  onReportFrame: () => void;
};

const FrameTransactionScanErrorModalContent: React.FC<
  FrameTransactionScanErrorModalContentProps
> = ({
  appUrl,
  errors,
  chain,
  simulationObject,
  address,
  onCancel,
  onSwitchWallet,
  onTryAgain,
  onReportFrame,
}) => {
  const navigate = useExternalNavigate();
  const frameDomain = frameUrlToDomain(appUrl);

  return (
    <div className="flex size-full flex-col justify-between space-y-4">
      <span className="flex w-full flex-col items-start space-y-1 text-sm">
        <div className="flex w-full flex-row items-center justify-between">
          <Dialog.Title className="text-xl font-semibold text-default">
            Error
          </Dialog.Title>
          <DefaultButton
            title="Learn More"
            className="flex h-10 flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-default "
            onClick={(e) => {
              e.stopPropagation();

              navigate({
                to: getNotionLinkTarget({ to: 'trx-simulations' }),
                openInNewTab: true,
              });
            }}
          >
            <span className="mr-0.5 flex flex-row items-center">
              <InfoIcon size={16} className="text-faint" />
            </span>
          </DefaultButton>
        </div>
        <span className="text-base text-default">
          Our simulation shows that this {simulationObject}:
        </span>
      </span>
      <div className="scroll-vert flex w-full flex-col overflow-y-auto rounded bg-overlay-light">
        {errors.map((error, index) => (
          <div
            key={index}
            className={classNames(
              index !== 0 && 'border-t border-default',
              'px-4 py-3 text-sm',
            )}
          >
            {error.indexOf('(Insufficient funds)') !== -1
              ? 'You do not have enough funds.'
              : error}
          </div>
        ))}
        <span
          className="flex cursor-pointer flex-row items-center justify-center space-x-1 border-t px-4 py-3 text-sm border-default text-faint"
          onClick={onReportFrame}
        >
          <FlagIcon />
          <span>Report</span>
        </span>
      </div>
      <div className="flex flex-col text-sm">
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Domain</div>
          <div
            dir="rtl"
            title={frameDomain}
            className="break ml-2 w-full max-w-[65%] grow-0 truncate text-default"
          >
            {frameDomain}
          </div>
        </div>
        <div className="flex flex-row items-center justify-between border-b py-2 border-default">
          <div className="text-faint">Chain</div>
          <span className="flex flex-row items-center">
            <div className="mr-1">
              <ChainImage chain={chain} />
            </div>
            <ChainName chain={chain} />
          </span>
        </div>
        <div className=" flex flex-row items-center justify-between py-2">
          <div className="text-faint">Account</div>
          <div className="flex flex-row items-center">
            {truncateAddress({ startSubstring: 6, hexAddress: address })}
            <div
              onClick={onSwitchWallet}
              className="ml-1 flex cursor-pointer flex-row items-center text-sm text-faint"
            >
              <span>Change</span>
              <ChevronRightIcon size={8} className="ml-0.5 text-faint" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col space-y-1">
        <DefaultButton
          title="Cancel"
          className={classNames(
            'flex flex-row items-center !justify-center space-x-1 px-[10px] py-[12px] !text-base !font-normal',
            '!bg-[#7C65C1] hover:!bg-[#7C65C1F0]',
          )}
          onClick={onCancel}
        >
          <span className="flex flex-row items-center">
            <span className="text-light">Cancel</span>
          </span>
        </DefaultButton>
        <DefaultButton
          title="Try again"
          className="flex h-10 flex-row items-center !justify-center space-x-1 self-center !bg-transparent !p-0 !text-base !font-normal !text-muted"
          onClick={onTryAgain}
        >
          <span className="flex flex-row items-center">
            <SyncIcon size={12} />
            <span className="ml-1">Try again</span>
          </span>
        </DefaultButton>
      </div>
    </div>
  );
};

FrameTransactionScanErrorModalContent.displayName =
  'FrameTransactionScanErrorModalContent';

export { MiniAppTransactionModal };
