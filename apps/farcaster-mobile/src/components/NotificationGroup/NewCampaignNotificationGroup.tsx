import { Ionicons } from '@expo/vector-icons';
import { ApiNewCampaignNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ChainImage } from '~/components/Chain/ChainImage';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useHaptics } from '~/hooks/useHaptics';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type NewCampaignNotificationGroupProps = {
  group: ApiNewCampaignNotificationGroup;
};

const NewCampaignNotificationGroup: FC<NewCampaignNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();
    const push = usePush();
    const { triggerImpactAsync } = useHaptics();

    const notification = group.previewItems[0];
    const icon = notification.content.icon;

    const onPress = useCallback(() => {
      triggerImpactAsync();
      push('Campaign', { campaignId: notification.content.campaignId });
    }, [notification.content.campaignId, push, triggerImpactAsync]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={onPress}>
        <NotificationIcon variant="purple">
          {(iconColor) => {
            if (icon === 'parachute') {
              return <ParachuteIcon iconColor={iconColor} />;
            }
            if (icon === 'gift') {
              return (
                <Ionicons
                  name="gift-outline"
                  size={18}
                  style={[{ color: iconColor }]}
                />
              );
            } else {
              return (
                <View style={{ width: 48, height: 48 }}>
                  <ChainImage
                    chain={icon}
                    size={48}
                    bordered
                    borderRadius={9999}
                  />
                  <View
                    style={[
                      t.absolute,
                      t.border2,
                      t.roundedLg,
                      t.bgDefault,
                      { bottom: -4, right: -4 },
                    ]}
                  >
                    <ParachuteIcon iconColor={iconColor} />
                  </View>
                </View>
              );
            }
          }}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View
            style={[
              t.flexRow,
              t.justifyBetween,
              t.itemsStart,
              t.wFull,
              { gap: 2 },
            ]}
          >
            <View style={[t.flexCol, t.flex1]}>
              <Text2 weight="semibold">{notification.content.title}</Text2>
              <Text2 color="secondary">{notification.content.body}</Text2>
            </View>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

NewCampaignNotificationGroup.displayName = 'NewCampaignNotificationGroup';

export { NewCampaignNotificationGroup };

const ParachuteIcon = ({ iconColor }: { iconColor: string }) => {
  return (
    <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.8125 10C17.8125 7.928 16.9894 5.94086 15.5243 4.47573C14.0591 3.0106 12.072 2.1875 10 2.1875C7.928 2.1875 5.94086 3.0106 4.47573 4.47573C3.0106 5.94086 2.1875 7.928 2.1875 10"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17.8125 10C17.8125 8.70312 16.6719 7.65625 15.2734 7.65625C13.8672 7.65625 12.7344 8.70312 12.7344 10C12.7344 8.70312 11.5078 7.65625 10 7.65625C8.49219 7.65625 7.26562 8.70312 7.26562 10C7.26562 8.70312 6.125 7.65625 4.72656 7.65625C3.32031 7.65625 2.1875 8.70312 2.1875 10"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.1875 10L10 17.8125L7.26562 10"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.7344 10L10 17.8125L17.8125 10"
        stroke={iconColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
