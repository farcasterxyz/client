import Crypto from 'farcaster-expo/src/assets/platforms/payment/crypto.svg';
import React from 'react';
import { View } from 'react-native';

import { TitleAndDescription } from '~/components/NotificationGroup/Generic/shared/TitleAndDescription';
import { NotificationGraphic } from '~/components/NotificationGroup/shared/NotificationGraphic';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';

import { NotificationRenderer, NotificationRendererProps } from './_types';

const AdvertiseOnrampRenderer: React.FC<NotificationRendererProps> = ({
  group,
  content,
}) => {
  const t = useTheme();
  const navigate = useNavigate();

  return (
    <NotificationGroupOuterContainer
      group={group}
      onPress={() => {
        navigate('WalletOnRamp', {});
      }}
    >
      <NotificationGraphic>
        <View
          style={[
            { borderRadius: 8 },
            t.backgrounds.secondary,
            t.w12,
            t.h12,
            t.justifyCenter,
            t.itemsCenter,
          ]}
        >
          <Crypto color={t.colors.text.primary} width={32} height={32} />
        </View>
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

export const renderAdvertiseOnramp: NotificationRenderer = (props) => (
  <AdvertiseOnrampRenderer {...props} />
);
