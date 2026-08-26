import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { FC } from 'react';

import { useDefaultStackScreenOptions } from '~/hooks/navigation/useDefaultStackScreenOptions';
import { useScreenFreezeOptions } from '~/hooks/navigation/useScreenFreezeOptions';
import { PlaintextDirectCastsStackParamList } from '~/types';

import { CommonScreens } from './CommonScreens';

const PlaintextDirectCastsStack =
  createNativeStackNavigator<PlaintextDirectCastsStackParamList>();

const PlaintextDirectCastsStackNavigator: FC = () => {
  const defaultStackScreenOptions = useDefaultStackScreenOptions();
  const screenFreezeOptions = useScreenFreezeOptions();

  return (
    <PlaintextDirectCastsStack.Navigator
      screenOptions={{
        ...defaultStackScreenOptions,

        // Swipe replies are not working for this stack if full screen gesture is enabled.
        fullScreenGestureEnabled: false,
      }}
    >
      <PlaintextDirectCastsStack.Screen
        name="PlaintextDirectCasts"
        getComponent={() =>
          require('~/screens/PlaintextDirectCasts/PlaintextDirectCastsScreen')
            .PlaintextDirectCastsScreen
        }
        options={{
          headerShown: false,
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between inbox and convos being marked unread.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsArchived"
        getComponent={() =>
          require('~/screens/PlaintextDirectCasts/DirectCastsArchivedScreen')
            .DirectCastsArchivedScreen
        }
        options={{
          headerTitle: 'Archived',
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between inbox and convos being marked unread.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsRequests"
        getComponent={() =>
          require('~/screens/PlaintextDirectCasts/DirectCastsRequestsScreen')
            .DirectCastsRequestsScreen
        }
        options={{
          headerShown: false,
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between inbox and convos being marked unread.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="PlaintextDirectCastsCreateConversation"
        getComponent={() =>
          require('~/screens/PlaintextDirectCastsCreateConversation/PlaintextDirectCastsCreateConversationScreen')
            .PlaintextDirectCastsCreateConversationScreen
        }
        options={{
          headerTitle: 'New Direct Cast',
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="PlaintextDirectCastsCreateConversationAddMembers"
        getComponent={() =>
          require('~/screens/PlaintextDirectCastsCreateConversation/PlaintextDirectCastsCreateConversationAddMembersScreen')
            .PlaintextDirectCastsCreateConversationAddMembersScreen
        }
        options={{
          presentation: 'modal',
          headerTitle: 'Add Members',
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsGroupEdit"
        getComponent={() =>
          require('~/screens/DirectCastsGroupEdit/DirectCastsGroupEditScreen')
            .DirectCastsGroupEditScreen
        }
        options={{
          headerTitle: 'Edit details',
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsGroupInviteLink"
        getComponent={() =>
          require('~/screens/DirectCastsGroupInviteLink/DirectCastsGroupInviteLinkScreen')
            .DirectCastsGroupInviteLinkScreen
        }
        options={{
          headerTitle: 'Invite link',
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsGroupInvite"
        getComponent={() =>
          require('~/screens/DirectCastsGroupInvite/DirectCastsGroupInviteScreen')
            .DirectCastsGroupInviteScreen
        }
        options={{
          presentation: 'fullScreenModal',
          headerTitle: 'Invite to group',
        }}
      />

      <PlaintextDirectCastsStack.Screen
        name="DirectCastsConversationDetailsScreen"
        getComponent={() =>
          require('~/screens/DirectCastsConversationDetails/DirectCastsConversationDetailsScreen')
            .DirectCastsConversationDetailsScreen
        }
        options={{
          headerTitle: 'Details',
          gestureEnabled: true,
          // Disabling screen freezes selectively on certain screens only for iOS.
          // This is to have a better state change between group info updates and info screen.
          freezeOnBlur: screenFreezeOptions.freezeOnBlur,
        }}
      />
      <PlaintextDirectCastsStack.Screen
        name="DirectCastsIntent"
        getComponent={() =>
          require('~/screens/PlaintextDirectCastsConversation/DirectCastsIntentScreen')
            .DirectCastsIntentScreen
        }
        options={{
          headerShown: false,
        }}
      />
      {CommonScreens(PlaintextDirectCastsStack)}
    </PlaintextDirectCastsStack.Navigator>
  );
};

PlaintextDirectCastsStackNavigator.displayName =
  'PlaintextDirectCastsStackNavigator';

export { PlaintextDirectCastsStackNavigator };
