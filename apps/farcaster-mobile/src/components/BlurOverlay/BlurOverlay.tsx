import { BlurView } from 'expo-blur';
import React from 'react';
import { View } from 'react-native';

import { DirectCastReactionPrompt } from '~/components/prompts/DirectCastReactionPrompt';
import { useBlurOverlay } from '~/contexts/BlurOverlayProvider';
import { useTheme } from '~/contexts/ThemeProvider';

export const BlurOverlay = () => {
  const t = useTheme();
  const { blurOverlayChildren, setBlurOverlayChildren } = useBlurOverlay();

  return blurOverlayChildren ? (
    <View style={[t.absolute, t.top0, t.bottom0, t.left0, t.z10, t.right0]}>
      <BlurView
        style={[t.absolute, t.top0, t.bottom0, t.left0, t.z100, t.right0]}
        intensity={40}
        tint="dark"
      >
        <View
          style={[t.absolute, t.top0, t.bottom0, t.left0, t.right0]}
          onTouchEnd={() => {
            setBlurOverlayChildren();
          }}
        />
        {blurOverlayChildren}
        <DirectCastReactionPrompt />
      </BlurView>
    </View>
  ) : (
    <></>
  );
};
