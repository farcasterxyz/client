import { Octicons } from '@expo/vector-icons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiChain,
  ApiEthSendTransactionRequest,
  ApiEthSignTypedDataV4Request,
  chainIdToChainOrThrow,
  getTransactionExplorerUrl,
} from 'farcaster-client-data';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { FrameTransacationFlagIcon } from '~/components/images/FrameTransactionFlagIcon';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { PromptScrollView } from '~/components/prompts/PromptScrollView';
import { Text } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useConnectedWallet } from '~/contexts/ConnectWalletProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

import { TransactionContext } from './shared';
import { TransactionScanErrors } from './TransactionScanErrors';
import { TransactionScanWarning } from './TransactionScanWarning';

export function FrameTransactionBottomSheet({
  resolvedTransaction,
  frameUrl,
  chain,
  address,
  resimulate,
  onTransaction,
  onCancel,
  onClose,
  skipSentConfirmation,
}: {
  frameUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvedTransaction: any;
  chain: ApiChain;
  address: string;
  onTransaction: (args: {
    transactionHash: string;
    address: string;
    correlationId: string | undefined;
  }) => void;
  resimulate: () => void;
  onCancel: () => void;
  onClose: () => void;
  skipSentConfirmation?: boolean;
}) {
  const [walletError, setWalletError] = useState<string>();
  const [trxHash, setTrxHash] = useState<string>();
  const [ackWarning, setAckWarning] = useState(false);

  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { bottom } = useSafeAreaInsets();
  const { wallet } = useConnectedWallet();

  const { transaction, transactionScan, correlationId } = resolvedTransaction;
  const stateChanges = (transactionScan?.stateChanges ?? []).map(
    ({ humanReadableDiff }: { humanReadableDiff: string }) => humanReadableDiff,
  );

  const sendTransaction = useCallback(
    async (transaction: ApiEthSendTransactionRequest) => {
      if (!wallet.sendTransaction) {
        throw new Error('sendTransaction not supported');
      }

      trackEvent(AnalyticsEvent.ContinueInWalletFrameTx, {
        method: transaction.method,
      });

      const result = await wallet.sendTransaction({
        toAddress: transaction.params.to,
        data: transaction.params.data,
        weiValue: transaction.params.value,
        chainId: transaction.params.chainId,
        gasLimit: transaction.params.gas,
        actionSource: {
          url: frameUrl,
        },
      });

      if (result === 'wallet-not-installed') {
        // we'll have already checked this, appease compiler and ignore
        return;
      }

      if (result.success) {
        trackEvent(AnalyticsEvent.FrameTxSuccess, {
          method: transaction.method,
        });
        onTransaction({
          transactionHash: result.transactionHash,
          address,
          correlationId,
        });

        if (skipSentConfirmation) {
          // the bottom sheet sometimes fails to close when switching back to
          // Farcaster from the MWP connected wallet, wait for a bit to ensure
          // the bottom sheet closes
          setTimeout(() => {
            onClose();
          }, 150);
        } else {
          setTrxHash(result.transactionHash);
        }
        return;
      }

      if (result.errorReason === 'user_rejected') {
        // No-op (reporting removed)
        setWalletError('user_rejected');
        trackEvent(AnalyticsEvent.FrameTxError, undefined);
        return;
      }

      setWalletError('unknown');
      trackEvent(AnalyticsEvent.FrameTxError, undefined);
    },
    [
      trackEvent,
      wallet,
      frameUrl,
      onTransaction,
      address,
      correlationId,
      skipSentConfirmation,
      onClose,
    ],
  );

  const signTypedData = useCallback(
    async (request: ApiEthSignTypedDataV4Request) => {
      if (!wallet.signTypedDataV4) {
        throw new Error('signTypedDataV4 not supported');
      }

      trackEvent(AnalyticsEvent.ContinueInWalletFrameTx, {
        method: request.method,
      });

      const result = await wallet.signTypedDataV4(request.chainId, {
        message: request.params.message as Record<string, unknown>,
        types: request.params.types as Record<string, unknown>,
        domain: request.params.domain,
        primaryType: request.params.primaryType,
      });

      if (result === 'wallet-not-installed') {
        // we'll have already checked this, appease compiler and ignore
        return;
      }

      if (result.success) {
        trackEvent(AnalyticsEvent.FrameTxSuccess, {
          method: request.method,
        });
        onTransaction({
          transactionHash: result.signature,
          address,
          correlationId,
        });
        onClose();
        return;
      }

      if (result.errorReason === 'user_rejected') {
        // No-op (reporting removed)
        setWalletError('user_rejected');
        trackEvent(AnalyticsEvent.FrameTxError, undefined);
        return;
      }

      setWalletError('unknown');
      trackEvent(AnalyticsEvent.FrameTxError, undefined);
    },
    [trackEvent, wallet, onTransaction, address, correlationId, onClose],
  );

  const opened = useRef<boolean>(undefined);
  useEffect(() => {
    if (!transactionScan && !opened.current) {
      opened.current = true;
      if (transaction.method === 'eth_sendTransaction') {
        sendTransaction(transaction);
      } else if (transaction.method === 'eth_signTypedData_v4') {
        signTypedData(transaction);
      }
    }
  }, [sendTransaction, signTypedData, transaction, transactionScan]);

  const onPressCancel = useCallback(() => {
    trackEvent(AnalyticsEvent.ClickTxnCancel, {});
    onCancel();
  }, [onCancel, trackEvent]);

  const chainId = useMemo(() => {
    if (resolvedTransaction.transaction.method === 'eth_sendTransaction') {
      return resolvedTransaction.transaction.params.chainId;
    } else if (
      resolvedTransaction.transaction.method === 'eth_signTypedData_v4'
    ) {
      return resolvedTransaction.transaction.chainId.toString();
    }
    return '1';
  }, [resolvedTransaction]);

  const actionObject = useMemo(() => {
    if (resolvedTransaction.transaction.method === 'eth_signTypedData_v4') {
      return 'message';
    }

    return 'transaction';
  }, [resolvedTransaction]);

  useEffect(() => {
    setAckWarning(false);
  }, [resolvedTransaction]);

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewTxnPreview, {});
  }, [trackEvent]);

  if (walletError) {
    return (
      <WalletErrorBottomSheet
        rejected={walletError === 'user_rejected'}
        onContinue={() => {
          onCancel();
        }}
      />
    );
  }

  if (trxHash) {
    return (
      <TransactionSuccessBottomSheet
        transactionHash={trxHash}
        chainId={chainId}
        onContinue={() => {
          onClose();
        }}
      />
    );
  }

  if (!transactionScan) {
    return (
      <BottomSheetView>
        <View
          style={[
            t.flex,
            t.justifyCenter,
            t.itemsCenter,
            { minHeight: 100, paddingBottom: bottom },
            t.pX4,
            t.pY8,
          ]}
        >
          <LoadingIndicator />
          <Text style={[t.texts.primary, t.texts.secondary, t.textLg, t.mT3]}>
            Opening in wallet
          </Text>
        </View>
      </BottomSheetView>
    );
  }

  if (transactionScan.action !== 'NONE' && !ackWarning) {
    const blowfishScanWarnings = transactionScan.warnings.map(
      ({ message }: { message: string }) => message,
    );
    return (
      <TransactionScanWarning
        severity={transactionScan.action}
        address={address}
        chain={chain}
        frameUrl={frameUrl}
        warnings={blowfishScanWarnings}
        onCancel={onCancel}
        onReportMalicious={() => {
          // No-op (reporting removed)
        }}
        onContinue={() => {
          setAckWarning(true);
        }}
      />
    );
  }

  if (transactionScan.errors.length > 0) {
    const mappedErrors = transactionScan.errors.map(
      ({ humanReadableError }: { humanReadableError: string }) =>
        humanReadableError,
    );

    return (
      <TransactionScanErrors
        address={address}
        errors={mappedErrors}
        frameUrl={frameUrl}
        chain={chainIdToChainOrThrow(chainId)}
        onContinue={onCancel}
        onTryAgain={resimulate}
      />
    );
  }

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsStart,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 250 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsStart, t.wFull]}>
          <View
            style={[
              t.wFull,
              t.mB5,
              t.itemsCenter,
              t.flex,
              t.flexRow,
              t.justifyBetween,
            ]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
              ]}
            >
              Preview
            </Text>
            <TouchableOpacity
              style={[
                t.roundedLg,
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.itemsCenter,
                t.pX2,
                t.roundedLg,
              ]}
              activeOpacity={0.5}
              onPress={async () => {
                Linking.openURL(getNotionLinkTarget({ to: 'trx-simulations' }));
              }}
            >
              <Octicons name="info" size={16} style={[t.texts.tertiary]} />
            </TouchableOpacity>
          </View>
          <View style={[t.flex, t.flexCol, t.wFull, t.mB5]}>
            <Text style={[t.texts.primary, t.textBase, t.mB3]}>
              Our simulation shows that this {actionObject}:
            </Text>
            {stateChanges.length !== 0 ? (
              <PromptScrollView
                style={[
                  t.flex,
                  t.flexCol,
                  t.bgFrameActionsUnderneath,
                  t.rounded,
                  t.flexGrow,
                  t.wFull,
                  { maxHeight: 240 },
                ]}
              >
                {stateChanges.map((stateChange: string, index: number) => (
                  <View
                    key={index}
                    style={[
                      t.flex1,
                      t.pY3,
                      t.pX4,
                      index !== 0 && [t.borderDefault, t.borderTHairline],
                    ]}
                  >
                    <Text style={[t.textBase, t.texts.primary]}>
                      {stateChange}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  key={'report'}
                  style={[
                    t.flex1,
                    t.pY3,
                    t.pX4,
                    [t.borderDefault, t.borderTHairline],
                    t.wFull,
                    t.itemsCenter,
                    t.flex,
                    t.flexRow,
                    t.justifyCenter,
                  ]}
                  onPress={() => {
                    // No-op (reporting removed)
                  }}
                  activeOpacity={0.75}
                >
                  <FrameTransacationFlagIcon />
                  <Text style={[t.textBase, t.texts.tertiary, t.mL1]}>
                    Report
                  </Text>
                </TouchableOpacity>
              </PromptScrollView>
            ) : (
              <View
                style={[
                  t.flex,
                  t.flexCol,
                  t.bgFrameActionsUnderneath,
                  t.mY5,
                  t.rounded,
                ]}
              >
                <Text
                  style={[t.textBase, t.texts.primary, t.pY3, t.pX4, t.italic]}
                >
                  Failed to determine state changes. Please proceed with
                  caution.
                </Text>
              </View>
            )}
          </View>
          <View style={[t.mB5]}>
            <TransactionContext
              frameUrl={frameUrl}
              chain={chain}
              address={address}
            />
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
              t.fontSemibold,
            ]}
            activeOpacity={0.75}
            onPress={async () => {
              if (transaction.method === 'eth_sendTransaction') {
                sendTransaction(transaction);
              } else if (transaction.method === 'eth_signTypedData_v4') {
                signTypedData(transaction);
              }
            }}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Confirm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              t.mT1,
              t.bgTransparent,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
            ]}
            activeOpacity={0.75}
            onPress={onPressCancel}
          >
            <Text style={[t.texts.tertiary, t.textBase]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}

