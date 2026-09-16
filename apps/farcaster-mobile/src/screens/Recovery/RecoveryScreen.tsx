import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { isHandledFetchError } from 'farcaster-client-data';
import {
  useGetGloballyCachedTotpToken,
  useRecovery,
  useRefreshOnboardingStateAndAuthToken,
  useTotpEnabledQuery,
} from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Alert, Linking, Platform, Pressable, View } from 'react-native';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { StepOptions, Steps } from '~/components/Steps';
import { Text } from '~/components/Text';
import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { hitSlop } from '~/constants/Pressable';
import { promptPasskeyEnrollmentAfterRecoveryKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useAuthToken } from '~/contexts/AuthTokenProvider';
import { StartData, useRecoveryStore } from '~/contexts/RecoveryStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { RecoveryStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';
import { setSecureItem } from '~/utils/SecureStorageUtils';

const recoverySteps: StepOptions[] = [
  {
    label: 'Confirm your email',
    description: 'Verify ownership of email address',
    analyticsKey: 'recovery confirm email',
  },
  {
    label: 'Create new recovery phrase',
    description: 'Back up the recovery phrase so that you can log back in',
    analyticsKey: 'recovery create new recovery phrase',
  },
  {
    label: 'Wait for review',
    description:
      'The Farcaster team will review and send you an email in 72 hours',
    analyticsKey: 'recovery wait for review',
  },
];

type RecoveryStartScreenProps = NativeStackScreenProps<
  RecoveryStackParamList,
  'Recovery'
>;

type CurrentStep =
  | {
      index: 1;
      startData: StartData;
    }
  | {
      index: 2;
    }
  | {
      index: 3;
    };

function RecoveryScreenErrorBoundary() {
  const { reset } = useRecoveryStore();
  return (
    <ErrorBoundary
      fallback={<></>}
      onError={async (error) => {
        if (isHandledFetchError(error)) {
          if (error.status === 404) {
            // If the recovery can't be found, reset the recovery store. This will
            // result on the recovery stack being unnmounted.
            await reset();
            return;
          }
        }

        // Otherwise throw the error to be handled by upstream error boundary.
        throw error;
      }}
    >
      <RecoveryScreen />
    </ErrorBoundary>
  );
}

