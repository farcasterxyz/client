import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useDismissNewUserFollowInstructions,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useReplace } from '~/hooks/navigation/useReplace';
import { RootNativeStackParamList } from '~/types';

import imageDark from './FollowInstructionsDark.webp';
import imageLight from './FollowInstructionsLight.webp';

type NewUserFollowInstructionsScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'NewUserFollowInstructions'
>;

const NewUserFollowInstructionsScreen =
  buildScreen<NewUserFollowInstructionsScreenProps>(
    {
      name: 'NewUserFollowInstructions',
      insetTop: true,
      insetBottom: true,
    },
    () => {
      return <NewUserFollowInstructionsContent />;
    },
  );
NewUserFollowInstructionsScreen.displayName = 'NewUserFollowInstructionsScreen';

const NewUserFollowInstructionsContent: FC = memo(() => {
  const t = useTheme();
  const replace = useReplace();
  const dismissNewUserFollowInstructions =
    useDismissNewUserFollowInstructions();
  const { trackEvent } = useTrackEvent();
  const { newUserStatus } = useUserAppContext();

  useFocusEffect(
    React.useCallback(() => {
      trackEvent(AnalyticsEvent.ViewNuxFollowInstructions);
    }, [trackEvent]),
  );

  const onOk = useCallback(async () => {
    try {
      trackEvent(AnalyticsEvent.DismissNuxFollowInstructions);
      await dismissNewUserFollowInstructions();
    } catch (e) {
      // Ignore error and go to feed -> user will likely have to see + dismiss again
    }

    replace('Drawer', {});
  }, [dismissNewUserFollowInstructions, replace, trackEvent]);

  if (
    !newUserStatus ||
    newUserStatus.targetFollowingCount === undefined ||
    newUserStatus.targetFollowingCount === 0
  ) {
    return null;
  }

  return (
    <View style={[t.flex, t.flexCol, t.hFull, t.pX4, t.pB3]}>
      <View
        style={[t.flex1, t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}
      >
        <Image
          source={t.dark ? imageDark : imageLight}
          style={[t.wFull, { aspectRatio: 682 / 332 }]}
        />
        <Text style={[t.mT2, t.texts.primary, t.text2xl, t.textCenter, t.pX4]}>
          Follow {newUserStatus.targetFollowingCount} users
        </Text>
        <Text
          style={[t.mT4, t.texts.secondary, t.textBase, t.textCenter, t.pX4]}
        >
          Your feed will get personalized as you follow people on the app.
        </Text>
      </View>
      <ButtonV2 title="Continue" onPress={onOk} />
    </View>
  );
});

export { NewUserFollowInstructionsScreen };
