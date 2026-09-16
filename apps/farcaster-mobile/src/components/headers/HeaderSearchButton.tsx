import { useRoute } from '@react-navigation/native';
import { AnimatedPressable } from 'farcaster-expo';
import { Search } from 'lucide-react-native';
import * as React from 'react';

import {
  SEARCH_ICON_BUTTON_SIZE,
  SEARCH_ICON_HEADER_SIZE,
} from '~/components/FloatingSearch/ZIndexLookup';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';

type HeaderSearchButtonProps = {
  onPress: () => void;
};

function HeaderSearchButton({ onPress }: HeaderSearchButtonProps) {
  const route = useRoute();
  const t = useTheme();
  return (
    <AnimatedPressable
      hitSlop={hitSlop}
      onPress={onPress}
      style={[
        {
          width: SEARCH_ICON_BUTTON_SIZE,
          height: SEARCH_ICON_BUTTON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: route.name === 'Feed' ? 8 : 0,
        },
      ]}
    >
      <Search size={SEARCH_ICON_HEADER_SIZE} color={t.colors.text.primary} />
    </AnimatedPressable>
  );
}

export { HeaderSearchButton };
