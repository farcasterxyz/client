import { Ionicons } from '@expo/vector-icons';
import type { ApiReportActionNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';

type ReportActionNotificationGroupProps = {
  group: ApiReportActionNotificationGroup;
};

const ReportActionNotificationGroup: FC<ReportActionNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const firstSentence = useMemo(() => {
      if (group.totalItemCount > 1) {
        return `We've taken action on ${group.totalItemCount} cast reports.`;
      }

      return `Your report of ${group.previewItems[0].content.reportCastReason} content has been addressed.`;
    }, [group.previewItems, group.totalItemCount]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={() => {}}>
        <NotificationIcon variant="yellow">
          {(iconColor) => (
            <Ionicons name="flag" size={16} style={[{ color: iconColor }]} />
          )}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.mR1, t.flex, t.flexRow, t.texts.primary, t.flexWrap]}>
            <Text style={[t.texts.primary]}>
              {firstSentence} Thank you for your help.
            </Text>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

ReportActionNotificationGroup.displayName = 'ReportActionNotificationGroup';

export { ReportActionNotificationGroup };
