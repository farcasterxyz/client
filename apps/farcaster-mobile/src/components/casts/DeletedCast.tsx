import React, { FC, memo } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useCastBodyTextStyle } from '~/constants/Cast';
import { useTheme } from '~/contexts/ThemeProvider';

const DeletedCast: FC = memo(() => {
  const t = useTheme();
  const textStyles = useCastBodyTextStyle();

  return (
    <View
      style={[
        t.pX4,
        t.pY6,
        t.borderDefault,
        t.borderBHairline,
        t.flex,
        t.alignCenter,
        t.bgDefault,
        { zIndex: 1 }, // We add this to make the z-index higher than the next cast in the thread. https://github.com/merkle-manufactory/mobile/pull/847
      ]}
    >
      <Text style={[...textStyles, t.texts.secondary, t.italic]}>
        This cast has been deleted.
      </Text>
    </View>
  );
});

export { DeletedCast };
