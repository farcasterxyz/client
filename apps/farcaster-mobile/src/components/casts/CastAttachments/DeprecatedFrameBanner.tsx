import { getColors } from 'farcaster-expo/src/theme/colors';
import { InfoIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

const DeprecatedFrameBanner: React.FC = React.memo(() => {
  const t = useTheme();
  const push = usePush();

  const navigateToExplanationCast = useCallback(() => {
    push('Cast', {
      castHash: '0xfe5d5ef5791d7ca136d9dbdafc3b1825c7fc5d98',
    });
  }, [push]);

  const colors = useMemo(() => getColors(t.dark ? 'dark' : 'light'), [t.dark]);

  return (
    <View
      style={[
        t.borderDefault,
        t.borderHairline,
        { borderRadius: 12 },
        t.p2,
        { backgroundColor: colors.blue100 },
        t.flexRow,
        t.itemsCenter,
        { gap: 4 },
      ]}
    >
      <InfoIcon size={16} color={colors.blue500} />
      <View style={[t.flexRow, t.itemsCenter]}>
        <Text2 size="xs" style={[{ color: colors.blue500 }]}>
          Frames v1 have been deprecated.
        </Text2>
        <TouchableOpacity onPress={navigateToExplanationCast}>
          <Text2
            style={[t.mL1, t.underline, { color: colors.blue500 }]}
            size="xs"
          >
            Read more
          </Text2>
        </TouchableOpacity>
      </View>
    </View>
  );
});

DeprecatedFrameBanner.displayName = 'DeprecatedFrameBanner';

export { DeprecatedFrameBanner };
