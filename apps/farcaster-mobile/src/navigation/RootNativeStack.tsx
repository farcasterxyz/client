import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';

import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { RootNativeStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';
import { RootStack } from './RootStack';
import { UnauthedStackNavigator } from './UnauthedStack';

const NativeStack = createNativeStackNavigator<RootNativeStackParamList>();

const rootStackScreenOptions = { headerShown: false };

const RootNativeStack: React.FC = React.memo(() => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();

  const isSignedIn = useIsSignedIn();

  return (
    <NativeStack.Navigator screenOptions={defaultStackScreenOptions}>
      {isSignedIn ? (
        <>
          <NativeStack.Screen
            name="RootStack"
            component={RootStack}
            options={rootStackScreenOptions}
          />
          {/* ComposerAction screen removed */}
          <NativeStack.Screen
            name="Campaign"
            component={require('~/screens/Campaign').CampaignScreen}
            options={{
              headerShown: false,
              presentation: 'modal',
              gestureDirection: 'vertical',
              animationDuration: 150,
            }}
          />
          <NativeStack.Screen
            name="DraftCasts"
            component={require('~/screens/CreateCast').DraftCastsScreen}
            options={{
              presentation: 'modal',
              headerTitle: 'Drafts',
              gestureEnabled: true,
              animationDuration: 150,
            }}
          />
          <NativeStack.Screen
            name="NewUserFollowInstructions"
            getComponent={() =>
              require('~/screens/NewUserFollowInstructions')
                .NewUserFollowInstructionsScreen
            }
            options={{
              headerShown: false,
            }}
          />
          <NativeStack.Screen
            name="SecureModeSetup"
            getComponent={() =>
              require('~/screens/SecureMode/SecureModeSetupScreen')
                .SecureModeSetupScreen
            }
            options={{
              headerShown: false,
            }}
          />
          <NativeStack.Screen
            name="FarcasterProUpsell"
            getComponent={() =>
              require('~/screens/FarcasterPro').FarcasterProUpsellScreen
            }
            options={{
              headerShown: false,
              presentation: 'modal',
            }}
          />
          {CommonScreens(NativeStack)}
        </>
      ) : (
        <NativeStack.Screen
          name="UnauthedStack"
          component={UnauthedStackNavigator}
          options={{
            headerShown: false,
            animation: 'none',
          }}
        />
      )}
      <NativeStack.Group
        screenOptions={{
          presentation: 'modal',
        }}
      >
        <NativeStack.Screen
          name="SelectCountry"
          component={require('~/screens/SelectCountry').SelectCountryScreen}
          options={{
            headerTitle: 'Select country',
          }}
        />
        <NativeStack.Screen
          name="SelectCastAction"
          component={
            require('~/screens/SelectCastAction').SelectCastActionScreen
          }
          options={{
            headerTitle: 'Select action',
          }}
        />
      </NativeStack.Group>
      <NativeStack.Screen
        name="SecureModeVerifyCode"
        getComponent={() =>
          require('~/screens/SecureMode/SecureModeVerifyCodeScreen')
            .SecureModeVerifyCodeScreen
        }
        options={{
          headerShown: false,
        }}
      />
      <NativeStack.Screen
        key="PhoneVerificationStart"
        name="PhoneVerificationStart"
        getComponent={() =>
          require('~/screens/Quests/PhoneVerificationStart')
            .PhoneVerificationStartScreen
        }
        options={{
          headerTitle: 'Verify phone',
        }}
      />
      <NativeStack.Screen
        key="PhoneVerificationCode"
        name="PhoneVerificationCode"
        getComponent={() =>
          require('~/screens/Quests/PhoneVerificationCode')
            .PhoneVerificationCodeScreen
        }
        options={{
          headerTitle: 'Verify phone',
        }}
      />
    </NativeStack.Navigator>
  );
});

export { RootNativeStack };
