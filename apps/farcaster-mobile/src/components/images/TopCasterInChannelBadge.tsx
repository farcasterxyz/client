import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { useTheme } from '~/contexts/ThemeProvider';

type TopCasterInChannelBadgeProps = {
  width: number;
  height: number;
  style: ViewStyle[];
};

const TopCasterInChannelBadge: FC<TopCasterInChannelBadgeProps> = memo(
  ({ width, height, style }) => {
    const t = useTheme();

    return (
      <View style={[style, t.flex, t.flexCol, t.itemsCenter, t.justifyCenter]}>
        <Svg width={width} height={height} viewBox="0 0 32 32" fill="none">
          <G clipPath="url(#clip0_7_2)">
            <Circle cx="16" cy="16" r="16" fill="#3670BC" />
            <Path
              d="M16.599 6.8728L19.3274 12.4L25.4264 13.2857C25.5501 13.3035 25.6663 13.3556 25.7619 13.4361C25.8575 13.5166 25.9286 13.6222 25.9672 13.7411C26.0059 13.8599 26.0104 13.9872 25.9804 14.1085C25.9504 14.2298 25.887 14.3403 25.7974 14.4274L21.3842 18.7291L22.426 24.8049C22.4469 24.9279 22.4331 25.0542 22.386 25.1697C22.3389 25.2852 22.2605 25.3853 22.1596 25.4586C22.0586 25.5318 21.9392 25.5754 21.8148 25.5845C21.6904 25.5935 21.566 25.5675 21.4556 25.5095L15.9997 22.6411L10.5447 25.5095C10.4342 25.5676 10.3096 25.5936 10.1851 25.5845C10.0606 25.5755 9.94113 25.5318 9.84016 25.4584C9.7392 25.385 9.66079 25.2848 9.6138 25.1692C9.5668 25.0535 9.55311 24.927 9.57426 24.804L10.616 18.7291L6.20279 14.4274C6.11313 14.3404 6.04967 14.23 6.01962 14.1087C5.98956 13.9874 5.99412 13.8602 6.03276 13.7414C6.0714 13.6225 6.14259 13.517 6.23823 13.4366C6.33387 13.3562 6.45014 13.3042 6.57383 13.2866L12.6728 12.4L15.3994 6.8728C15.4547 6.76089 15.5401 6.66667 15.6461 6.60079C15.7521 6.53491 15.8744 6.5 15.9992 6.5C16.124 6.5 16.2463 6.53491 16.3523 6.60079C16.4583 6.66667 16.5438 6.76089 16.599 6.8728Z"
              fill="white"
            />
          </G>
          <Defs>
            <ClipPath id="clip0_7_2">
              <Rect width="32" height="32" fill="white" />
            </ClipPath>
          </Defs>
        </Svg>
      </View>
    );
  },
);

TopCasterInChannelBadge.displayName = 'TopCasterInChannelBadge';

export { TopCasterInChannelBadge };
