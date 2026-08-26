import { ApiNewArticleNotificationGroup } from 'farcaster-client-data';
import { formatTimeAgo } from 'farcaster-client-hooks';
import { Text2, TokenIcon } from 'farcaster-expo';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGraphic } from './shared/NotificationGraphic';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';

type NewArticleNotificationGroupProps = {
  group: ApiNewArticleNotificationGroup;
};

const NewArticleNotificationGroup: FC<NewArticleNotificationGroupProps> = memo(
  ({ group }) => {
    const push = usePush();
    const t = useTheme();

    const notification = group.previewItems[0];

    const article = group.previewItems[0].content.article;

    const onNotificationPress = React.useCallback(() => {
      push('Article', {
        publicId: article.publicId,
        source: 'new-article-inapp',
      });
    }, [article.publicId, push]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={onNotificationPress}
      >
        <NotificationGraphic>
          <TokenIcon
            iconUrl={article.token?.imageUrl}
            diameter={48}
            symbol={article.token?.symbol}
          />
        </NotificationGraphic>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 2 }]}>
            <View style={[t.flexRow, t.justifyBetween, t.itemsStart, t.wFull]}>
              <Text2 weight="semibold" numberOfLines={2}>
                {article.title}
              </Text2>
              <Text2 color="tertiary">
                {formatTimeAgo(notification.timestamp, 'floor')}
              </Text2>
            </View>
            <Text2 color="secondary" numberOfLines={3}>
              {article.description}
            </Text2>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  },
);

NewArticleNotificationGroup.displayName = 'NewArticleNotificationGroup';

export { NewArticleNotificationGroup };
