import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiOnboardingInterestCategory,
  ApiOnboardingInterestCategoryInterests,
  ApiOnboardingInterestCategorySelections,
} from 'farcaster-client-data';
import {
  useOnboardingInterestCategories,
  useSetOnboardingInterestCategory,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  CleanedTextStyle,
  Typography,
} from 'farcaster-expo';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useToast } from 'react-native-toast-notifications';

import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { setExploreTabShouldBeNudged } from '~/utils/FastStorageUtils';

import {
  supportedOnboardingInterestCategories,
  supportedOnboardingInterestCategoriesQueryString,
} from './constants';
import { Onboarding, trackOnboardingError } from './Onboarding';
import { OnboardingPortal } from './OnboardingPortal';
import { useOnboardingStateForOnboarding } from './StateProvider';

const AnimatedTypography = Animated.createAnimatedComponent(Typography);

const supportedCategoriesSet = new Set<ApiOnboardingInterestCategory>(
  supportedOnboardingInterestCategories,
);

type SupportedOnboardingInterestCategory =
  (typeof supportedOnboardingInterestCategories)[number];

const interestTitleMapping: Record<
  SupportedOnboardingInterestCategory,
  string
> = {
  general: 'What are you interested in?',
};

const ONBOARDING_INTEREST_API_TIMEOUT_MS = 20_000;

// Races a promise against a timeout so that slow/hanging network requests
// surface as a visible error to the user instead of leaving the Continue
// button stuck in the loading state indefinitely.
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

function InterestsSection({
  data,
  onSelectInterest,
  selections,
}: {
  data: ApiOnboardingInterestCategoryInterests;
  onSelectInterest: (
    category: SupportedOnboardingInterestCategory,
    interest: string,
  ) => void;
  selections: Record<string, boolean>;
}) {
  const t = useTheme();
  if (!supportedCategoriesSet.has(data.type)) {
    return null;
  }
  const title =
    interestTitleMapping[data.type as SupportedOnboardingInterestCategory];

  return (
    <View style={[t.flex, t.flexCol, t.gap4]}>
      <Typography label="Body/Large/Strong" color="primary">
        {title}
      </Typography>
      <View
        style={[
          t.flex,
          t.flexRow,
          t.justifyEvenly,
          { gap: 12 },
          t.flexWrap,
          t.justifyStart,
        ]}
      >
        {data.interests.map((interest) => (
          <InterestPill
            interest={interest}
            onPress={() =>
              onSelectInterest(
                data.type as SupportedOnboardingInterestCategory,
                interest.key,
              )
            }
            selected={selections[interest.key]}
            key={interest.key}
          />
        ))}
      </View>
    </View>
  );
}

