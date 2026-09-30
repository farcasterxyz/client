import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiTrendingTopic, ApiUser } from 'farcaster-client-data';
import { formatShorthandNumber, TrendingTopics } from 'farcaster-client-hooks';
import { AnimatedPressable } from 'farcaster-expo';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import { Text2 } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type TrendingTopicsListProps = {
  trendingTopics: TrendingTopics;
};

const TrendingTopicsList: FC<TrendingTopicsListProps> = memo(
  ({ trendingTopics: { topics } }) => {
    const t = useTheme();

    if (!topics || topics.length === 0) {
      return null;
    }

    return (
      <View style={[t.flexCol, t.pY2, t.borderBHairline, t.borderDefault]}>
        {topics.map((item) => (
          <TrendingTopicsListItem key={item.id} topic={item} />
        ))}
      </View>
    );
  },
);

export function TrendingTopicsListItem({ topic }: { topic: ApiTrendingTopic }) {
  const t = useTheme();
  const push = usePush();
  const { trackEvent } = useAnalytics();

  const handlePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressTrendingTopic, {
      id: topic.id,
      name: topic.displayName,
    });

    push('TrendingTopic', {
      topicId: topic.id,
      displayName: topic.displayName,
    });
  }, [trackEvent, topic, push]);

  const topUser = topic.users[0];

  return (
    <AnimatedPressable onPress={handlePress} style={[t.pX3, t.pY2, { gap: 6 }]}>
      <Text2 weight="medium">{topic.displayName}</Text2>
      <View style={[t.flexRow, t.itemsCenter, { gap: 6 }]}>
        <View style={[t.flexRow, t.itemsCenter]}>
          {topic.users
            .flatMap((user: ApiUser) => (user.pfp ? [user.pfp] : []))
            .slice(0, 3)
            .map((pfp, index) => {
              return (
                <View
                  key={pfp.url}
                  style={{
                    marginLeft: index > 0 ? -6 : 0,
                  }}
                >
                  <Avatar pfpUrl={pfp?.url} diameter={18} />
                </View>
              );
            })}
        </View>
        <Text2 color="tertiary" size="sm">
          {`${topUser ? `${topUser.username} and ${topic.userCount - 1} others` : `${topic.userCount} casters`} · ${formatShorthandNumber(topic.castCount)} casts`}
        </Text2>
      </View>
    </AnimatedPressable>
  );
}

export { TrendingTopicsList };
