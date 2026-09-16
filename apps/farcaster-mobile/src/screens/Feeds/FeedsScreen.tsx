import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDefaultFeedPreference,
  ApiReplyFilterLevelPreference,
} from 'farcaster-client-data';
import {
  usePurgeHighlightedChannels,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { ScrollView, View } from 'react-native';

import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { SelectOne } from '~/components/settings/SelectOne';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type FeedsScreenProps = NativeStackScreenProps<CommonStackParamList, 'Feeds'>;

const FeedsScreen = buildScreen<FeedsScreenProps>({ name: 'Feeds' }, () => {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const { data } = useUserPreferences();

  const setUserPreferences = useSetUserPreferences();

  const purgeFeed = usePurgeHighlightedChannels();

  const defaultFeedUserPreference = React.useMemo(() => {
    return data.result.preferences.defaultFeed;
  }, [data?.result.preferences]);

  const defaultReplyFilterLevelPreference = React.useMemo(() => {
    return data.result.preferences.replyFilterLevel;
  }, [data?.result.preferences]);

  // Having a controlled value like this helps the switch value
  // not to flicker when changing.
  const [controlledFeedValue, setControlledFeedValue] =
    React.useState<ApiDefaultFeedPreference>(
      defaultFeedUserPreference || 'home',
    );
  const [controlledReplyFilterValue, setControlledReplyFilterValue] =
    React.useState<ApiReplyFilterLevelPreference>(
      defaultReplyFilterLevelPreference || 'medium',
    );

  const toast = useRootToast();

  const onFeedUserPreferenceValueChange = React.useCallback(
    async (value: ApiDefaultFeedPreference) => {
      setControlledFeedValue(value);

      trackEvent(AnalyticsEvent.SetDefaultFeed, { type: value });

      try {
        await setUserPreferences({
          preferences: { defaultFeed: value },
        });

        purgeFeed();

        toast.show('Restart your app to see your updated default feed!');
      } catch (error) {
        trackError(error);
      }
    },
    [purgeFeed, setUserPreferences, toast, trackEvent],
  );

  const onReplyUserFilterPreferenceValueChange = React.useCallback(
    async (value: ApiReplyFilterLevelPreference) => {
      setControlledReplyFilterValue(value);

      trackEvent(AnalyticsEvent.SetReplyFilterLevel, { type: value });

      try {
        await setUserPreferences({
          preferences: { replyFilterLevel: value },
        });
      } catch (error) {
        trackError(error);
      }
    },
    [setUserPreferences, trackEvent],
  );

  return (
    <ScrollView style={[t.hFull]} contentContainerStyle={[t.p3]}>
      <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
        <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
          Selected feed
        </Text>
      </View>
      <Text style={[t.textSm, t.texts.secondary, t.mB3]}>
        This feed will appear first whenever you open Farcaster.
      </Text>
      <View
        style={[
          t.bgDefault,
          t.flex,
          t.flexRow,
          t.wFull,
          t.itemsCenter,
          t.roundedLg,
          t.borderHairline,
          t.borderDefault,
          t.mB2,
          t.mT2,
        ]}
      >
        <SelectOne
          style={[t.flexGrow]}
          options={[
            { value: 'home', title: 'Home' },
            {
              value: 'following',
              title: 'Following',
            },
          ]}
          value={controlledFeedValue}
          onChange={onFeedUserPreferenceValueChange}
          hideDividerOnLastOption
        />
      </View>
      <Divider marginVertical="normal" />
      <View style={[t.flexRow, t.itemsCenter, t.mB2, t.justifyBetween]}>
        <Text style={[t.texts.primary, t.textBase, t.fontBold]}>
          Reply filtering
        </Text>
      </View>
      <View
        style={[
          t.bgDefault,
          t.flex,
          t.flexRow,
          t.wFull,
          t.itemsCenter,
          t.roundedLg,
          t.borderHairline,
          t.borderDefault,
          t.mB2,
          t.mT2,
        ]}
      >
        <SelectOne
          style={[t.flexGrow]}
          options={[
            {
              value: 'high',
              title: 'High',
              subtitle: "Show replies I'm likely to be interested in.",
            },
            {
              value: 'medium',
              title: 'Medium',
              subtitle: 'Show replies from most users.',
            },
            {
              value: 'low',
              title: 'Low',
              subtitle: 'Show replies from all users.',
            },
          ]}
          value={controlledReplyFilterValue}
          onChange={onReplyUserFilterPreferenceValueChange}
          hideDividerOnLastOption
        />
      </View>
    </ScrollView>
  );
});

FeedsScreen.displayName = 'FeedsScreen';

export { FeedsScreen };
