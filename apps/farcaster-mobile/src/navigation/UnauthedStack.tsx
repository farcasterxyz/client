import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC, useEffect } from 'react';
import { InteractionManager } from 'react-native';

import { headerLeftAligned } from '~/components/HeaderLeftAligned';
import { useRecoveryStore } from '~/contexts/RecoveryStoreProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { RecoveryStackNavigator } from '~/navigation/RecoveryStack';
import { UnauthedStackParamList } from '~/types';
import { consumePendingWalletRestore } from '~/utils/pendingWalletRestore';

import { DebugScreens } from './DebugScreens';

const UnauthedStack = createNativeStackNavigator<UnauthedStackParamList>();

const UnauthedStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const { recoveryInProgress } = useRecoveryStore();
  const { address } = useWallet();

  // After a post-logout restore (no-seed-phrase prompt), navigate to the
  // stashed destination once the unauthed stack has mounted.
  useEffect(() => {
    const handle = InteractionManager.runAfterInteractions(() => {
      consumePendingWalletRestore();
    });
    return () => handle.cancel();
  }, []);

  // If a recovery is in progress this will be the only view they are able to
  // see until they complete or cancel the recovery process.
  if (recoveryInProgress) {
    return <RecoveryStackNavigator />;
  }

  return (
    <UnauthedStack.Navigator
      screenOptions={{
        ...defaultStackScreenOptions,
        animation: 'none',

        // Onboarding listens to 'beforeRemove' to prevent the user from going
        // back / exiting onboarding. This option must be false to make this
        // work with @react-navigation/native-stack.
        //
        // @see https://reactnavigation.org/docs/preventing-going-back/#limitations
        gestureEnabled: false,
      }}
      initialRouteName={address ? 'Onboarding' : 'Landing'}
    >
      <UnauthedStack.Screen
        name="Landing"
        component={require('~/screens/Landing').LandingScreen}
        options={{ headerShown: false }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignIn"
        component={require('~/screens/OnboardingSignIn').OnboardingSignInScreen}
        options={{
          headerTitle: 'Sign in to an existing account',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignInWithEmail"
        component={
          require('~/screens/OnboardingSignInWithEmail')
            .OnboardingSignInWithEmailScreen
        }
        options={{
          headerTitle: 'Sign in with email',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="MagicLinkSignIn"
        component={require('~/screens/MagicLinkSignIn').MagicLinkSignInScreen}
        options={{ headerShown: false }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignInWithMobile"
        component={
          require('~/screens/OnboardingSignInWithMobile')
            .OnboardingSignInWithMobileScreen
        }
        options={{
          headerTitle: 'Pair with an existing device',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignInWithDesktop"
        component={
          require('~/screens/OnboardingSignInWithDesktop')
            .OnboardingSignInWithDesktopScreen
        }
        options={{
          headerTitle: 'Pair with desktop',
          animation: 'default',
        }}
      />
      {/* We add OnboardingSignInAnotherDevice to both the UnauthedStack and to CommonScreens. We do this so we can show the user an error message and instruct them to sign in if they are not. */}
      <UnauthedStack.Screen
        name="OnboardingSignInAnotherDevice"
        component={
          require('~/screens/OnboardingSignInAnotherDevice')
            .OnboardingSignInAnotherDeviceScreen
        }
        options={{
          headerTitle: 'Sign in another device',
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignInWithDesktopInitiate"
        component={
          require('~/screens/OnboardingSignInWithDesktopInitiate')
            .OnboardingSignInWithDesktopInitiateScreen
        }
        options={{
          headerShown: false,
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingSignInWithWalletInitiate"
        component={
          require('~/screens/OnboardingSignInWithWalletInitiate')
            .OnboardingSignInWithWalletInitiateScreen
        }
        options={{
          headerShown: false,
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingImportWallet"
        component={
          require('~/screens/OnboardingImportWallet')
            .OnboardingImportWalletScreen
        }
        options={{
          headerTitle: 'Enter your recovery phrase',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="OnboardingImportWalletHelp"
        component={
          require('~/screens/OnboardingImportWalletHelp')
            .OnboardingImportWalletHelpScreen
        }
        options={{
          headerTitle: 'How to find your recovery phrase',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        key="RecoveryInitiate"
        name="RecoveryInitiate"
        component={require('~/screens/RecoveryInitiate').RecoveryInitiateScreen}
        options={{
          headerTitle: 'Enter your email',
          header: headerLeftAligned({ cancelPopsToTop: false }),
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="RecoveryConfirm"
        component={require('~/screens/RecoveryConfirm').RecoveryConfirmScreen}
        options={{
          headerTitle: 'Check your email',
          header: headerLeftAligned({ cancelPopsToTop: false }),
        }}
      />
      <UnauthedStack.Screen
        name="RecoveryStart"
        component={require('~/screens/RecoveryStart').RecoveryStartScreen}
        options={{
          headerTitle: 'Account Recovery',
        }}
      />
      <UnauthedStack.Screen
        name="RecoveryNotFound"
        component={require('~/screens/RecoveryNotFound').RecoveryNotFoundScreen}
        options={{
          headerTitle: 'Account Recovery',
        }}
      />
      <UnauthedStack.Screen
        key="SignedKeyRequest"
        name="SignedKeyRequest"
        component={require('~/screens/SignedKeyRequest').SignedKeyRequestScreen}
        options={{
          headerTitle: 'Connect App',
        }}
      />
      <UnauthedStack.Screen
        name="WalletSignInAnotherDevice"
        component={
          require('~/screens/WalletSignInAnotherDevice')
            .WalletSignInAnotherDeviceScreen
        }
        options={{
          headerTitle: 'Connect wallet',
          animation: 'default',
        }}
      />
      <UnauthedStack.Screen
        name="Onboarding"
        component={
          require('~/screens/Onboarding/OnboardingScreen').OnboardingScreen
        }
        options={{ headerShown: false }}
      />
      {DebugScreens(UnauthedStack)}
    </UnauthedStack.Navigator>
  );
};

UnauthedStackNavigator.displayName = 'UnauthedStackNavigator';

export { UnauthedStackNavigator };
