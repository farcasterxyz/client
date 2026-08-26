import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import React, { FC, memo } from 'react';
import { Pressable } from 'react-native';

import { hitSlop } from '~/constants/Pressable';
import { useHeader } from '~/contexts/HeaderProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';

const HeaderCancelButton: FC = memo(() => {
  const t = useTheme();
  const { getHeaderOptions } = useHeader();
  const { key } = useRoute();

  const { disableCancel, onCancelPress } = getHeaderOptions(key);
  const popToTop = usePopToTop();

  const defaultOnClosePress = popToTop;

  return (
    <Pressable
      hitSlop={hitSlop}
      disabled={disableCancel}
      onPress={onCancelPress || defaultOnClosePress}
    >
      <Ionicons
        name="close"
        size={28}
        style={[t.texts.secondary, t._mL2, disableCancel && t.opacity25]}
      />
    </Pressable>
  );
});

HeaderCancelButton.displayName = 'HeaderCancelButton';

export { HeaderCancelButton };