const TransactionSuccessIcon: React.FC = () => {
  return (
    <Svg width="32" height="32" viewBox="0 0 42 42" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0002 41.8002C26.5167 41.8002 31.8073 39.6088 35.708 35.708C39.6088 31.8073 41.8002 26.5167 41.8002 21.0002C41.8002 15.4837 39.6088 10.1931 35.708 6.29237C31.8073 2.39162 26.5167 0.200195 21.0002 0.200195C15.4837 0.200195 10.1931 2.39162 6.29237 6.29237C2.39162 10.1931 0.200195 15.4837 0.200195 21.0002C0.200195 26.5167 2.39162 31.8073 6.29237 35.708C10.1931 39.6088 15.4837 41.8002 21.0002 41.8002ZM31.0284 16.2968C31.179 16.0895 31.2872 15.8547 31.347 15.6056C31.4068 15.3565 31.417 15.098 31.3769 14.845C31.3368 14.592 31.2473 14.3493 31.1135 14.1309C30.9796 13.9125 30.804 13.7226 30.5968 13.572C30.3895 13.4214 30.1547 13.3131 29.9056 13.2533C29.6565 13.1935 29.398 13.1834 29.145 13.2235C28.892 13.2635 28.6493 13.3531 28.4309 13.4869C28.2125 13.6208 28.0226 13.7963 27.872 14.0036L18.8162 26.4576L13.9282 21.5696C13.7482 21.3834 13.533 21.235 13.295 21.1329C13.0571 21.0308 12.8012 20.9771 12.5422 20.975C12.2833 20.9729 12.0266 21.0224 11.787 21.1205C11.5474 21.2187 11.3297 21.3636 11.1467 21.5467C10.9637 21.7299 10.819 21.9477 10.7211 22.1874C10.6232 22.4271 10.5739 22.6839 10.5763 22.9428C10.5787 23.2017 10.6326 23.4576 10.7349 23.6954C10.8372 23.9333 10.9859 24.1484 11.1722 24.3282L17.6722 30.8282C17.8714 31.0275 18.1115 31.1813 18.3759 31.279C18.6403 31.3766 18.9227 31.4158 19.2036 31.3938C19.4846 31.3718 19.7575 31.2892 20.0034 31.1516C20.2494 31.014 20.4626 30.8247 20.6284 30.5968L31.0284 16.2968Z"
        fill="#8A63D2"
      />
    </Svg>
  );
};

