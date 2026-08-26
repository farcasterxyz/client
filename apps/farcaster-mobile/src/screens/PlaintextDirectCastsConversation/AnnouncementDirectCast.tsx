import React from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

type AnnouncementDirectCastProps = {
  text: string | React.ReactNode;
};

const AnnouncementDirectCast: React.FC<AnnouncementDirectCastProps> = ({
  text,
}) => {
  const t = useTheme();

  const content = React.useMemo(() => {
    if (typeof text === 'string') {
      return (
        <Text
          style={[
            t.textXs,
            t.textCenter,
            t.dark ? { color: '#ffffff' } : t.texts.brand,
          ]}
          numberOfLines={2}
        >
          {text}
        </Text>
      );
    }

    return text;
  }, [text, t.dark, t.texts.brand, t.textCenter, t.textXs]);

  return (
    <View style={[t.flex, t.flexRow, t.justifyCenter, t.mB2]}>
      <View
        style={[
          t.pY1,
          t.pX2,
          t.dark ? t.bgPillHighlight : t.bgDefault,
          { borderRadius: 11 },
        ]}
      >
        {content}
      </View>
    </View>
  );
};

AnnouncementDirectCast.displayName = 'AnnouncementDirectCast';

export { AnnouncementDirectCast };
