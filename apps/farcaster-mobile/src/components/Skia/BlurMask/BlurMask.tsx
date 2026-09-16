import { Fill, Shader, vec } from '@shopify/react-native-skia';
import React, { type ReactNode, useMemo } from 'react';

import { logInDevOnly } from '~/utils/LogUtils';

import { generateLowQualityShader, generateShader } from './Shader';

const isOlderDevice = () => {
  return false;
};

let source: ReturnType<typeof generateShader> | null = null;
let lowQualitySource: ReturnType<typeof generateLowQualityShader> | null = null;

try {
  source = generateShader();
  logInDevOnly;
  logInDevOnly('High quality shader compiled successfully');
} catch (e) {
  logInDevOnly('Failed to generate standard blur shader:', e);
}

try {
  lowQualitySource = generateLowQualityShader();
  logInDevOnly('Low quality shader compiled successfully');
} catch (e) {
  logInDevOnly('Failed to generate low quality blur shader:', e);
}

interface BlurGradientProps {
  mask: ReactNode | ReactNode[];
  children: ReactNode | ReactNode[];
  lowQuality?: boolean;
  imageSize?: { width: number; height: number };
  gradientColor?: { r: number; g: number; b: number };
  gradientStrength?: number;
}

export const BlurMask = ({
  mask,
  children,
  lowQuality,
  imageSize = { width: 354, height: 354 },
  gradientColor = { r: 0.533, g: 0.533, b: 0.533 }, // #888888
  gradientStrength = 1.0,
}: BlurGradientProps) => {
  const shader = useMemo(() => {
    const preferLowQuality = lowQuality || isOlderDevice();
    const selectedShader = preferLowQuality ? lowQualitySource : source;

    // logInDevOnly('BlurMask shader selection:', {
    //   preferLowQuality,
    //   hasLowQualityShader: !!lowQualitySource,
    //   hasHighQualityShader: !!source,
    //   platform: Platform.OS,
    // });

    // Fallback to the other shader if preferred one failed
    if (!selectedShader) {
      return preferLowQuality ? source : lowQualitySource;
    }

    return selectedShader;
  }, [lowQuality]);

  // If no shader could be compiled, just render children without blur
  if (!shader) {
    logInDevOnly('BlurMask: No shader available, rendering without blur');
    return <>{children}</>;
  }

  return (
    <Fill>
      <Shader
        source={shader}
        uniforms={{
          direction: vec(1, 0),
          imageSize: vec(imageSize.width, imageSize.height),
          gradientColor: [gradientColor.r, gradientColor.g, gradientColor.b],
          gradientStrength,
        }}
      >
        <Shader
          source={shader}
          uniforms={{
            direction: vec(0, 1),
            imageSize: vec(imageSize.width, imageSize.height),
            gradientColor: [gradientColor.r, gradientColor.g, gradientColor.b],
            gradientStrength,
          }}
        >
          {children}
          {mask}
        </Shader>
        {mask}
      </Shader>
    </Fill>
  );
};