function TransactionSuccessBottomSheet({
  transactionHash,
  chainId,
  onContinue,
}: {
  transactionHash: string;
  chainId: string;
  onContinue: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewTxnSent, {});
  }, [trackEvent]);

  const onPressContinue = useCallback(async () => {
    trackEvent(AnalyticsEvent.ClickTxnContinueComplete, {});
    onContinue();
  }, [onContinue, trackEvent]);

  const exploreUrl = getTransactionExplorerUrl({
    type: 'tx',
    hash: transactionHash,
    chainId,
  });

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsCenter, t.wFull]}>
          <View
            style={[
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.roundedFull,
              t.w18,
              t.h18,
              t.bgFrameActionsUnderneath,
            ]}
          >
            <TransactionSuccessIcon />
          </View>
          <View
            style={[
              t.wFull,
              t.mT5,
              t.mB3,
              t.itemsCenter,
              t.justifyCenter,
              t.flex,
              t.flexRow,
            ]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
                t.textCenter,
              ]}
            >
              Transaction Sent
            </Text>
          </View>
          <View
            style={[
              t.flex,
              t.flexRow,
              t.flexWrap,
              t.wFull,
              t.mB5,
              { maxWidth: '80%' },
              t.justifyCenter,
            ]}
          >
            <Text style={[t.texts.tertiary, t.textBase, t.textCenter]}>
              Your transaction will confirm shortly.
            </Text>
            {exploreUrl && (
              <TextWithPress
                style={[
                  t.texts.tertiary,
                  t.textCenter,
                  t.underline,
                  t.textBase,
                  t.mL2,
                ]}
                onPress={() => {
                  onContinue();
                  Linking.openURL(exploreUrl);
                }}
              >
                View status <Octicons name="link-external" size={10} />
              </TextWithPress>
            )}
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
            ]}
            activeOpacity={0.75}
            onPress={onPressContinue}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}

