import { Octicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiTransactionWouldRevertError,
  getFirstApiErrorBody,
} from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  resolveDisplayName,
  useApproveSignedKeyRequest,
  useConnectedApp,
  useInvalidateConnectedApp,
  useInvalidateConnectedApps,
  useInvalidateUserAppContext,
  useOffering,
  usePayWarpsAndConnectApp,
  useSignedKeyRequest,
  useSimulateCreateSignedKeyRequest,
  useWarpsOffering,
} from 'farcaster-client-hooks';
import { CheckBox, HoldToConfirmButton } from 'farcaster-expo';
import {
  CircleAlert,
  NotebookPen,
  NotebookText,
  Signature,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextWithPress } from '~/components/TextWithPress';
import { TransactionLimitExceeded } from '~/components/TransactionLimitExceeded';
import { Warp } from '~/components/Warp';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList, InAppPurchaseError } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

import { BroadcastingSignedKeyRequest } from './BroadcastingSignedKeyRequest';
import { ConnectAppAppDetails } from './ConnectAppAppDetails';
import { ConnectAppCompleted } from './ConnectAppCompleted';
import { SignedKeyRequestFailure } from './SignedKeyRequestFailure';

type SignedKeyRequestScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'SignedKeyRequest'
>;

type ScreenError =
  | ApiTransactionWouldRevertError
  | {
      reason: 'payment_failed' | 'key_transaction_limit' | 'unknown';
    };

