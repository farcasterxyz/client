import { Text2 } from 'farcaster-expo';
import React, { FC } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type TitleAndDescriptionProps = {
  title?: string;
  description: string;
  useText2ForDescription?: boolean;
};

export const TitleAndDescription: FC<TitleAndDescriptionProps> = ({
  title,
  description,
  useText2ForDescription = false,
}) => {
  const t = useTheme();

  return (
    <View style={[t.flex1, t.justifyCenter]}>
      {title ? (
        <Text style={[t.mR1, t.texts.primary, t.textBase, t.fontSemibold]}>
          {title}
        </Text>
      ) : null}
      {useText2ForDescription ? (
        <Text2 weight={title ? 'regular' : 'medium'} style={[t.mR1, t.mT1]}>
          {description}
        </Text2>
      ) : (
        <Text style={[t.mR1, t.mT1, t.texts.primary]}>{description}</Text>
      )}
    </View>
  );
};
