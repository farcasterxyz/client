import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { TitleAndDescription } from '~/components/NotificationGroup/Generic/shared/TitleAndDescription';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { NotificationIcon } from '~/components/NotificationGroup/shared/NotificationIcon';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationRenderer, NotificationRendererProps } from './_types';

const WarpcastWalletRenderer: React.FC<NotificationRendererProps> = ({
  group,
  content,
}) => {
  const t = useTheme();
  const navigate = useNavigate();

  return (
    <NotificationGroupOuterContainer
      group={group}
      onPress={() => {
        navigate('Wallet', {});
      }}
    >
      <NotificationIcon variant="purple">
        {(iconColor) => (
          <Ionicons name="wallet" size={16} style={[{ color: iconColor }]} />
        )}
      </NotificationIcon>
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

export const renderWarpcastWallet: NotificationRenderer = (props) => (
  <WarpcastWalletRenderer {...props} />
);
