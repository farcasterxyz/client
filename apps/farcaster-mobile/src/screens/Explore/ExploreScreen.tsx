import { useFocusEffect } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PulseFeed } from '~/components/ExploreFeed/PulseFeed';
import { FloatingComposerButton } from '~/components/FloatingComposerButton';
import { FloatingSearch } from '~/components/FloatingSearch/FloatingSearch';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { ExploreStackParamList } from '~/types';
import { setExploreTabShouldBeNudged } from '~/utils/FastStorageUtils';

export interface SearchTabProps {
  q: string;
  enabled: boolean;
}

const ExploreScreenName = 'Explore';

type ExploreScreenProps = NativeStackScreenProps<
  ExploreStackParamList,
  typeof ExploreScreenName
>;

const ExploreScreen = buildScreen<ExploreScreenProps>(
  { name: ExploreScreenName, insetTop: false },
  ({ route: { params }, navigation }) => (
    <ExploreScreenContent
      navigation={navigation}
      autoFocus={params?.autoFocus}
    />
  ),
);

ExploreScreen.displayName = 'SearchScreen';

const ExploreScreenContent: React.FC<{
  autoFocus?: boolean;
  navigation: NativeStackNavigationProp<
    ExploreStackParamList,
    'Explore',
    undefined
  >;
}> = React.memo(({ navigation, autoFocus }) => {
  const t = useTheme();

  useFocusEffect(
    React.useCallback(() => {
      // Tab visited: no longer need to be nudging manually
      setExploreTabShouldBeNudged({ nudged: false });
    }, []),
  );

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        t.hFull,
        {
          paddingTop: insets.top,
          backgroundColor: t.colors.background.default,
        },
      ]}
    >
      <PulseFeed />
      <View style={[t.absolute, t.bottom0, t.right0]}>
        <FloatingComposerButton />
      </View>
      <FloatingSearch
        source="pulse"
        autoOpen={autoFocus}
        onAutoOpenHandled={() => navigation.setParams({ autoFocus: false })}
      />
    </View>
  );
});

ExploreScreenContent.displayName = 'ExploreScreenContent';

export { ExploreScreen };