function RecoveryScreen() {
  const t = useTheme();
  const push = usePush();
  const { recovery: storedRecovery, startData, reset } = useRecoveryStore();
  const { account } = useWallet();
  const { trackEvent, alias } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVerifiedTotp, setHasVerifiedTotp] = useState(false);
  const [totpToken, setTotpToken] = useState<string | undefined>(undefined);
  const { data, isPaused, isLoading, isPending } = useRecovery(
    { id: storedRecovery?.id as string },
    {
      refetchOnMount: 'always',
      refetchInterval: 5000,
      enabled: typeof storedRecovery !== 'undefined' && storedRecovery !== null,
    },
  );

  const getGloballyCachedTotpToken = useGetGloballyCachedTotpToken();
  const totpcheckUserAppContextGate = useMemo(
    () => !!startData?.email,
    [startData],
  );

  const {
    data: totpData,
    isPending: isTotpPending,
    error: totpError,
  } = useTotpEnabledQuery({
    email: startData?.email,
    enabled: totpcheckUserAppContextGate,
  });

  const aliasedFidRef = useRef<number | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  // Stitch new-device anon history to the FID person as soon as polling
  // returns the fid for this recovery. Alias idempotent per-fid via ref.
  useEffect(() => {
    const polledFid = data?.result.recovery.fid;
    if (polledFid && aliasedFidRef.current !== polledFid) {
      aliasedFidRef.current = polledFid;
      alias(String(polledFid));
    }
  }, [data?.result.recovery.fid, alias]);

  // Fire exactly one terminal event when polling resolves to a final state.
  const terminalFiredRef = useRef(false);
  useEffect(() => {
    if (terminalFiredRef.current) return;
    const recovery = data?.result.recovery;
    if (!recovery) return;
    let terminalState: string | null = null;
    if (recovery.completedAt) terminalState = 'completed';
    else if (recovery.adminDeniedAt) terminalState = 'admin_denied';
    else if (recovery.rejectedAt) terminalState = 'rejected';
    if (!terminalState) return;
    terminalFiredRef.current = true;
    trackEvent(AnalyticsOnlyEvent.RecoveryPollingTerminal, {
      terminal_state: terminalState,
      recovery_id: recovery.id,
      fid: recovery.fid,
      time_in_poll_ms: Date.now() - pollStartRef.current,
    });
    if (terminalState === 'completed') {
      trackEvent(AnalyticsOnlyEvent.RecoveryRegistrationTxConfirmed, {
        recovery_id: recovery.id,
        fid: recovery.fid,
      });
    }
  }, [data?.result.recovery, trackEvent]);

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewRecovery, {
        fid: data?.result.recovery.fid,
      });
    }, [data?.result.recovery.fid, trackEvent]),
  );

  const { clearWallet } = useWallet();
  const recoveryActions = useMemo(() => {
    const handleCancel = () => {
      Alert.alert(
        'Cancel account recovery',
        'Are you sure you want to cancel?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              if (totpData?.result.enabled) {
                recoveryActions.showTotpVerification();
              }
            },
          },
          {
            text: 'Yes, cancel',
            onPress: async () => {
              try {
                trackEvent(AnalyticsEvent.CancelRecovery, {});
                await clearWallet();
                reset();
              } catch (e) {
                trackError(e);
              } finally {
                setIsSubmitting(false);
              }
            },
            style: 'destructive',
          },
        ],
        {
          cancelable: true,
        },
      );
    };

    const handleSuccess = () => {
      const totpToken = getGloballyCachedTotpToken({ context: 'recovery' });
      setTotpToken(totpToken);
      setHasVerifiedTotp(true);
    };

    const showTotpVerification = () => {
      push('SecureModeVerifyCode', {
        mode: 'generate-token',
        context: 'recovery',
        email: startData?.email,
        onSuccess: handleSuccess,
        onCancel: handleCancel,
      });
    };

    return {
      cancel: handleCancel,
      showTotpVerification,
    };
  }, [
    totpData?.result.enabled,
    trackEvent,
    reset,
    getGloballyCachedTotpToken,
    push,
    clearWallet,
    startData?.email,
  ]);

  useEffect(() => {
    if (
      totpcheckUserAppContextGate &&
      !isTotpPending &&
      totpData?.result.enabled &&
      !hasVerifiedTotp
    ) {
      recoveryActions.showTotpVerification();
    }
  }, [
    isTotpPending,
    totpData,
    hasVerifiedTotp,
    recoveryActions,
    totpcheckUserAppContextGate,
  ]);

  if (totpcheckUserAppContextGate) {
    if (totpError) {
      return (
        <UnexpectedRecoveryState
          error={`Failed to check Advanced Protection status: ${totpError.message}`}
        />
      );
    }

    if (isTotpPending) {
      return <FullScreenLoadingIndicator />;
    }

    if (totpData?.result.enabled && !hasVerifiedTotp) {
      return <FullScreenLoadingIndicator />;
    }
  }

  if (data?.result.recovery.adminDeniedAt) {
    return <RecoveryDenied variant="denied" />;
  }

  if (data?.result.recovery.rejectedAt) {
    return <RecoveryDenied variant="cancelled" />;
  }

  let currentStep: CurrentStep | null = null;

  if (!storedRecovery) {
    if (!startData) {
      return <UnexpectedRecoveryState error="No startData to begin recovery" />;
    }

    currentStep = {
      index: 1,
      startData,
    };
  } else {
    if (isPaused || isLoading || isPending) {
      return <FullScreenLoadingIndicator />;
    }

    if (!data) {
      return (
        <UnexpectedRecoveryState error="Stored recovery found but unable to fetch recovery data" />
      );
    }

    if (!account) {
      return (
        <UnexpectedRecoveryState error="Stored recovery found but no wallet" />
      );
    }

    if (!data.result.recovery.completedAt) {
      currentStep = { index: 2 };
    } else {
      currentStep = { index: 3 };
    }
  }

  if (currentStep === null) {
    return <UnexpectedRecoveryState error="No current step set" />;
  }

  // We are going to be more relaxed on these steps as we are observing users
  // being stuck in recovery before its the final "finish" flow.
  const canCancel = currentStep.index < 3;

  return (
    <View style={[t.hFull, t.pX4, t.pB8]}>
      <View style={[t.flexGrow, t.justifyAround]}>
        <View style={[t.flexGrow, t.pY2, { maxHeight: 500 }]}>
          <Steps steps={recoverySteps} currentIndex={currentStep.index} />
        </View>
      </View>
      <View style={[t.flexNone, t.justifyEnd, { height: 140 }]}>
        {currentStep && currentStep.index === 1 && (
          <BackupMnemonic
            totpToken={totpToken}
            token={currentStep.startData.token}
            email={currentStep.startData.email}
          />
        )}
        {currentStep && currentStep.index === 3 && <FinishRecovery />}
        {canCancel && (
          <View style={t.mT2}>
            <ButtonV2
              title="Cancel recovery"
              onPress={recoveryActions.cancel}
              disabled={isSubmitting}
              variant="secondary"
            />
          </View>
        )}
      </View>
    </View>
  );
}

