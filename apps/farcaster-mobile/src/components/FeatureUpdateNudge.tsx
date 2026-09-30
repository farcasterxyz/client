import { Octicons } from '@expo/vector-icons';
import { openBrowserAsync } from 'expo-web-browser';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import {
  dismissedFeedUpdatesDrawerNudge,
  setDismissedFeedUpdatesDrawerNudge,
} from '~/utils/FastStorageUtils';

import { Text } from './Text';
import { TextWithPress } from './TextWithPress';

type NudgeType = 'home-feed-updates';

type FeatureUpdateNudgeProps = {
  nudge: NudgeType;
};

const FeatureUpdateNudge: React.FC<FeatureUpdateNudgeProps> = React.memo(
  ({ nudge }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const [dismissedNudge, setDismissedNudge] = React.useState(false);

    const title = React.useMemo(() => {
      switch (nudge) {
        case 'home-feed-updates':
          return '';
        default:
          return undefined;
      }
    }, [nudge]);

    const learnMoreText = React.useMemo(() => {
      switch (nudge) {
        case 'home-feed-updates':
          return 'Learn about home updates';
        default:
          return undefined;
      }
    }, [nudge]);

    const learnMoreTarget = React.useMemo(() => {
      switch (nudge) {
        case 'home-feed-updates':
          return getNotionLinkTarget({ to: 'home-feed-updates' });
        default:
          return undefined;
      }
    }, [nudge]);

    const updateDimisssed = React.useCallback(() => {
      switch (nudge) {
        case 'home-feed-updates':
          setDismissedFeedUpdatesDrawerNudge({ dismissed: true });
          break;
        default:
          break;
      }
    }, [nudge]);

    const checkAlreadyDismissed = React.useCallback(() => {
      switch (nudge) {
        case 'home-feed-updates':
          return dismissedFeedUpdatesDrawerNudge();
        default:
          return false;
      }
    }, [nudge]);

    const onDismissChannelsUpdateNudge = React.useCallback(() => {
      triggerImpactAsync();

      setDismissedNudge(true);

      updateDimisssed();
    }, [triggerImpactAsync, updateDimisssed]);

    const onLearnMorePress = React.useCallback(() => {
      if (typeof learnMoreTarget !== 'undefined') {
        openBrowserAsync(learnMoreTarget);
      }

      updateDimisssed();
    }, [learnMoreTarget, updateDimisssed]);

    const shouldHideChannelUpdatesNudge = React.useMemo(() => {
      return checkAlreadyDismissed() || dismissedNudge;
    }, [checkAlreadyDismissed, dismissedNudge]);

    if (shouldHideChannelUpdatesNudge) {
      return null;
    }

    return (
      <View style={[t.flex, t.pX4, t.wFull]}>
        <View
          style={[
            t.flexCol,
            t.flex,
            t.roundedLg,
            t.p3,
            { gap: 4 },
            t.backgrounds.secondary,
          ]}
        >
          <View
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              t.wFull,
            ]}
          >
            <Text style={[t.texts.primary]}>
              {title}
              <TextWithPress
                style={[t.texts.brand, t.fontSemibold]}
                onPress={onLearnMorePress}
              >
                {learnMoreText}
              </TextWithPress>
            </Text>
            <Octicons
              name="x"
              size={16}
              style={[t.texts.primary]}
              onPress={onDismissChannelsUpdateNudge}
            />
          </View>
        </View>
      </View>
    );
  },
);

FeatureUpdateNudge.displayName = 'FeatureUpdateNudge';

export { FeatureUpdateNudge };
