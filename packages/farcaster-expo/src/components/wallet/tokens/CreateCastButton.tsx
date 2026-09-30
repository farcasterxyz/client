import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../../../contexts/ThemeContext';
import { AnimatedPressable } from '../../design-system/AnimatedPressable';

interface CreateCastButtonProps {
  width: number;
  height: number;
  onPress: () => void;
}

export function CreateCastButton({
  width,
  height,
  onPress,
}: CreateCastButtonProps) {
  const t = useTheme();

  return (
    <AnimatedPressable onPress={onPress}>
      <View
        style={[
          {
            width,
            height,
            borderRadius: 32,
          },
          t.backgrounds.brand,
        ]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Svg width="21" height="21" viewBox="0 0 21 21" fill="none">
            <Path
              d="M0 2.625C0 1.176 1.176 0 2.625 0H18.375C19.824 0 21 1.176 21 2.625V13.875C21 14.5712 20.7234 15.2389 20.2312 15.7312C19.7389 16.2234 19.0712 16.5 18.375 16.5H12.09L8.2305 20.3595C7.92458 20.6643 7.53528 20.8716 7.11168 20.9555C6.68808 21.0393 6.24913 20.9959 5.85017 20.8307C5.45121 20.6655 5.11009 20.3858 4.86982 20.027C4.62954 19.6682 4.50086 19.2463 4.5 18.8145V16.5H2.625C1.92881 16.5 1.26113 16.2234 0.768845 15.7312C0.276562 15.2389 0 14.5712 0 13.875V2.625ZM2.625 2.25C2.52554 2.25 2.43016 2.28951 2.35984 2.35984C2.28951 2.43016 2.25 2.52554 2.25 2.625V13.875C2.25 14.082 2.418 14.25 2.625 14.25H5.625C5.92337 14.25 6.20952 14.3685 6.4205 14.5795C6.63147 14.7905 6.75 15.0766 6.75 15.375V18.66L10.83 14.58C10.9343 14.4754 11.0582 14.3925 11.1946 14.3358C11.3311 14.2792 11.4773 14.25 11.625 14.25H18.375C18.4745 14.25 18.5698 14.2105 18.6402 14.1402C18.7105 14.0698 18.75 13.9745 18.75 13.875V2.625C18.75 2.52554 18.7105 2.43016 18.6402 2.35984C18.5698 2.28951 18.4745 2.25 18.375 2.25H2.625Z"
              fill={t.colors.text.light}
            />
          </Svg>
        </View>
      </View>
    </AnimatedPressable>
  );
}
