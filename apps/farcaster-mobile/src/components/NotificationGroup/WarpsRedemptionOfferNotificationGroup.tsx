import { ApiWarpsRedemptionOfferNotificationGroup } from 'farcaster-client-data';
import React, { FC, memo, useCallback } from 'react';
import { View } from 'react-native';

import { WarpIcon } from '~/components/icons/WarpIcon';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationGroupInnerContainer } from './shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from './shared/NotificationGroupOuterContainer';
import { NotificationIcon } from './shared/NotificationIcon';
import { NotificationTitleText } from './shared/NotificationTitleText';

type WarpsRedemptionOfferNotificationGroupProps = {
  group: ApiWarpsRedemptionOfferNotificationGroup;
};

const WarpsRedemptionOfferNotificationGroup: FC<WarpsRedemptionOfferNotificationGroupProps> =
  memo(({ group }) => {
    const t = useTheme();

    const notif = group.previewItems[0];
    const message = notif.content.message;

    const navigate = useNavigate();
    const handlePress = useCallback(async () => {
      navigate('RedeemWarpsForUSDC', {});
    }, [navigate]);

    return (
      <NotificationGroupOuterContainer group={group} onPress={handlePress}>
        <NotificationIcon variant="purple">
          {(iconColor) => <WarpIcon size={16} color={iconColor} />}
        </NotificationIcon>
        <NotificationGroupInnerContainer>
          <View style={[t.flexCol, t.flex1, { gap: 12 }]}>
            <NotificationTitleText>{message}</NotificationTitleText>
          </View>
        </NotificationGroupInnerContainer>
      </NotificationGroupOuterContainer>
    );
  });

WarpsRedemptionOfferNotificationGroup.displayName =
  'WarpsRedemptionOfferNotificationGroup';

export { WarpsRedemptionOfferNotificationGroup };