function BackupMnemonic({
  totpToken,
  token,
  email,
}: {
  totpToken?: string;
  token: string;
  email: string;
}) {
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();

  return (
    <ButtonV2
      title="Continue"
      onPress={() => {
        trackEvent(AnalyticsEvent.ClickRecoveryBackupRecoveryPhrase, {});
        navigate('RecoveryBackupRecoveryPhrase', {
          totpToken,
          token,
          email,
        });
      }}
    />
  );
}

// If we encounter an unexpected recovery state we'll render
// the component to reset the recovery store so the user can
// get back to normal navigation state.
function UnexpectedRecoveryState({ error }: { error: string }) {
  const { reset } = useRecoveryStore();

  useEffect(() => {
    trackError(new Error(`Unexpected recovery state: ${error}`));
    reset();
  }, [reset, error]);

  return null;
}

function FinishRecovery() {
  const { reset, recovery } = useRecoveryStore();
  const { account } = useWallet();
  const { trackEvent } = useAnalytics();
  const { setAuthToken } = useAuthToken();
  const refreshOnboardingStateAndAuthToken =
    useRefreshOnboardingStateAndAuthToken();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    trackEvent(AnalyticsEvent.CompleteRecovery, {
      recoveryId: recovery?.id,
    });
    setIsSubmitting(true);
    try {
      for (let attempt = 0; attempt < 5; attempt++) {
        const data = await refreshOnboardingStateAndAuthToken({
          account: account!,
        });

        if (data?.result.state.hasCompletedRegistration) {
          // Write flag before setAuthToken to avoid a race where HomeScreen
          // mounts and reads the flag before finally can write it.
          await setSecureItem({
            key: promptPasskeyEnrollmentAfterRecoveryKey,
            value: true,
          });
          if (data?.result.token) {
            await setAuthToken({ authToken: data.result.token });
          }
          return;
        }

        if (data?.result.token) {
          await setAuthToken({ authToken: data.result.token });
        }

        if (attempt < 4) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    } finally {
      setIsSubmitting(false);
      reset();
    }
  };

  return <ButtonV2 title="Finish" onPress={submit} loading={isSubmitting} />;
}

function RecoveryDenied({
  variant = 'denied',
}: {
  variant?: 'denied' | 'cancelled';
}) {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useAnalytics();
  const { reset } = useRecoveryStore();
  const goHome = async () => {
    await reset();
    if (variant === 'cancelled') {
      // Defer past the render commit so UnauthedStack has swapped from
      // RecoveryStack to its main navigator, where RecoveryInitiate lives.
      setTimeout(() => push('RecoveryInitiate', {}), 0);
    }
  };

  // Fire the `recovery.denied_shown` event when the user actually
  // sees the denial screen. Previously a dangling `useCallback` that built
  // the callback but never invoked it — so the event never fired.
  useEffect(() => {
    trackEvent(AnalyticsEvent.ViewRecoveryDenied, { variant });
  }, [trackEvent, variant]);

  return (
    <View style={[t.hFull, t.pX4, t.pB8]}>
      <View style={[t.flexGrow, t.justifyCenter]}>
        <Text
          style={[t.texts.primary, t.textCenter, t.textXl, t.fontBold, t.mB6]}
        >
          {variant === 'denied'
            ? 'Recovery denied'
            : "Recovery couldn't be completed"}
        </Text>
        {variant === 'denied' ? (
          <>
            <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mB5]}>
              Please reach out to:
            </Text>
            <Pressable
              onPress={() => {
                const email =
                  Platform.OS === 'ios'
                    ? 'support+ios@neynar.com'
                    : 'support+android@neynar.com';
                Linking.openURL(`mailto:${email}`);
              }}
              hitSlop={hitSlop}
            >
              <Text
                style={[
                  t.texts.brand,
                  t.textCenter,
                  t.textBase,
                  t.fontSemibold,
                ]}
              >
                {Platform.OS === 'ios'
                  ? 'support+ios@neynar.com'
                  : 'support+android@neynar.com'}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mB5]}>
            Please start a new recovery attempt.
          </Text>
        )}
      </View>
      <View style={[t.flexNone, t.justifyEnd, { height: 180 }]}>
        <ButtonV2
          title={variant === 'cancelled' ? 'Start over' : 'Continue'}
          onPress={goHome}
        />
      </View>
    </View>
  );
}

export const RecoveryStartScreen = buildScreen<RecoveryStartScreenProps>(
  {
    name: 'Recovery',
  },
  RecoveryScreenErrorBoundary,
);
