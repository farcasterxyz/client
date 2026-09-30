import { Ionicons } from '@expo/vector-icons';
import { NavigationContext } from '@react-navigation/native';
import { AnalyticsEvent } from 'farcaster-analytics';
import type { ApiFarcasterProSubscriptionUsdcInfo } from 'farcaster-client-data';
import {
  resolveUsername,
  sleep,
  useFarcasterProSubscribeWithUsdcDetails,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FARCASTER_PRO_IAP_PRODUCT_ID,
  FARCASTER_PRO_IAP_TRANSACTION_TYPE,
} from '../../constants';
import { useSharedNavigationContext } from '../../contexts/SharedNavigationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useCurrentUserLevel } from '../../hooks/useUserLevel';
import { Avatar } from '../Avatar';
import { AnimatedPressable } from '../design-system/AnimatedPressable';
import { FullScreenLoadingIndicator } from '../design-system/FullScreenLoadingIndicator';
import { Text2 } from '../design-system/Text';
import { CheckCircle2 } from '../icons';
import { useEmbeddedWallet } from './../../contexts/EmbeddedWalletContext';
import { FarcasterProBadge } from './FarcasterProBadge';
import {
  buildFarcasterProUSDCPlanAnalyticsProps,
  FarcasterProSubscribeWithTierRegistrySheet,
} from './FarcasterProSubscribeWithTierRegistrySheet';

type FarcasterProUpsellStep = 'intro' | 'confirmation';

const getPlanIntervalLabel = (
  plan: Pick<ApiFarcasterProSubscriptionUsdcInfo, 'billingInterval'>,
) => (plan.billingInterval === 'monthly' ? 'month' : 'year');

const benefits = [
  {
    id: 'stand-out-with-a-badge',
    title: 'Stand out with a badge',
    description:
      'A purple checkmark will appear on your profile and all of your casts.',
  },
  {
    id: 'unlock-new-features',
    title: 'Unlock new social features',
    description:
      'Post longer casts with up to four images. Save direct messages forever.',
  },
  // Deprecated: 08/14/2025
  // {
  //   id: 'support-creators-and-developers',
  //   title: 'Support creators and developers',
  //   description:
  //     '100% of subscription fees are paid out to other people weekly rewards.',
  // },
  {
    id: 'best-prices-on-trades',
    title: 'Get the best prices on trades',
    description:
      'Pro users pay the lowest fees of any wallet. You will earn more on every trade you make.',
  },
];

