import { FarcasterProBadge } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { TitleAndDescription } from '~/components/NotificationGroup/Generic/shared/TitleAndDescription';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationRenderer, NotificationRendererProps } from './_types';

const ProFeesUpsellRenderer: React.FC<NotificationRendererProps> = ({
  group,
  content,
}) => {
  const t = useTheme();
  const navigate = useNavigate();

  return (
    <NotificationGroupOuterContainer
      group={group}
      onPress={() => {
        navigate('FarcasterProUpsell', { source: 'swap-fees-inapp-notif' });
      }}
    >
      <NotificationGraphic centerVertically>
        <FarcasterProBadge size={48} />
      </NotificationGraphic>
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, t.flex]}>
          <TitleAndDescription
            title={content.title}
            description={content.description}
          />
        </View>
      </NotificationGroupInnerContainer>
    </NotificationGroupOuterContainer>
  );
};

export const renderProFeesUpsell: NotificationRenderer = (props) => (
  <ProFeesUpsellRenderer {...props} />
);
