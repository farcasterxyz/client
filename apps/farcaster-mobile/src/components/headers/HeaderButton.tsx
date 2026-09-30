import React, { FC, memo } from 'react';
import { StyleProp, TouchableHighlight, View, ViewStyle } from 'react-native';

import { avatarDiameter } from '~/components/CollapsibleTab/FeedTopBar';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

interface HeaderButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  haptics?: boolean;
  children: React.ReactNode;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HeaderButton: FC<HeaderButtonProps> = memo(
  ({ onPress, haptics, children, badge, style, onLongPress }) => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();

    const onPressWithPossiblyHaptics = React.useCallback(() => {
      if (haptics) {
        triggerImpactAsync();
      }

      onPress();
    }, [haptics, onPress, triggerImpactAsync]);

    const onLongPressWithPossiblyHaptics = React.useCallback(() => {
      if (haptics) {
        triggerImpactAsync();
      }

      onLongPress?.();
    }, [haptics, onLongPress, triggerImpactAsync]);

    return (
      <View>
        <TouchableHighlight
          style={[
            t.relative,
            t.roundedLg,
            t.borderHairline,
            t.borderDefault,
            t.flex,
            t.itemsCenter,
            t.justifyCenter,
            t.flexShrink0,
            t.mL3,
            {
              width: avatarDiameter,
              height: avatarDiameter,
            },
            t.relative,
            style,
          ]}
          underlayColor={t.colors.bgFaintOld}
          hitSlop={hitSlop}
          onPress={onPressWithPossiblyHaptics}
          onLongPress={onLongPressWithPossiblyHaptics}
        >
          <>{children}</>
        </TouchableHighlight>
        {badge && (
          <View
            style={[t.absolute, t.h2, t.w2, t.z50, t.flex, t.justifyCenter]}
          >
            <View
              style={[
                t.roundedFull,
                t.bgDanger,
                t.wFull,
                t.hFull,
                t.mL9,
                t.mB1,
              ]}
            />
          </View>
        )}
      </View>
    );
  },
);

HeaderButton.displayName = 'HeaderButton';

export { HeaderButton };