const WalletErrorIcon: React.FC = () => {
  return (
    <Svg width="32" height="32" viewBox="0 0 42 42" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21 41.8002C26.5165 41.8002 31.807 39.6088 35.7078 35.708C39.6085 31.8073 41.7999 26.5167 41.7999 21.0002C41.7999 15.4837 39.6085 10.1931 35.7078 6.29237C31.807 2.39162 26.5165 0.200195 21 0.200195C15.4834 0.200195 10.1929 2.39162 6.29213 6.29237C2.39137 10.1931 0.199951 15.4837 0.199951 21.0002C0.199951 26.5167 2.39137 31.8073 6.29213 35.708C10.1929 39.6088 15.4834 41.8002 21 41.8002ZM16.528 13.7722C16.1583 13.4277 15.6694 13.2402 15.1642 13.2491C14.659 13.2581 14.177 13.4627 13.8197 13.82C13.4625 14.1773 13.2578 14.6593 13.2489 15.1644C13.24 15.6696 13.4275 16.1585 13.7719 16.5282L18.2439 21.0002L13.7719 25.4722C13.5804 25.6507 13.4267 25.866 13.3201 26.1052C13.2135 26.3444 13.1562 26.6026 13.1516 26.8644C13.147 27.1263 13.1952 27.3863 13.2932 27.6291C13.3913 27.872 13.5373 28.0925 13.7225 28.2777C13.9076 28.4629 14.1282 28.6088 14.371 28.7069C14.6138 28.805 14.8739 28.8532 15.1357 28.8485C15.3975 28.8439 15.6558 28.7866 15.8949 28.68C16.1341 28.5734 16.3494 28.4198 16.528 28.2282L21 23.7562L25.472 28.2282C25.6505 28.4198 25.8658 28.5734 26.105 28.68C26.3441 28.7866 26.6024 28.8439 26.8642 28.8485C27.126 28.8532 27.3861 28.805 27.6289 28.7069C27.8717 28.6088 28.0923 28.4629 28.2774 28.2777C28.4626 28.0925 28.6086 27.872 28.7067 27.6291C28.8047 27.3863 28.8529 27.1263 28.8483 26.8644C28.8437 26.6026 28.7864 26.3444 28.6798 26.1052C28.5732 25.866 28.4195 25.6507 28.2279 25.4722L23.756 21.0002L28.2279 16.5282C28.5724 16.1585 28.7599 15.6696 28.751 15.1644C28.7421 14.6593 28.5374 14.1773 28.1802 13.82C27.8229 13.4627 27.3409 13.2581 26.8357 13.2491C26.3305 13.2402 25.8416 13.4277 25.472 13.7722L21 18.2442L16.528 13.7722Z"
        fill="#BBB"
      />
    </Svg>
  );
};

