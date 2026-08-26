import { TypographyBody } from 'farcaster-expo';
import React, { FC, memo, useMemo } from 'react';
import { TouchableHighlight, View } from 'react-native';

import { TabViewTabComponent } from '~/components/CollapsibleTab/TabViewInner';
import { FragmentProxy } from '~/components/FragmentProxy';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';

interface TabProps {
  name: string;
  redDot?: boolean;
}

export const makePillTab = ({ name, redDot }: TabProps) => {
  const PillTabComp: TabViewTabComponent = memo(({ isActive, onPress }) => {
    return (
      <PillTab
        name={name}
        redDot={redDot}
        isActive={isActive}
        onPress={onPress}
      />
    );
  });

  return PillTabComp;
};

export const PillTab: FC<{
  name: string;
  isActive: boolean;
  redDot?: boolean;
  onPress: () => void;
  noPadding?: boolean;
}> = ({ name, redDot, isActive, onPress, noPadding }) => {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const pillStyle = useMemo(() => {
    if (isActive) {
      return [
        t.h8,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.pX3,
        t.border,
        {
          minWidth: 80,
          borderRadius: 50,
        },
        t.backgrounds.brandLight,
        t.borders.highlight,
      ];
    } else {
      return [
        t.h8,
        t.flex,
        t.flexRow,
        t.itemsCenter,
        t.justifyCenter,
        t.border,
        t.pX3,
        t.backgrounds.default,
        t.borders.secondary,
        {
          minWidth: 80,
          borderRadius: 50,
        },
      ];
    }
  }, [
    isActive,
    t.backgrounds.brandLight,
    t.backgrounds.default,
    t.border,
    t.borders.highlight,
    t.borders.secondary,
    t.flex,
    t.flexRow,
    t.h8,
    t.itemsCenter,
    t.justifyCenter,
    t.pX3,
  ]);

  return (
    <View style={[noPadding ? {} : { paddingRight: 12 }]}>
      <TouchableHighlight
        underlayColor={!isActive ? t.colors.bgPillTabHighlight : undefined}
        activeOpacity={0.7}
        onPress={() => {
          triggerImpactAsync();

          onPress();
        }}
        style={pillStyle}
      >
        <FragmentProxy>
          <TypographyBody
            label="Medium/Strong"
            color={isActive ? 'brand' : 'secondary'}
          >
            {name}
          </TypographyBody>
          {redDot && (
            <View
              style={[
                t.absolute,
                t.bgActionPrimary,
                t.roundedFull,
                t.borderBackground,
                {
                  borderWidth: 2,
                  width: 12,
                  height: 12,
                  // If changing, change also `paddingTop` on tabBarStyle, otherwise the dot may be cut off
                  top: -4,
                  right: -4,
                },
              ]}
            ></View>
          )}
        </FragmentProxy>
      </TouchableHighlight>
    </View>
  );
};
