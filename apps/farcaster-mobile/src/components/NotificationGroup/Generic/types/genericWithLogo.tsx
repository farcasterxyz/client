import React from 'react';
import { View } from 'react-native';

import { ActionButtons } from '~/components/NotificationGroup/Generic/shared/ActionButtons';
import { LogoWithBadge } from '~/components/NotificationGroup/Generic/shared/LogoWithBadge';
import { TitleAndDescription } from '~/components/NotificationGroup/Generic/shared/TitleAndDescription';
import { NotificationGroupInnerContainer } from '~/components/NotificationGroup/shared/NotificationGroupInnerContainer';
import { NotificationGroupOuterContainer } from '~/components/NotificationGroup/shared/NotificationGroupOuterContainer';
import { useTheme } from '~/contexts/ThemeProvider';

import { NotificationRenderer, NotificationRendererProps } from './_types';

const GenericWithLogoRenderer: React.FC<NotificationRendererProps> = ({
  group,
  item,
  content,
}) => {
  const t = useTheme();

  if (!item.content.icon) {
    return null;
  }

  return (
    <NotificationGroupOuterContainer group={group} onPress={() => {}}>
      <LogoWithBadge icon={item.content.icon} />
      <NotificationGroupInnerContainer>
        <View style={[t.flexCol, t.flex]}>
          <TitleAndDescription
            title={content.title}
            description={content.description}
            useText2ForDescription={true}
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

export const renderGenericWithLogo: NotificationRenderer = (props) => (
  <GenericWithLogoRenderer {...props} />
);