function WalletErrorBottomSheet({
  rejected,
  onContinue,
}: {
  rejected: boolean;
  onContinue: () => void;
}) {
  const t = useTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <BottomSheetView>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.itemsCenter,
          t.justifyBetween,
          t.p4,
          t.pY2,
          t.pB0,
          // This is a quirk of dynamically sized bottom sheet views with flex displays
          { minHeight: 100 },
        ]}
      >
        <View style={[t.flex, t.flexCol, t.itemsCenter, t.wFull]}>
          <View
            style={[
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              t.roundedFull,
              t.w18,
              t.h18,
              t.bgFrameActionsUnderneath,
            ]}
          >
            <WalletErrorIcon />
          </View>
          <View
            style={[t.wFull, t.mT5, t.mB3, t.justifyCenter, t.flex, t.flexRow]}
          >
            <Text
              style={[
                t.flex,
                t.flexRow,
                t.justifyCenter,
                t.texts.primary,
                t.fontBold,
                t.text2xl,
                t.textCenter,
              ]}
            >
              {rejected ? 'Canceled' : 'Failed'}
            </Text>
          </View>
          <View style={[t.flex, t.flexCol, t.wFull, t.mB5]}>
            <Text style={[t.texts.tertiary, t.textBase, t.textCenter]}>
              {rejected ? 'Canceled in your wallet.' : 'Failed in your wallet.'}
            </Text>
          </View>
        </View>
        <View style={[t.wFull, { marginBottom: Math.max(bottom, sizes.s2) }]}>
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.pY4,
              t.pX3,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
              t.fontSemibold,
            ]}
            activeOpacity={0.75}
            onPress={onContinue}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetView>
  );
}
