import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Updates from 'expo-updates';
import {
  buildFeedItemsKey,
  useFarcasterApiClient,
} from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DebugFeedScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugFeed'
>;

const DebugFeedScreen = buildScreen<DebugFeedScreenProps>(
  { name: 'DebugFeed' },
  () => {
    const t = useTheme();
    const toast = useToast();
    const queryClient = useQueryClient();
    const { apiClient } = useFarcasterApiClient();

    return (
      <ScrollView contentContainerStyle={[t.p4, t.gap4]}>
        <View style={[t.gap2]}>
          <AtomsButton
            size="l"
            onPress={async () => {
              Alert.alert(
                'You will unfollow everybody',
                'Resetting to new user experience will make you unfollow all currently followed users',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Unfollow and reset',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await apiClient.resetToNewUserExperience();

                        Alert.alert('Success', 'The app will now reload', [
                          {
                            text: 'OK',
                            onPress: async () => {
                              try {
                                await Updates.reloadAsync();
                              } catch (error) {
                                Alert.alert('Error reloading', `${error}`);
                              }
                            },
                          },
                        ]);
                      } catch (error) {
                        Alert.alert('Error resetting', `${error}`);
                      }
                    },
                  },
                ],
              );
            }}
          >
            Reset to new user experience
          </AtomsButton>
          <AtomsButton
            size="l"
            onPress={() => {
              const homeFeedData = queryClient.getQueryData(
                buildFeedItemsKey({ feedKey: 'home' }),
              );
              Clipboard.setStringAsync(JSON.stringify(homeFeedData, null, 2));
              toast.show('Copied feed JSON to clipboard', { placement: 'top' });
            }}
          >
            Copy Home feed JSON
          </AtomsButton>
        </View>
      </ScrollView>
    );
  },
);

DebugFeedScreen.displayName = 'DebugFeedScreen';

export { DebugFeedScreen };
