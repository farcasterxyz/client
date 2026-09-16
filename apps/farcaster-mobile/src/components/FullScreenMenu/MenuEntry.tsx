import { Octicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { TouchableHighlight, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface MenuEntryConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}

const MenuEntry: FC<MenuEntryConfig> = memo(
  ({ icon, title, subtitle, onPress, disabled }) => {
    const t = useTheme();

    return (
      <TouchableHighlight
        underlayColor={t.colors.bgFaintOld}
        onPress={onPress}
        disabled={disabled}
      >
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.p5,
            t.borderDefault,
            t.borderBHairline,
            disabled ? t.opacity50 : t.opacity100,
          ]}
        >
          <View
            style={[
              t.roundedFull,
              t.bgFaintOld,
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              { width: 40, height: 40 },
              // The icons are seemingly always too much to the top and left
              { paddingTop: 1, paddingLeft: 1 },
            ]}
          >
            {icon}
          </View>
          <View style={[t.flexCol, t.mL4, t.flex1]}>
            <Text
              style={[
                t.texts.primary,
                t.fontMedium,
                { fontSize: 17, marginBottom: 6 },
              ]}
            >
              {title}
            </Text>
            <Text style={[t.texts.primary, t.texts.tertiary, { fontSize: 14 }]}>
              {subtitle}
            </Text>
          </View>
          <View>
            {!disabled && (
              <Octicons
                name="chevron-right"
                size={24}
                color={t.colors.text.tertiary}
              />
            )}
          </View>
        </View>
      </TouchableHighlight>
    );
  },
);

MenuEntry.displayName = 'MenuEntry';

export { MenuEntry, type MenuEntryConfig };
