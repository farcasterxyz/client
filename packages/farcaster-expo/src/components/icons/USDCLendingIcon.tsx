import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../../contexts';

export const USDCLendingIcon = ({ size = 42 }: { size?: number }) => {
  const t = useTheme();

  const innerSize = size / 2;
  const isLightMode = t.scheme === 'light';

  const LightModeBackground = React.useMemo(() => {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#AF9CFF', borderRadius: size / 2 },
        ]}
      />
    );
  }, [size]);

  const DarkModeBackground = React.useMemo(() => {
    return (
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="lendingGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="53.85%" stopColor="#7959FF" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#B689FF" stopOpacity="0.2" />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill="url(#lendingGradient)"
        />
      </Svg>
    );
  }, [size]);

  return (
    <View
      style={[t.roundedFull, { width: size, height: size, overflow: 'hidden' }]}
    >
      {isLightMode ? LightModeBackground : DarkModeBackground}
      <View
        style={[
          StyleSheet.absoluteFill,
          { zIndex: 1, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <View style={{ width: innerSize, height: innerSize }}>
          <Svg
            width={innerSize}
            height={innerSize}
            viewBox="0 0 24 24"
            fill="none"
          >
            <Path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="white"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
          <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
            <Svg
              width={innerSize}
              height={innerSize}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M11.5384 7.2534C11.7534 6.91553 12.2466 6.91553 12.4616 7.2534L13.0837 8.23082C13.7716 9.3117 14.6883 10.2284 15.7692 10.9163L16.7466 11.5384C17.0845 11.7534 17.0845 12.2466 16.7466 12.4616L15.7692 13.0837C14.6883 13.7716 13.7716 14.6883 13.0837 15.7692L12.4616 16.7466C12.2466 17.0845 11.7534 17.0845 11.5384 16.7466L10.9163 15.7692C10.2284 14.6883 9.3117 13.7716 8.23082 13.0837L7.2534 12.4616C6.91553 12.2466 6.91553 11.7534 7.2534 11.5384L8.23082 10.9163C9.3117 10.2284 10.2284 9.3117 10.9163 8.23082L11.5384 7.2534Z"
                stroke="white"
                strokeWidth={2}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    </View>
  );
};
