import { Octicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { ActionButtons } from '~/components/NotificationGroup/Generic/shared/ActionButtons';
import { TitleAndDescription } from '~/components/NotificationGroup/Generic/shared/TitleAndDescription';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { NotificationIcon } from '~/components/NotificationGroup/shared/NotificationIcon';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationRenderer, NotificationRendererProps } from './_types';

const GenericNoLogoRenderer: React.FC<NotificationRendererProps> = ({
  group,
  content,
}) => {
  const t = useTheme();

  if (!content.title) {
    return null;
  }

  return (
    <NotificationGroupOuterContainer group={group} onPress={() => {}}>
      <NotificationIcon variant="blue">
        {(iconColor) => (
          <Octicons name="star" size={16} style={[{ color: iconColor }]} />
        )}
      </NotificationIcon>
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, t.flex]}>
          <TitleAndDescription
            title={content.title}
            description={content.description}
          />
          <ActionButtons
            type={content.type}
            primaryCta={content.primaryCta}
            secondaryCta={content.secondaryCta}
          />
        </View>
      </NotificationGroupInnerContainer>
    </NotificationGroupOuterContainer>
  );
};

export const renderGenericNoLogo: NotificationRenderer = (props) => (
  <GenericNoLogoRenderer {...props} />
);