const SignedKeyRequestScreen = buildScreen<SignedKeyRequestScreenProps>(
  { name: 'SignedKeyRequest', insetBottom: false },
  ({
    route: {
      params: { token, redirectUrl },
    },
  }) => {
    const t = useTheme();
    const pop = usePop();
    const toast = useToast();
    const { trackEvent } = useAnalytics();
    const { account } = useWallet();
    const [failure, setFailure] = useState<ScreenError | undefined>();
    const [authTrustConfirmed, setAuthTrustConfirmed] = useState(false);

    const {
      inAppPurchasingIsEnabled,
      getAvailableOffering,
      purchase,
      requestedPurchaseSucceeded,
      requestedPurchaseFailed,
      resetPurchaseState,
    } = useInAppPurchases();

    const [iapInProgress, setIAPInProgress] = useState(false);
    const [warpPaymentInProgress, setWarpPaymentInProgress] = useState(false);

    const { data: offeringData } = useOffering({
      onchainTransactionType: 'create-onchain-signer',
    });
    const { data: warpsOfferingData } = useWarpsOffering({
      onchainTransactionType: 'create-onchain-signer',
    });

    const signerOffering = React.useMemo(
      () =>
        getAvailableOffering({ productId: offeringData!.offering.productId }),
      [getAvailableOffering, offeringData],
    );
    const signerWarpOffering = React.useMemo(
      () => warpsOfferingData?.offering,
      [warpsOfferingData?.offering],
    );

    const { data } = useSignedKeyRequest({ token });
    const simulateCreateSignedKeyRequest = useSimulateCreateSignedKeyRequest();
    const approveSignedKeyRequest = useApproveSignedKeyRequest();
    const payWarpsAndConnectApp = usePayWarpsAndConnectApp();

    const { signedKeyRequest } = data!.result;
    const appFid = signedKeyRequest.requestFid;

    const { data: connectedApp, refetch } = useConnectedApp({
      appFid,
    });

    useRefreshOnFocus(refetch);

    const app = connectedApp.connectedApp;
    const hasWritePermission = app.writeKeys.length > 0;
    const hasAuthPermission = app.authKeys.length > 0;
    const isAuthKey = signedKeyRequest.keyType === 'auth-address';
    const isWriteKey = signedKeyRequest.keyType !== 'auth-address';
    const authKeyNotTrusted = isAuthKey && !authTrustConfirmed;

    const analyticsProperties = useMemo(
      () => ({ appFid: signedKeyRequest.requestFid }),
      [signedKeyRequest.requestFid],
    );

    const signerUser = React.useMemo(() => {
      return signedKeyRequest.signerUser;
    }, [signedKeyRequest.signerUser]);

    const signerUserMetadata = React.useMemo(() => {
      return signedKeyRequest.signerUserMetadata;
    }, [signedKeyRequest.signerUserMetadata]);

    const connectAppHeader = React.useMemo(() => {
      if (
        typeof signerUser !== 'undefined' &&
        typeof signerUserMetadata !== 'undefined'
      ) {
        return (
          <ConnectAppAppDetails
            app={signerUser}
            appMetadata={signerUserMetadata}
          />
        );
      }

      return (
        <View style={[t.flex, t.flexCol]}>
          <View style={[t.p3]}>
            <View style={[t.pY3, t.flexRow, t.itemsCenter, { gap: 16 }]}>
              <View
                style={[
                  t.bgDefault,
                  { height: 56, width: 56, borderRadius: 12 },
                  t.itemsCenter,
                  t.justifyCenter,
                ]}
              >
                <Octicons name="key" size={36} style={[t.texts.tertiary]} />
              </View>
            </View>
            <Text2 color="secondary">
              An app wants a key to access your account. You can revoke this key
              at any time.
              <TextWithPress
                style={[t.pL1, t.texts.brand]}
                onPress={() => {
                  Linking.openURL(getNotionLinkTarget({ to: 'signers' }));
                }}
              >
                {' '}
                Learn more
              </TextWithPress>
            </Text2>
          </View>
        </View>
      );
    }, [
      signerUser,
      signerUserMetadata,
      t.bgDefault,
      t.flex,
      t.flexCol,
      t.flexRow,
      t.itemsCenter,
      t.pL1,
      t.texts.tertiary,
      t.texts.brand,
      t.justifyCenter,
      t.p3,
      t.pY3,
    ]);

    const simulateCreateSigner = React.useCallback(async () => {
      try {
        trackEvent(
          AnalyticsEvent.SlideAndSimulateCreateSigner,
          analyticsProperties,
        );

        await simulateCreateSignedKeyRequest({ token }, account!);

        // Only proceed to payment if we get a successful simulation and offering exists
        if (typeof signerOffering !== 'undefined') {
          await purchase({
            onchainTransactionType: 'create-onchain-signer',
            productId: signerOffering.productId,
          });
        }
      } catch (e) {
        const apiError = getFirstApiErrorBody(e);

        // Don't report this error since it is handled gracefully.
        if (apiError && apiError.reason === 'transaction_would_revert') {
          setFailure(apiError);
          trackEvent(AnalyticsEvent.ConnectAppFailed, {
            ...analyticsProperties,
            reason: apiError.reason,
          });

          return;
        }

        // Each FID is only allowed so many changes. Don't report this error
        // since it is handled gracefully.
        if (apiError && apiError.reason === 'key_transaction_limit') {
          setFailure({ reason: apiError.reason });
          trackEvent(AnalyticsEvent.ConnectAppFailed, {
            ...analyticsProperties,
            reason: apiError.reason,
          });

          return;
        }

        setFailure({ reason: 'unknown' });
        trackEvent(AnalyticsEvent.ConnectAppFailed, analyticsProperties);
        trackError(
          new Error(`Failed to simulate signed key request`, { cause: e }),
        );
      }
    }, [
      analyticsProperties,
      purchase,
      signerOffering,
      simulateCreateSignedKeyRequest,
      token,
      trackEvent,
      account,
    ]);

    const addSigner = React.useCallback(
      async (paymentMethod: { type: 'iap' } | { type: 'sponsored' }) => {
        try {
          trackEvent(AnalyticsEvent.ApproveConnectApp, analyticsProperties);
          await approveSignedKeyRequest({ token, paymentMethod }, account!);
        } catch (e) {
          const apiError = getFirstApiErrorBody(e);

          // Don't report this error since it is handled gracefully.
          if (apiError && apiError.reason === 'transaction_would_revert') {
            const message = `Transaction would revert: ${apiError.data.revertError.name}.`;
            setFailure(apiError);
            trackEvent(AnalyticsEvent.ConnectAppFailed, {
              ...analyticsProperties,
              reason: apiError.reason,
              message,
            });

            return;
          }

          // Each FID is only allowed so many changes. Don't report this error
          // since it is handled gracefully.
          if (apiError && apiError.reason === 'key_transaction_limit') {
            setFailure({ reason: apiError.reason });
            trackEvent(AnalyticsEvent.ConnectAppFailed, {
              ...analyticsProperties,
              reason: apiError.reason,
            });

            return;
          }

          setFailure({ reason: 'unknown' });
          trackEvent(AnalyticsEvent.ConnectAppFailed, analyticsProperties);
          trackError(
            new Error(`Failed to complete signed key request`, { cause: e }),
          );
        }
      },
      [
        analyticsProperties,
        approveSignedKeyRequest,
        token,
        trackEvent,
        account,
      ],
    );

    const payWarpsAndConnectAppPress = React.useCallback(async () => {
      if (typeof signerWarpOffering === 'undefined') {
        return;
      }

      try {
        setWarpPaymentInProgress(true);

        await simulateCreateSignedKeyRequest({ token }, account!);

        await payWarpsAndConnectApp(
          {
            token,
            warpsOfferingToken: signerWarpOffering.offeringToken,
          },
          account!,
        );
      } catch (e) {
        const apiError = getFirstApiErrorBody(e);

        // Don't report this error since it is handled gracefully.
        if (apiError && apiError.reason === 'transaction_would_revert') {
          const message = `Transaction would revert: ${apiError.data.revertError.name}.`;
          setFailure(apiError);
          trackEvent(AnalyticsEvent.ConnectAppFailed, {
            ...analyticsProperties,
            reason: apiError.reason,
            message,
          });

          return;
        }

        // Each FID is only allowed so many changes. Don't report this error
        // since it is handled gracefully.
        if (apiError && apiError.reason === 'key_transaction_limit') {
          setFailure({ reason: apiError.reason });
          trackEvent(AnalyticsEvent.ConnectAppFailed, {
            ...analyticsProperties,
            reason: apiError.reason,
          });

          return;
        }

        setFailure({ reason: 'unknown' });
        trackEvent(AnalyticsEvent.ConnectAppFailed, analyticsProperties);
        trackError(
          new Error(`Failed to complete signed key request`, { cause: e }),
        );
      } finally {
        setWarpPaymentInProgress(false);
      }
    }, [
      analyticsProperties,
      payWarpsAndConnectApp,
      signerWarpOffering,
      simulateCreateSignedKeyRequest,
      token,
      trackEvent,
      account,
    ]);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.RequestConnectApp, analyticsProperties);
      }, [trackEvent, analyticsProperties]),
    );

    React.useEffect(() => {
      if (typeof signerOffering === 'undefined') {
        return;
      }

      if (requestedPurchaseFailed) {
        trackError(
          new InAppPurchaseError({ productId: signerOffering.productId }),
        );
        setIAPInProgress(false);
        trackEvent(AnalyticsEvent.CreateSignerRequestIAPFailed, {
          price: signerOffering.localizedPrice,
          appFid: signedKeyRequest.requestFid,
        });
        toast.show('Failed to purchase.', { placement: 'top' });
        setFailure({ reason: 'payment_failed' });
        resetPurchaseState();
        return;
      }
      if (requestedPurchaseSucceeded) {
        setIAPInProgress(false);
        trackEvent(AnalyticsEvent.CreateSignerRequestIAPSuccessful, {
          price: signerOffering.localizedPrice,
          appFid: signedKeyRequest.requestFid,
        });

        toast.show('Purchase successful, starting onchain transaction.', {
          placement: 'top',
        });
        addSigner({ type: 'iap' });
        resetPurchaseState();
        return;
      }
    }, [
      addSigner,
      requestedPurchaseFailed,
      requestedPurchaseSucceeded,
      resetPurchaseState,
      signedKeyRequest.requestFid,
      signerOffering,
      toast,
      trackEvent,
    ]);

    const invalidateUserAppContext = useInvalidateUserAppContext();
    const invalidateConnectedApps = useInvalidateConnectedApps();
    const invalidateConnectedApp = useInvalidateConnectedApp();

    useEffect(() => {
      invalidateUserAppContext();
      invalidateConnectedApps();
      if (signerUser) {
        invalidateConnectedApp({ appFid: signerUser.fid });
      }
    }, [
      invalidateConnectedApp,
      invalidateConnectedApps,
      invalidateUserAppContext,
      signerUser,
    ]);

    if (signedKeyRequest.state === 'approved') {
      return <BroadcastingSignedKeyRequest token={token} />;
    }

    if (signedKeyRequest.state === 'completed') {
      return <ConnectAppCompleted app={signerUser} redirectUrl={redirectUrl} />;
    }

    if (failure || signedKeyRequest.state === 'failed') {
      if (failure?.reason === 'key_transaction_limit') {
        return <TransactionLimitExceeded onContinue={pop} />;
      }

      if (failure?.reason === 'payment_failed') {
        return (
          <SignedKeyRequestFailure
            title="Payment failed"
            message="We were unable to connect the app. Please try again later."
            onContinue={pop}
          />
        );
      }

      if (failure?.reason === 'transaction_would_revert') {
        return (
          <SignedKeyRequestFailure
            title="Transaction failed"
            message={
              <>
                The transaction would revert with an error:{' '}
                {failure.data.revertError.name}
              </>
            }
            onContinue={pop}
          />
        );
      }

      return (
        <SignedKeyRequestFailure
          title="Failed to connect"
          message="We were unable to connect the app."
          onContinue={pop}
        />
      );
    }

    return (
      <View style={[t.hFull, t.flex, t.flexCol]}>
        {connectAppHeader}
        <View style={[t.p3]}>
          <Text2 color="secondary" size="sm" weight="semibold">
            {signerUser
              ? resolveDisplayName({
                  displayName: signerUser.displayName,
                  username: signerUser.username,
                  fid: signerUser.fid,
                })
              : 'This app'}{' '}
            will be able to
          </Text2>
          <View
            style={[
              t.mT2,
              t.bgFaint,
              {
                borderRadius: 16,
                overflow: 'hidden',
              },
            ]}
          >
            {(isWriteKey || hasWritePermission) && (
              <>
                <View
                  style={[
                    t.p3,
                    t.borderB,
                    t.borderBackground,
                    t.flexRow,
                    { gap: 12 },
                  ]}
                >
                  <View
                    style={[
                      t.bgElevated,
                      t.roundedFull,
                      t.itemsCenter,
                      t.justifyCenter,
                      { width: 32, height: 32 },
                    ]}
                  >
                    <NotebookText size={20} color={t.colors.text.secondary} />
                  </View>
                  <View style={[t.flex1]}>
                    <Text2 weight="medium">Read</Text2>
                    <Text2 color="secondary" size="sm">
                      View your public profile.
                    </Text2>
                  </View>
                </View>
                <View
                  style={[
                    t.p3,
                    t.borderB,
                    t.borderBackground,
                    t.flexRow,
                    { gap: 12 },
                  ]}
                >
                  <View
                    style={[
                      t.bgElevated,
                      t.roundedFull,
                      t.itemsCenter,
                      t.justifyCenter,
                      { width: 32, height: 32 },
                    ]}
                  >
                    <NotebookPen size={20} color={t.colors.text.secondary} />
                  </View>
                  <View style={[t.flex1]}>
                    <Text2 weight="medium">Write</Text2>
                    <Text2 color="secondary" size="sm">
                      Cast, like, and update your profile.
                    </Text2>
                  </View>
                </View>
              </>
            )}
            {(isAuthKey || hasAuthPermission) && (
              <View
                style={[
                  t.p3,
                  t.borderB,
                  t.borderBackground,
                  t.flexRow,
                  { gap: 12 },
                ]}
              >
                <View
                  style={[
                    t.bgElevated,
                    t.roundedFull,
                    t.itemsCenter,
                    t.justifyCenter,
                    { width: 32, height: 32 },
                  ]}
                >
                  <Signature size={20} color={t.colors.text.secondary} />
                </View>
                <View style={[t.flex1]}>
                  <Text2 weight="medium">Sign in</Text2>
                  <Text2 color="secondary" size="sm">
                    Sign you into other apps.
                  </Text2>
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={[t.flex1, t.itemsCenter, t.justifyEnd, t.p3]}>
          {isAuthKey && (
            <View style={[t.wFull, t.mB2]}>
              <View
                style={[
                  t.backgrounds.warning,
                  t.p3,
                  {
                    borderRadius: 16,
                  },
                ]}
              >
                <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                  <CircleAlert
                    size={20}
                    color={t.colors.text.warning}
                    strokeWidth={2}
                  />
                  <Text2 style={t.texts.warning} weight="semibold">
                    Proceed with caution
                  </Text2>
                </View>
                <Text2 color="secondary" size="sm" style={[t.mT2]}>
                  This app will have permission to spend from your wallet. Only
                  proceed if you trust this app.
                </Text2>
                <View style={[t.mT3]}>
                  <View style={[t.flexRow, t.itemsCenter, { gap: 10 }]}>
                    <View style={[t.backgrounds.tertiary, t.rounded]}>
                      <CheckBox
                        isChecked={authTrustConfirmed}
                        toggleIsChecked={() =>
                          setAuthTrustConfirmed(!authTrustConfirmed)
                        }
                      />
                    </View>
                    <Text2 color="secondary" weight="semibold" size="sm">
                      I trust this app
                    </Text2>
                  </View>
                </View>
              </View>
            </View>
          )}
          {signedKeyRequest.isSponsored && (
            <View style={[t.flexRow, t.justifyBetween, t.mT2, { gap: 16 }]}>
              <HoldToConfirmButton
                title={'Hold to connect'}
                disabled={warpPaymentInProgress || authKeyNotTrusted}
                onConfirm={() => addSigner({ type: 'sponsored' })}
              />
            </View>
          )}
          {!signedKeyRequest.isSponsored && (
            <>
              {typeof signerWarpOffering !== 'undefined' ? (
                <>
                  <View
                    style={[t.flexRow, t.justifyBetween, t.mT2, { gap: 16 }]}
                  >
                    <HoldToConfirmButton
                      title={`Hold to pay ${signerWarpOffering.amount} ${signerWarpOffering.amount === 1 ? 'warp' : 'warps'} & connect`}
                      disabled={warpPaymentInProgress || authKeyNotTrusted}
                      onConfirm={payWarpsAndConnectAppPress}
                      Icon={() => <Warp fill={t.colors.text.light} />}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View
                    style={[t.flexRow, t.justifyBetween, t.mT2, { gap: 16 }]}
                  >
                    <HoldToConfirmButton
                      title={
                        iapInProgress
                          ? 'Confirming payment...'
                          : signerOffering?.localizedPrice &&
                              inAppPurchasingIsEnabled
                            ? `Pay ${signerOffering?.localizedPrice} to connect`
                            : 'Hold to connect'
                      }
                      disabled={iapInProgress || authKeyNotTrusted}
                      onConfirm={async () => {
                        if (
                          inAppPurchasingIsEnabled &&
                          typeof signerOffering !== 'undefined'
                        ) {
                          setIAPInProgress(true);
                          await simulateCreateSigner();
                        } else {
                          addSigner({ type: 'iap' });
                        }
                      }}
                    />
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </View>
    );
  },
);

SignedKeyRequestScreen.displayName = 'SignedKeyRequestScreen';

export { SignedKeyRequestScreen };
