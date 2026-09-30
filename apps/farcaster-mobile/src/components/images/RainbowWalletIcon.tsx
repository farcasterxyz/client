import React, { FC, memo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type RainbowWalletIconProps = {
  color: string;
  width: number;
  height: number;
  style?: ViewStyle[];
  fill: boolean;
};

const RainbowWalletIcon: FC<RainbowWalletIconProps> = memo(
  ({ color, fill, width, height, style }) => {
    if (fill) {
      return (
        <View style={[style, { marginBottom: -2 }]}>
          <Svg width={width} height={height} viewBox="0 0 140 140" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M98.1335 104.533H100.267C102.623 104.533 104.533 102.623 104.533 100.267C104.533 57.8512 70.1489 23.4667 27.7335 23.4667C25.3771 23.4667 23.4668 25.3769 23.4668 27.7333V29.8667C23.4668 32.2231 25.377 34.1333 27.7335 34.1333C64.2579 34.1333 93.8668 63.7422 93.8668 100.267C93.8668 102.623 95.777 104.533 98.1335 104.533Z"
              fill="url(#paint0_linear_15_10)"
              // style={{}}
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M85.3335 100.267C85.3335 68.4551 59.5451 42.6667 27.7335 42.6667C26.661 42.6667 26.3731 42.6733 26.1662 42.7061C24.797 42.9229 23.7231 43.9968 23.5062 45.3661C23.4734 45.573 23.4668 45.8609 23.4668 46.9333C23.4668 48.0058 23.4734 48.2937 23.5062 48.5006C23.7231 49.8699 24.797 50.9437 26.1662 51.1606C26.3731 51.1934 26.661 51.2 27.7335 51.2C54.8322 51.2 76.8001 73.1679 76.8001 100.267C76.8001 101.339 76.8068 101.627 76.8395 101.834C77.0564 103.203 78.1303 104.277 79.4995 104.494C79.7065 104.527 79.9943 104.533 81.0668 104.533C82.1393 104.533 82.4271 104.527 82.6341 104.494C84.0033 104.277 85.0772 103.203 85.2941 101.834C85.3269 101.627 85.3335 101.339 85.3335 100.267Z"
              fill="url(#paint1_linear_15_10)"
              // style={{}}
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M23.4668 64V66.1333C23.4668 68.4898 25.377 70.4 27.7335 70.4C44.2284 70.4 57.6001 83.7718 57.6001 100.267C57.6001 102.623 59.5104 104.533 61.8668 104.533H64.0001C66.3565 104.533 68.2668 102.623 68.2668 100.267C68.2668 77.8807 50.1194 59.7333 27.7335 59.7333C25.3771 59.7333 23.4668 61.6436 23.4668 64Z"
              fill="url(#paint2_linear_15_10)"
              // style={{}}
            />
            <Defs>
              <LinearGradient
                id="paint0_linear_15_10"
                x1={29.5468}
                y1={104.533}
                x2={29.5468}
                y2={23.4667}
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  stopColor="#8754C9"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#8754C9',
                  //   stopColor: 'color(display-p3 0.5294 0.3294 0.7882)',
                  //   stopOpacity: 1,
                  // }}
                />
                <Stop
                  offset={1}
                  stopColor="#FF4000"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#FF4000',
                  //   stopColor: 'color(display-p3 1.0000 0.2510 0.0000)',
                  //   stopOpacity: 1,
                  // }}
                />
              </LinearGradient>
              <LinearGradient
                id="paint1_linear_15_10"
                x1={29.2668}
                y1={104.534}
                x2={29.2668}
                y2={42.6667}
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  stopColor="#FF9901"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#FF9901',
                  //   stopColor: 'color(display-p3 1.0000 0.6000 0.0039)',
                  //   stopOpacity: 1,
                  // }}
                />
                <Stop
                  offset={1}
                  stopColor="#FFD500"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#FFD500',
                  //   stopColor: 'color(display-p3 1.0000 0.8333 0.0000)',
                  //   stopOpacity: 1,
                  // }}
                />
              </LinearGradient>
              <LinearGradient
                id="paint2_linear_15_10"
                x1={27.6668}
                y1={104.534}
                x2={27.6668}
                y2={59.7333}
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  stopColor="#01DA40"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#01DA40',
                  //   color: 'color(display-p3 0.0039 0.8549 0.2510)',
                  //   stopOpacity: 1,
                  // }}
                />
                <Stop
                  offset={1}
                  stopColor="#00AAFF"
                  stopOpacity={1}
                  // style={{
                  //   stopColor: '#00AAFF',
                  //   color: 'color(display-p3 0.0000 0.6667 1.0000)',
                  //   stopOpacity: 1,
                  // }}
                />
              </LinearGradient>
            </Defs>
          </Svg>
        </View>
      );
    }

    return (
      <View style={[style, { marginBottom: -2 }]}>
        <Svg width={width} height={height} viewBox="0 0 140 140" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M98.1333 104.533H100.267C102.623 104.533 104.533 102.623 104.533 100.267C104.533 57.8512 70.1488 23.4667 27.7333 23.4667C25.3769 23.4667 23.4667 25.3769 23.4667 27.7333V29.8667C23.4667 32.2231 25.3769 34.1333 27.7333 34.1333C64.2578 34.1333 93.8667 63.7422 93.8667 100.267C93.8667 102.623 95.7769 104.533 98.1333 104.533ZM85.3334 100.267C85.3334 68.4551 59.5449 42.6667 27.7333 42.6667C26.6609 42.6667 26.373 42.6733 26.1661 42.7061C24.7968 42.9229 23.7229 43.9968 23.5061 45.3661C23.4733 45.573 23.4667 45.8609 23.4667 46.9333C23.4667 48.0058 23.4733 48.2936 23.5061 48.5006C23.7229 49.8698 24.7968 50.9437 26.1661 51.1606C26.373 51.1934 26.6609 51.2 27.7333 51.2C54.8321 51.2 76.8 73.1679 76.8 100.267C76.8 101.339 76.8066 101.627 76.8394 101.834C77.0563 103.203 78.1302 104.277 79.4994 104.494C79.7064 104.527 79.9942 104.533 81.0667 104.533C82.1391 104.533 82.427 104.527 82.6339 104.494C84.0032 104.277 85.0771 103.203 85.294 101.834C85.3267 101.627 85.3334 101.339 85.3334 100.267ZM23.4667 64V66.1333C23.4667 68.4897 25.3769 70.4 27.7333 70.4C44.2282 70.4 57.6 83.7718 57.6 100.267C57.6 102.623 59.5103 104.533 61.8667 104.533H64C66.3564 104.533 68.2667 102.623 68.2667 100.267C68.2667 77.8807 50.1193 59.7333 27.7333 59.7333C25.3769 59.7333 23.4667 61.6436 23.4667 64Z"
            fill={color}
          />
        </Svg>
      </View>
    );
  },
);

RainbowWalletIcon.displayName = 'RainbowWalletIcon';

export { RainbowWalletIcon };