const FarcasterProIntro = ({
  onContinue,
  source,
}: {
  onContinue: () => void;
  source?: string;
}) => {
  const t = useTheme();

  const {
    data: subscribeWithUSDCDetails,
    isPending: subscribeWithUSDCDetailsPending,
  } = useFarcasterProSubscribeWithUsdcDetails();

  const { trackEvent } = useTrackEvent();

  const [showSubscribeWithUSDCSheet, setShowSubscribeWithUSDCSheet] =
    useState(false);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellView, {
      source,
    });
  }, [source, trackEvent]);

  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  const handleDismissSheet = useCallback(() => {
    setShowSubscribeWithUSDCSheet(false);
  }, []);

  const [selectedBillingInterval, setSelectedBillingInterval] =
    useState<ApiFarcasterProSubscriptionUsdcInfo['billingInterval']>('yearly');

  const farcasterProUSDCPlans = useMemo(() => {
    return (
      subscribeWithUSDCDetails?.subscriptions.filter(
        (subscription) =>
          subscription.subscriptionType === 'farcaster-pro' &&
          subscription.transactionType === 'farcaster-tier-registry',
      ) ?? []
    );
  }, [subscribeWithUSDCDetails]);

  const farcasterProUSDCDetails = useMemo(() => {
    return (
      farcasterProUSDCPlans.find(
        (subscription) =>
          subscription.billingInterval === selectedBillingInterval,
      ) ?? farcasterProUSDCPlans[0]
    );
  }, [farcasterProUSDCPlans, selectedBillingInterval]);

  const handleSelectBillingInterval = useCallback(
    (plan: ApiFarcasterProSubscriptionUsdcInfo) => {
      setSelectedBillingInterval(plan.billingInterval);
      trackEvent(
        AnalyticsEvent.FarcasterProUpsellSelectBillingInterval,
        buildFarcasterProUSDCPlanAnalyticsProps({
          source,
          plan,
        }),
      );
    },
    [source, trackEvent],
  );

  const handlePayWithUSDC = useCallback(() => {
    setShowSubscribeWithUSDCSheet(true);
    trackEvent(
      AnalyticsEvent.FarcasterProUpsellClickPayWithUSDC,
      buildFarcasterProUSDCPlanAnalyticsProps({
        source,
        plan: farcasterProUSDCDetails,
      }),
    );
  }, [farcasterProUSDCDetails, source, trackEvent]);

  const { applyLimitedFunctionality, handlePayForProWithIAP } =
    useEmbeddedWallet();
  const isProUser = useCurrentUserLevel() === 'pro';

  const { goBack } = useSharedNavigationContext();

  const prefersIAP = applyLimitedFunctionality;

  const [proWithIAPPressabledDisabled, setProWithIAPPressableDisabled] =
    React.useState<boolean>(false);

  const proWithIAPPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ProWithIAPPress, {
      source,
      productId: FARCASTER_PRO_IAP_PRODUCT_ID,
      paymentMethod: 'iap',
      onchainTransactionType: FARCASTER_PRO_IAP_TRANSACTION_TYPE,
    });

    setProWithIAPPressableDisabled(true);

    handlePayForProWithIAP();

    goBack();
  }, [goBack, handlePayForProWithIAP, source, trackEvent]);

  const paymentCTA = useMemo(() => {
    if (prefersIAP) {
      return (
        <AnimatedPressable
          onPress={proWithIAPPress}
          disabled={proWithIAPPressabledDisabled}
        >
          <View
            style={[
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              {`Upgrade to Pro`}
            </Text2>
          </View>
        </AnimatedPressable>
      );
    }

    return (
      <AnimatedPressable onPress={handlePayWithUSDC}>
        <View
          style={[
            t.backgrounds.brand,
            { borderRadius: 32 },
            t.justifyCenter,
            t.itemsCenter,
            { height: 48 },
          ]}
        >
          <Text2 size="lg" weight="semibold" color="light">
            {farcasterProUSDCDetails
              ? `${isProUser ? 'Extend' : 'Upgrade'} for $${farcasterProUSDCDetails.priceInUsdc.toLocaleString()}/${getPlanIntervalLabel(farcasterProUSDCDetails)}`
              : 'Upgrade to Pro'}
          </Text2>
        </View>
      </AnimatedPressable>
    );
  }, [
    farcasterProUSDCDetails,
    handlePayWithUSDC,
    isProUser,
    prefersIAP,
    proWithIAPPress,
    proWithIAPPressabledDisabled,
    t.backgrounds.brand,
    t.itemsCenter,
    t.justifyCenter,
  ]);

  const benefitsToOffer = useMemo(() => {
    if (prefersIAP) {
      return benefits.slice(0, 2);
    }

    return benefits;
  }, [prefersIAP]);

  if (!subscribeWithUSDCDetails) {
    if (subscribeWithUSDCDetailsPending) {
      return <FullScreenLoadingIndicator />;
    }
    return (
      <View style={[t.flex1, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <Text2 size="base" color="tertiary">
          Error loading Farcaster Pro details. Please try again later.
        </Text2>
      </View>
    );
  }

  if (!farcasterProUSDCDetails) {
    return (
      <View style={[t.flex1, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <Text2 size="base" color="tertiary">
          Subscribing is temporarily unavailable. Please try again later.
        </Text2>
      </View>
    );
  }

  return (
    <>
      <View style={[t.flex1, t.flexCol, { gap: 14 }]}>
        <Text2 weight="bold" size="2xl" align="center" style={[t.p3]}>
          Get verified with Pro
        </Text2>
        <AvaterWithBadge />
        <ScrollView style={[t.mY4]}>
          <View style={[t.flexCol, { gap: 24 }]}>
            {benefitsToOffer.map((benefit) => (
              <Benefit key={benefit.title} {...benefit} />
            ))}
          </View>
        </ScrollView>
      </View>
      <View style={[t.flexCol, t.mB2, { gap: 8 }]}>
        {!prefersIAP && farcasterProUSDCPlans.length > 1 && (
          <View style={[t.flexRow, { gap: 8 }]}>
            {farcasterProUSDCPlans.map((plan) => {
              const selected =
                plan.billingInterval ===
                farcasterProUSDCDetails.billingInterval;
              return (
                <Pressable
                  key={plan.billingInterval}
                  onPress={() => handleSelectBillingInterval(plan)}
                  style={[
                    t.flex1,
                    t.p3,
                    t.roundedLg,
                    t.borderHairline,
                    {
                      backgroundColor: selected
                        ? t.colors.bgNewLightGray
                        : t.colors.bgDefault,
                      borderColor: selected
                        ? t.colors.text.brand
                        : t.colors.borderDefault,
                    },
                  ]}
                >
                  <Text2 size="base" weight="semibold" align="center">
                    {plan.billingInterval === 'monthly' ? 'Monthly' : 'Yearly'}
                  </Text2>
                  <Text2 size="sm" color="tertiary" align="center">
                    {`$${plan.priceInUsdc.toLocaleString()}/${getPlanIntervalLabel(plan)}`}
                  </Text2>
                </Pressable>
              );
            })}
          </View>
        )}
        {paymentCTA}
      </View>
      {showSubscribeWithUSDCSheet && farcasterProUSDCDetails && (
        <FarcasterProSubscribeWithTierRegistrySheet
          farcasterProUSDCDetails={farcasterProUSDCDetails}
          onDismiss={handleDismissSheet}
          onSuccess={handleContinue}
          source={source}
        />
      )}
    </>
  );
};

const FarcasterProConfirmation = ({
  onDone,
  source,
}: {
  onDone: () => void;
  source?: string;
}) => {
  const t = useTheme();
  const { trackEvent } = useTrackEvent();

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellConfirmationView, {
      source: source ?? 'profile',
    });
  }, [source, trackEvent]);

  return (
    <>
      <View style={[t.flex1, t.flexCol, { gap: 24 }]}>
        <AvaterWithBadge />
        <Text2 weight="bold" size="2xl" align="center" style={[t.pX5]}>
          Your Farcaster Pro subscription is now active!
        </Text2>
      </View>
      <View style={[t.flexCol, t.mB2]}>
        <AnimatedPressable onPress={onDone}>
          <View
            style={[
              t.backgrounds.brand,
              { borderRadius: 32 },
              t.justifyCenter,
              t.itemsCenter,
              { height: 48 },
            ]}
          >
            <Text2 size="lg" weight="semibold" color="light">
              Done
            </Text2>
          </View>
        </AnimatedPressable>
      </View>
    </>
  );
};

const FarcasterProUpsell = ({
  onClose,
  onConfirm,
  source,
}: {
  onClose?: () => void;
  onConfirm: () => void;
  source?: string;
}) => {
  const { trackEvent } = useTrackEvent();
  const t = useTheme();
  const { goBack } = useSharedNavigationContext();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<FarcasterProUpsellStep>('intro');
  const navigation = React.useContext(NavigationContext);

  React.useEffect(() => {
    navigation?.setOptions?.({
      gestureEnabled: step !== 'confirmation',
    });
  }, [navigation, step]);

  const handleClose = useCallback(async () => {
    onClose?.();
    await sleep(300);
    goBack();
  }, [goBack, onClose]);

  const handleDone = useCallback(async () => {
    trackEvent(AnalyticsEvent.FarcasterProUpsellConfirmationView, {
      source: source ?? 'profile',
    });
    onConfirm();
    await sleep(300);
    goBack();
  }, [goBack, onConfirm, source, trackEvent]);

  const handleContinue = useCallback(() => {
    if (step === 'intro') {
      setStep('confirmation');
    }
  }, [step]);

  const marginTop =
    Platform.OS === 'web' ? insets.top + (onClose ? 0 : 10) : 16;
  const marginBottom = Platform.OS === 'web' ? 12 : insets.bottom;

  return (
    <View style={[t.flex1, { marginBottom }]}>
      <View style={[t.flex1, { marginTop }]}>
        {onClose && (
          <View style={[t.flexRow, t.justifyStart, t.p2, { minHeight: 40 }]}>
            {step !== 'confirmation' && (
              <Pressable onPress={handleClose}>
                <Ionicons
                  name="chevron-back"
                  size={Platform.OS === 'web' ? 18 : 24}
                  color={t.colors.text.primary}
                />
              </Pressable>
            )}
          </View>
        )}
        <View style={[t.flex1, t.pX4, Platform.OS !== 'web' && t.pT3]}>
          <View style={[t.flex1, t.justifyBetween]}>
            {step === 'intro' && (
              <FarcasterProIntro onContinue={handleContinue} source={source} />
            )}
            {step === 'confirmation' && (
              <FarcasterProConfirmation onDone={handleDone} source={source} />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const AvaterWithBadge = () => {
  const t = useTheme();
  const currentUser = useCurrentUser();

  return (
    <View style={[t.flexCol, t.itemsCenter, t.justifyCenter, { gap: 8 }]}>
      <Avatar
        diameter={Platform.OS === 'web' ? 80 : 100}
        pfpUrl={currentUser?.pfp?.url}
        blockAnimated={true}
      />
      <View style={[t.flexRow, t.itemsCenter, t.justifyCenter, { gap: 4 }]}>
        <Text2 size="lg" align="center" weight="semibold">
          {resolveUsername({
            username: currentUser?.username,
            fid: currentUser?.fid,
          }).replace('@', '')}
        </Text2>
        <FarcasterProBadge size={22} />
      </View>
    </View>
  );
};

const Benefit = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const t = useTheme();

  return (
    <View style={[t.flexRow, { gap: 12 }]}>
      <CheckCircle2 size={24} color={t.colors.text.primary} />
      <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
        <Text2 size="base" weight="semibold">
          {title}
        </Text2>
        <Text2 size="base" color="tertiary">
          {description}
        </Text2>
      </View>
    </View>
  );
};

FarcasterProUpsell.displayName = 'FarcasterProUpsell';

export { FarcasterProUpsell };
