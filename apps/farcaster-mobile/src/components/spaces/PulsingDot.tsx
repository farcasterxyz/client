import { useSafeFocusEffect } from 'farcaster-expo';
import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

/**
 * Pulsing red dot used for "LIVE" indicators on the Space room header,
 * mini player, and feed strip — parity with web's CSS pulse animation.
 */
const PulsingDot: React.FC<{
  size?: number;
  color?: string;
}> = React.memo(({ size = 6, color = '#dc3412' }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  // Unfocused screens stay mounted (retained tabs, screens under a stack), so
  // an ungated loop keeps the frame pipeline awake while the dot is invisible.
  useSafeFocusEffect(
    useCallback(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.4,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => {
        loop.stop();
        pulse.setValue(1);
      };
    }, [pulse]),
  );

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: pulse,
          },
        ]}
      />
    </View>
  );
});

PulsingDot.displayName = 'PulsingDot';

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 0, left: 0 },
});

export { PulsingDot };
