import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiLeastInteractedWithFollowingSummary } from 'farcaster-client-data';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text } from '~/components/Text';
import { UnfollowLeastInteractedWithFollowingButton } from '~/components/UnfollowLeastInteractedWithFollowingButton';
import { defaultThumbnailDiameter } from '~/constants/Images';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type LeastInteractedWithFollowingSummaryProps = {
  summary: ApiLeastInteractedWithFollowingSummary;
};

const LeastInteractedWithFollowingSummary: React.FC<
  LeastInteractedWithFollowingSummaryProps
> = ({ summary }) => {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const push = usePush();

  const components = React.useMemo(() => {
    const { users, count } = summary;

    if (count === 0) {
      return undefined;
    }

    if (count === 1) {
      return {
        avatars: <Avatar pfpUrl={users[0].pfp?.url} />,
        text: `${users[0].displayName}`,
      };
    }
    if (count === 2) {
      return {
        avatars: (
          <>
            <Avatar pfpUrl={users[0].pfp?.url} diameter={32} />
            <Avatar
              pfpUrl={users[1].pfp?.url}
              diameter={32}
              style={[t.mL3, { marginTop: -16 }]}
            />
          </>
        ),
        text: `${users[0].displayName} and ${users[1].displayName}`,
      };
    }
    return {
      avatars: (
        <>
          <Avatar pfpUrl={users[0].pfp?.url} diameter={32} />
          <Avatar
            pfpUrl={users[1].pfp?.url}
            diameter={32}
            style={[t.mL3, { marginTop: -16 }]}
          />
        </>
      ),
      text: `${users[0].displayName} and ${count - 1} others`,
    };
  }, [summary, t.mL3]);

  const onSummaryPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickLeastInteractedWithFollowing, undefined);

    push('LeastInteractedWithFollowing', {});
  }, [push, trackEvent]);

  if (typeof components === 'undefined') {
    return null;
  }

  return (
    <Pressable
      style={[
        t.flex,
        t.flexRow,
        t.p4,
        t.itemsCenter,
        t.justifyStart,
        t.borderBHairline,
        t.borderDefault,
      ]}
      onPress={onSummaryPress}
    >
      <View
        style={[
          t.flex,
          t.itemsStart,
          t.justifyCenter,
          t.relative,
          {
            paddingLeft: 2,
            width: defaultThumbnailDiameter,
            height: defaultThumbnailDiameter,
          },
        ]}
      >
        {components.avatars}
      </View>
      <View
        style={[
          t.flex1,
          t.flex,
          t.flexRow,
          t.mL2,
          t.justifyBetween,
          t.flexGrow,
        ]}
      >
        <View style={[t.flex, t.flexCol, t.mR2, { maxWidth: '55%' }]}>
          <Text style={[t.texts.primary, t.fontSemibold]}>
            Least Interacted With
          </Text>
          <Text
            style={[t.texts.secondary]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {components.text}
          </Text>
        </View>
        <UnfollowLeastInteractedWithFollowingButton />
      </View>
    </Pressable>
  );
};

export { LeastInteractedWithFollowingSummary };