function OnboardingStepSelectInterests() {
  const t = useTheme();
  const toast = useToast();

  const { trackEvent } = useAnalytics();

  const setOnboardingInterestCategory = useSetOnboardingInterestCategory();
  const { data: onboardingInterestCategories } =
    useOnboardingInterestCategories({
      categories: supportedOnboardingInterestCategoriesQueryString,
    });
  const [selections, setSelections] = React.useState<
    Record<SupportedOnboardingInterestCategory, Record<string, boolean>>
  >({
    general: {},
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { fullRefresh, onboardingState } = useOnboardingStateForOnboarding();

  const onContinuePress = React.useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    const mappedSelections: ApiOnboardingInterestCategorySelections[] = [];
    for (const category of supportedOnboardingInterestCategories) {
      const interests: string[] = [];
      for (const interest of Object.keys(selections[category])) {
        if (selections[category][interest]) {
          interests.push(interest);
        }
      }
      mappedSelections.push({
        category,
        interests,
      });
    }

    trackEvent(AnalyticsEvent.OnboardingSelectInterests, {});
    DdRum.addAction(RumActionType.CUSTOM, 'onboarding:select-interests', {
      fid: onboardingState.user?.fid || -1,
      email: onboardingState.email || '<missing-onboarding-email>',
    });

    setIsSubmitting(true);
    try {
      // Await the interests API call so that `fullRefresh` below reflects
      // the server-side state correctly. Previously this was fire-and-forget,
      // which on slow networks caused `fullRefresh` to race ahead of the
      // server update and leave the user stuck on this screen.
      //
      // Each network call is wrapped in `withTimeout` so that a hanging
      // request surfaces a visible error instead of leaving the Continue
      // button stuck in the loading state indefinitely.
      await withTimeout(
        setOnboardingInterestCategory({ selections: mappedSelections }),
        ONBOARDING_INTEREST_API_TIMEOUT_MS,
        'setOnboardingInterestCategory',
      );

      trackEvent(AnalyticsEvent.OnboardingCompletedV2, {});
      DdRum.addAction(RumActionType.CUSTOM, 'onboarding:completed', {
        fid: onboardingState.user?.fid || -1,
        email: onboardingState.email || '<missing-onboarding-email>',
      });

      setExploreTabShouldBeNudged({ nudged: true });

      await withTimeout(
        fullRefresh(),
        ONBOARDING_INTEREST_API_TIMEOUT_MS,
        'fullRefresh',
      );
    } catch (error) {
      trackOnboardingError(error, 'select_interests');
      DdRum.addAction(RumActionType.CUSTOM, 'onboarding:error', {
        error,
        fid: onboardingState.user?.fid || -1,
        email: onboardingState.email || '<missing-onboarding-email>',
      });
      toast.show(
        'Something went wrong. Please check your connection and try again.',
        {
          type: 'danger',
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    setOnboardingInterestCategory,
    selections,
    trackEvent,
    fullRefresh,
    onboardingState.user?.fid,
    onboardingState.email,
    toast,
  ]);

  const onSelectInterest = React.useCallback(
    (category: SupportedOnboardingInterestCategory, interest: string) => {
      setSelections((prev) => {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [interest]: !prev[category][interest],
          },
        };
      });
    },
    [],
  );

  return (
    <Onboarding.Layout
      hideIcons
      onBackPress={undefined}
      onSkipPress={undefined}
    >
      <Onboarding.Title>Personalize your experience</Onboarding.Title>
      <Onboarding.Text>
        We’ll customize Farcaster to your interests. Pick any that apply, or
        continue to skip.
      </Onboarding.Text>
      <View style={[t.flex, t.flexCol, t.mT4, t.gap6]}>
        {onboardingInterestCategories.result.categories.map((category) => (
          <InterestsSection
            key={category.type}
            data={category}
            onSelectInterest={onSelectInterest}
            selections={
              selections[category.type as SupportedOnboardingInterestCategory]
            }
          />
        ))}
      </View>
      <OnboardingPortal.Portal>
        <Onboarding.Button
          onPress={onContinuePress}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          Continue
        </Onboarding.Button>
      </OnboardingPortal.Portal>
    </Onboarding.Layout>
  );
}

function InterestPill({
  interest,
  onPress,
  selected,
}: {
  interest: {
    key: string;
    label: string;
  };
  onPress: () => void;
  selected: boolean;
}) {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 300 });
  }, [progress, selected]);

  const onPressWrapped = React.useCallback(() => {
    triggerImpactAsync();
    onPress();
  }, [triggerImpactAsync, onPress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [t.colors.background.default, t.colors.background.brandLight],
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        [t.colors.border.primary, t.colors.background.brand],
      ),
    };
  });

  const animatedTypographyStyle = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        progress.value,
        [0, 1],
        [t.colors.text.secondary, t.colors.text.brand],
      ),
    };
  });

  return (
    <AnimatedPressable onPress={onPressWrapped}>
      <Animated.View
        style={[animatedStyle, t.roundedFull, t.border, t.pX3, t.pY2]}
      >
        <AnimatedTypography
          label="Medium/Base"
          color="secondary"
          style={animatedTypographyStyle as CleanedTextStyle}
        >
          {interest.label}
        </AnimatedTypography>
      </Animated.View>
    </AnimatedPressable>
  );
}

export { OnboardingStepSelectInterests };
