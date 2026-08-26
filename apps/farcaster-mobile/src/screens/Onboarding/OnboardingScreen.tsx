import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { LayoutAnimationConfig } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingPortal } from '~/components/Onboarding/OnboardingPortal';
import { OnboardingStepEmail } from '~/components/Onboarding/OnboardingStepEmail';
import { OnboardingStepInviteCode } from '~/components/Onboarding/OnboardingStepInviteCode';
import { OnboardingStepPasskeys } from '~/components/Onboarding/OnboardingStepPasskeys';
import { OnboardingStepPayIAP } from '~/components/Onboarding/OnboardingStepPayIAP';
import { OnboardingStepProfile } from '~/components/Onboarding/OnboardingStepProfile';
import { OnboardingStepSecureRecovery } from '~/components/Onboarding/OnboardingStepSecureRecovery';
import { OnboardingStepSelectInterests } from '~/components/Onboarding/OnboardingStepSelectInterests';
import { OnboardingStepUsername } from '~/components/Onboarding/OnboardingStepUsername';
import { OnboardingStepVerifyEmail } from '~/components/Onboarding/OnboardingStepVerifyEmailCode';
import { OnboardingStepVerifyingX } from '~/components/Onboarding/OnboardingStepVerifyingX';
import { OnboardingStepVerifyX } from '~/components/Onboarding/OnboardingStepVerifyX';
import { OnboardingStateProvider } from '~/components/Onboarding/StateProvider';
import {
  OnboardingStepsProvider,
  useOnboardingSteps,
} from '~/components/Onboarding/StepsProvider';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useSplash } from '~/contexts/SplashProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContextGate } from '~/hooks/useUserAppContextGate';
import { UnauthedStackParamList } from '~/types';

function useRUMLogging({
  currentOnboardingEmail,
  currentOnboardingStep,
}: {
  currentOnboardingEmail: string | undefined;
  currentOnboardingStep: string;
}) {
  const prevViewKey = React.useRef<string | null>(null);
  const { onAppInitialized, isAppInitialized } = useSplash();

  React.useEffect(() => {
    if (!isAppInitialized) {
      onAppInitialized();
    }
  }, [isAppInitialized, onAppInitialized]);

  React.useEffect(() => {
    const viewKey = `onboarding-${currentOnboardingStep}`;

    if (prevViewKey.current && prevViewKey.current !== viewKey) {
      DdRum.addAction(RumActionType.CUSTOM, 'step_hidden', {
        step: prevViewKey.current,
        email: currentOnboardingEmail,
      });
      DdRum.stopView(prevViewKey.current);
    }

    DdRum.startView(viewKey, `Onboarding: ${currentOnboardingStep}`);
    DdRum.addAction(RumActionType.CUSTOM, 'step_visible', {
      step: currentOnboardingStep,
      email: currentOnboardingEmail,
    });

    prevViewKey.current = viewKey;
  }, [currentOnboardingEmail, currentOnboardingStep]);

  React.useEffect(() => {
    return () => {
      if (prevViewKey.current) {
        DdRum.addAction(RumActionType.CUSTOM, 'step_hidden', {
          step: prevViewKey.current,
        });
        DdRum.stopView(prevViewKey.current);
      }
    };
  }, []);
}

type OnboardingScreenProps = NativeStackScreenProps<
  UnauthedStackParamList,
  'Onboarding'
>;

const OnboardingScreen = buildScreen<OnboardingScreenProps>(
  {
    name: 'Onboarding',
    avoidKeyboard: false,
    insetTop: true,
    insetBottom: false,
  },
  () => {
    return (
      <OnboardingStateProvider>
        <OnboardingPortal.Provider>
          <OnboardingStepsProvider>
            <OnboardingShell />
          </OnboardingStepsProvider>
        </OnboardingPortal.Provider>
      </OnboardingStateProvider>
    );
  },
);

function Container({ children }: { children: React.ReactNode }) {
  return (
    <LayoutAnimationConfig skipEntering={true} skipExiting={true}>
      {children}
    </LayoutAnimationConfig>
  );
}

function OnboardingShell() {
  const t = useTheme();

  const [state] = useOnboardingSteps();

  const { trackEvent } = useAnalytics();

  const { checkUserAppContextGate } = useUserAppContextGate();

  const step = React.useMemo(() => {
    const isOnboardingEnabled =
      checkUserAppContextGate('onboarding-trading').value;
    switch (state.currentStep) {
      case 'Email':
        return <OnboardingStepEmail />;
      case 'VerifyEmailCode':
        return <OnboardingStepVerifyEmail />;
      case 'VerifyWithX':
        return <OnboardingStepVerifyX />;
      case 'VerifyingX':
        return <OnboardingStepVerifyingX />;
      case 'PayWithIAP':
        return <OnboardingStepPayIAP />;
      case 'UseInviteCode':
        return <OnboardingStepInviteCode />;
      case 'ChooseUsername':
        return <OnboardingStepUsername />;
      case 'SecureRecovery':
        return <OnboardingStepSecureRecovery />;
      case 'Passkeys':
        return <OnboardingStepPasskeys />;
      case 'SetupProfile':
        return <OnboardingStepProfile />;
      case 'SelectInterests':
        // Hiding screens that mention trading
        if (isOnboardingEnabled) {
          return <OnboardingStepSelectInterests />;
        }
        return <OnboardingStepProfile />;
      default:
        throw new Error('Onboarding step not implemented');
    }
  }, [state.currentStep, checkUserAppContextGate]);

  const { bottom: safeAreaBottom } = useSafeAreaInsets();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ShowOnboardingStep, {
        step: state.currentStep,
        version: 4,
      });
    }, [state.currentStep, trackEvent]),
  );

  useRUMLogging({
    currentOnboardingStep: state.currentStep,
    currentOnboardingEmail: state.onboardingEmail,
  });

  return (
    <View style={[t.flex1]}>
      <Container>{step}</Container>
      <KeyboardStickyView offset={{ opened: -10, closed: -safeAreaBottom }}>
        <Animated.View style={[t.bgDefault, t.pT2]}>
          <View style={[t.wFull, t.flexCol, t.pX5, { gap: 12 }]}>
            <OnboardingPortal.Outlet />
          </View>
        </Animated.View>
      </KeyboardStickyView>
    </View>
  );
}

OnboardingScreen.displayName = 'OnboardingScreen';

export { OnboardingScreen };
