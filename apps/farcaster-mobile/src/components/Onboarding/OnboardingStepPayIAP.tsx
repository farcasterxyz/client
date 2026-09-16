import { AnalyticsEvent } from 'farcaster-analytics';
import { getFirstApiErrorBody } from 'farcaster-client-data';
import {
  useNonSuspendingOffering,
  useSimulateRegisterFid,
} from 'farcaster-client-hooks';
import { Typography } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

import { AnalyticsOnlyEvent } from '~/constants/AnalyticsOnlyEvents';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useInAppPurchases } from '~/contexts/InAppPurchasesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';

import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingSteps } from './StepsProvider';

function CheckIcon({ fill }: { fill: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12L11 14L15 10"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OnboardingStepPayIAP() {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const [{ registrationError }, dispatch] = useOnboardingSteps();

  const [error, setError] = React.useState<string | undefined>();

  const { account } = useWallet();

  const {
    getAvailableOffering,
    inAppPurchasingIsEnabled,
    isInitialized,
    purchase,
    requestedPurchaseSucceeded,
    requestedPurchaseFailed,
    requestedPurchaseCancelledByUser,
    resetPurchaseState,
    retryProductFetch,
    iapDebugData,
  } = useInAppPurchases();
  const { data, isLoading } = useNonSuspendingOffering({
    onchainTransactionType: 'register',
  });
  const [iapInProgress, setIAPInProgress] = React.useState(false);
  const simulateRegisterFid = useSimulateRegisterFid();

  const offering = React.useMemo(
    () =>
      data
        ? getAvailableOffering({ productId: data.offering.productId })
        : undefined,
    [data, getAvailableOffering],
  );

  const offeringUnavailable =
    inAppPurchasingIsEnabled &&
    isInitialized &&
    !isLoading &&
    typeof data !== 'undefined' &&
    typeof offering === 'undefined';

  const submit = React.useCallback(async () => {
    try {
      if (typeof data === 'undefined') {
        setError(
          'Payments are not available at this time. Please try again later.',
        );

        return;
      }

      if (typeof offering === 'undefined') {
        setError(
          'Offering not available at this time. Please try again later.',
        );

        return;
      }

      trackEvent(AnalyticsEvent.ClickPayAndRegister, {
        price: offering.localizedPrice,
        iapDebugData,
      });

      setIAPInProgress(true);

      try {
        await simulateRegisterFid({
          recoveryAddress: undefined,
          account: account!,
        });
      } catch (error) {
        const apiError = getFirstApiErrorBody(error);
        if (apiError && apiError.reason === 'fid_already_registered') {
          dispatch({
            type: 'SetStep',
            step: 'ChooseUsername',
            direction: 'forwards',
          });

          return;
        }
      }

      await purchase({
        onchainTransactionType: 'register',
        productId: offering.productId,
      });
    } catch (error) {
      setIAPInProgress(false);
      resetPurchaseState();

      // User deliberately dismissed the payment dialog.
      if ((error as { code?: string })?.code === 'E_USER_CANCELLED') {
        setError('Your payment did not go through. Please try again.');
        return;
      }

      trackEvent(AnalyticsOnlyEvent.OnboardingPaymentIapError, {
        error_type: 'purchase_exception',
        error_message: String(error).slice(0, 500),
      });
      trackOnboardingError(error, 'iap');
      setError('Your payment did not go through. Please try again.');
    }
  }, [
    account,
    data,
    dispatch,
    iapDebugData,
    offering,
    purchase,
    resetPurchaseState,
    simulateRegisterFid,
    trackEvent,
  ]);

  React.useEffect(() => {
    if (requestedPurchaseFailed) {
      setIAPInProgress(false);
      setError('Your payment did not go through. Please try again.');

      if (!requestedPurchaseCancelledByUser) {
        trackEvent(AnalyticsEvent.RegisterIAPFail, {});
        trackEvent(AnalyticsOnlyEvent.OnboardingPaymentIapError, {
          error_type: 'purchase_failed',
        });
      }

      resetPurchaseState();
    } else if (requestedPurchaseSucceeded) {
      trackEvent(AnalyticsEvent.RegisterIAPSuccess, {});

      resetPurchaseState();

      dispatch({
        type: 'SetStep',
        step: 'ChooseUsername',
        direction: 'forwards',
      });

      setIAPInProgress(false);
    }
  }, [
    dispatch,
    requestedPurchaseCancelledByUser,
    requestedPurchaseFailed,
    requestedPurchaseSucceeded,
    resetPurchaseState,
    trackEvent,
  ]);

  const onContinuePress = React.useCallback(async () => {
    submit();
  }, [submit]);

  return (
    <Onboarding.Layout onBackPress={undefined} onSkipPress={undefined}>
      <Onboarding.Title>Create your Farcaster account</Onboarding.Title>
      <View style={[t.flex, t.flexCol, t.mT3, t.gap4]}>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Own your identity</Onboarding.Sub>
            <Typography
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Farcaster accounts are registered onchain and belong entirely to
              you. You are always in control of your account.
            </Typography>
          </View>
        </View>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Use any app you like</Onboarding.Sub>
            <Typography
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Onchain Accounts can be used to log into many other apps in the
              Farcaster ecosystem.
            </Typography>
          </View>
        </View>
        <View style={[t.flex, t.flexRow, t.itemsStart, t.wFull, t.gap4]}>
          <CheckIcon fill={t.colors.text.primary} />
          <View style={[t.flex1, t.flexCol, t.gap2]}>
            <Onboarding.Sub>Pay with in-app purchase</Onboarding.Sub>
            <Typography
              numberOfLines={3}
              adjustsFontSizeToFit
              label="Medium/Base"
              color="secondary"
            >
              Cover your onchain fees using in-app purchases. You don't need to
              own any crypto to get started.
            </Typography>
          </View>
        </View>
      </View>
      <OnboardingPortal.Portal>
        {!inAppPurchasingIsEnabled && (
          <Onboarding.Alert>In-app purchases not supported.</Onboarding.Alert>
        )}
        {offeringUnavailable && typeof error === 'undefined' && (
          <Onboarding.Alert>
            Offering not available at this time. Please try again later.
          </Onboarding.Alert>
        )}
        {typeof error !== 'undefined' && (
          <Onboarding.Alert>{error}</Onboarding.Alert>
        )}
        {registrationError === 'unknown' && (
          <Onboarding.Alert>
            Failed to register. Please try again later.
          </Onboarding.Alert>
        )}
        <Onboarding.Button
          onPress={offeringUnavailable ? retryProductFetch : onContinuePress}
          disabled={
            !inAppPurchasingIsEnabled ||
            iapInProgress ||
            isLoading ||
            !isInitialized
          }
          loading={iapInProgress || isLoading || !isInitialized}
        >
          {offeringUnavailable ? 'Retry' : 'Pay to Register'}
        </Onboarding.Button>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

export { OnboardingStepPayIAP };
