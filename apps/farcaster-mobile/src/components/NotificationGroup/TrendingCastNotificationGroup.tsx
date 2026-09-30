import { ApiTrendingCastNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { FlameFillIcon } from '~/components/images/FlameFillIcon';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

import { NotificationGroupCastText } from './shared/NotificationGroupCastText';
import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type TrendingCastNotificationGroupProps = {
  group: ApiTrendingCastNotificationGroup;
};

const TrendingCastNotificationGroup: FC<TrendingCastNotificationGroupProps> =
  memo(({ group }) => {
    const push = usePush();
    const t = useTheme();

    const firstPreviewItem = React.useMemo(
      () => group.previewItems[0],
      [group.previewItems],
    );

    const multipleCastsAreTrending = React.useMemo(() => {
      return group.totalItemCount !== 1;
    }, [group.totalItemCount]);

    return (
      <NotificationGroupOuterContainer
        group={group}
        onPress={() => {
          if (multipleCastsAreTrending) {
            push('NotificationsInGroup', {
              groupId: group.id,
              type: group.type,
              title: undefined,
            });
          } else {
            push('Cast', {
              castHash: firstPreviewItem.content.cast.hash,
            });
          }
        }}
      >
        <NotificationIcon variant="yellow">
          {(iconColor) => <FlameFillIcon size={18} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View
            style={[
              t.mR1,
              t.flex,
              t.flexRow,
              t.texts.primary,
              t.flexWrap,
              t.mT1,
            ]}
          >
            <Text style={[t.texts.primary, t.fontSemibold]}>
              {multipleCastsAreTrending
                ? `You have ${group.totalItemCount} casts trending!`
                : 'Your cast is trending!'}
            </Text>
          </View>
          <NotificationGroupCastText cast={firstPreviewItem.content.cast} />
          {multipleCastsAreTrending && (
            <View style={[t.mT2]}>
              <Text style={[t.textSm, t.texts.brand]}>Show more</Text>
            </View>
          )}
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

TrendingCastNotificationGroup.displayName = 'TrendingCastNotificationGroup';

export { TrendingCastNotificationGroup };
