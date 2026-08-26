// This file exists to help TypeScript resolve the platform-specific imports
// React Native will automatically pick .ios.tsx or .android.tsx based on platform

import React from 'react';
import { TransformsStyle, View } from 'react-native';
import { PanGesture } from 'react-native-gesture-handler';
import { SharedValue } from 'react-native-reanimated';

import { ActiveLightboxImage } from '~/contexts/LightboxProvider';

export type Transform = Exclude<
  TransformsStyle['transform'],
  string | undefined
>;

export function LightboxImage(_: {
  image: ActiveLightboxImage;
  onTap: () => void;
  measureSafeArea: () => { width: number; height: number };
  transforms: Readonly<
    SharedValue<{
      scaleAndMoveTransform: Transform;
      cropFrameTransform: Transform;
      cropContentTransform: Transform;
      borderRadiusTransform: number;
      isResting: boolean;
      isHidden: boolean;
    }>
  >;
  dismissSwipePan: PanGesture;
  onZoom: (nextIsScaled: boolean) => void;
}) {
  return <View />;
}
