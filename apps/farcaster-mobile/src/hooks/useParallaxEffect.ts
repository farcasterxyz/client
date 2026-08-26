import { useCallback, useEffect } from 'react';
import {
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { logInDevOnly } from '~/utils/LogUtils';

interface UseParallaxEffectOptions {
  enabled?: boolean;
}

export function useParallaxEffect({
  enabled = true,
}: UseParallaxEffectOptions = {}) {
  // Use Reanimated's animated sensor
  const animatedSensor = useAnimatedSensor(SensorType.ROTATION, {
    interval: 16, // 60 FPS
    adjustToInterfaceOrientation: true,
  });

  const gyroscopeSensor = useAnimatedSensor(SensorType.GYROSCOPE);

  // Check availability
  const isAvailable = useSharedValue(true);

  // Shared values for rotation angles (in degrees)
  const rotationX = useSharedValue(0);
  const rotationY = useSharedValue(0);

  // Reference values for initial orientation
  const referenceX = useSharedValue(0);
  const referenceY = useSharedValue(0);
  const isInitialized = useSharedValue(false);

  // Stationary detection
  const stationaryFrames = useSharedValue(0);

  // Smooth initialization
  const initializationFrames = useSharedValue(0);
  const isFullyInitialized = useSharedValue(false);

  useEffect(() => {
    if (!enabled) {
      logInDevOnly('Parallax disabled');
      return;
    }

    logInDevOnly(
      'Setting up animated sensor for parallax with reference frame',
    );

    // Reset reference values when effect is re-enabled
    isInitialized.value = false;
    rotationX.value = 0;
    rotationY.value = 0;
  }, [enabled, isInitialized, rotationX, rotationY]);

  // Update rotation values from sensor
  useAnimatedStyle(() => {
    'worklet';

    if (!enabled || !animatedSensor.sensor.value) {
      const mass = 0.6;
      const stiffness = 100;
      const dampingFraction = 0.8;
      const damping = 2 * dampingFraction * Math.sqrt(mass * stiffness);

      rotationX.value = withSpring(0, {
        damping: damping,
        stiffness: stiffness,
        mass: mass,
      });
      rotationY.value = withSpring(0, {
        damping: damping,
        stiffness: stiffness,
        mass: mass,
      });
      return {};
    }

    // Get current sensor values
    const pitch = animatedSensor.sensor.value.pitch || 0;
    const roll = animatedSensor.sensor.value.roll || 0;

    // Initialize reference values on first read
    if (!isInitialized.value) {
      referenceX.value = pitch;
      referenceY.value = roll;
      isInitialized.value = true;
      initializationFrames.value = 0;
    } else {
      // Check if device is stationary using gyroscope (no rotation)
      const gyro = gyroscopeSensor.sensor.value;
      if (gyro) {
        const totalRotationRate = Math.sqrt(
          gyro.x * gyro.x + gyro.y * gyro.y + gyro.z * gyro.z,
        );
        // Device is stationary if rotation rate is very low
        const isStationary = totalRotationRate < 0.1; // rad/s

        if (isStationary) {
          stationaryFrames.value += 1;

          // Apply spring after 500ms (30 frames at 60fps)
          if (stationaryFrames.value >= 30) {
            referenceX.value = withSpring(pitch, {
              damping: 12,
              stiffness: 150,
              mass: 0.8,
            });
            referenceY.value = withSpring(roll, {
              damping: 12,
              stiffness: 150,
              mass: 0.8,
            });
            stationaryFrames.value = 0; // Reset counter after applying spring
          }
        } else {
          stationaryFrames.value = 0; // Reset counter if not stationary
        }
      }
    }

    // Smooth initialization with delay - wait 30 frames, then fade in over next 30 frames
    if (!isFullyInitialized.value) {
      initializationFrames.value += 1;
      if (initializationFrames.value >= 60) {
        // 30 frames delay + 30 frames fade-in
        isFullyInitialized.value = true;
      }
    }

    // Calculate relative rotation from initial orientation
    const relativePitch = pitch - referenceX.value;
    const relativeRoll = roll - referenceY.value;

    // Convert to progress value (-1 to 1 range) similar to Swift's screen normalization
    // Max rotation is about 0.5 radians (30 degrees) which maps to full progress
    const progressX = Math.max(-1, Math.min(1, relativePitch / 0.5));
    const progressY = Math.max(-1, Math.min(1, relativeRoll / 0.5));

    // Apply smooth fade-in multiplier: 0 for first 30 frames, then fade in over next 30
    const fadeInMultiplier = isFullyInitialized.value
      ? 1.0
      : Math.max(0, (initializationFrames.value - 30) / 30);

    // Convert progress to degrees (max 10 degrees like Swift implementation)
    const targetRotationX = progressX * 10 * fadeInMultiplier;
    const targetRotationY = progressY * 10 * fadeInMultiplier;

    // Apply a deadzone to reduce small jittery movements
    const deadzone = 0.5; // degrees
    const finalRotationX =
      Math.abs(targetRotationX) < deadzone ? 0 : targetRotationX;
    const finalRotationY =
      Math.abs(targetRotationY) < deadzone ? 0 : targetRotationY;

    // Update rotation values with spring animation
    // Swift uses dampingFraction: 0.32, but in Reanimated we need to calculate actual damping
    // damping = 2 * dampingFraction * sqrt(mass * stiffness)
    const mass = 0.6;
    const stiffness = 100;
    const dampingFraction = 0.8; // Increased for less oscillation
    const damping = 2 * dampingFraction * Math.sqrt(mass * stiffness);

    rotationX.value = withSpring(finalRotationX, {
      damping: damping, // ~12.4 for smooth return
      stiffness: stiffness,
      mass: mass,
    });

    rotationY.value = withSpring(finalRotationY, {
      damping: damping,
      stiffness: stiffness,
      mass: mass,
    });

    return {};
  });

  // Shadow style that responds to tilt
  const shadowStyle = useAnimatedStyle(() => {
    'worklet';

    if (!enabled) {
      return {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      };
    }

    // Medium-intensity shadow animation
    // Movement is more noticeable but still controlled
    const shadowX = 12 + rotationY.value * 1.2;
    const shadowY = 8 - rotationX.value * 1.2;

    // Dynamic blur radius that changes with tilt
    // Ranges from 15 to 25 (less extreme than before)
    const baseRadius = 20;
    const tiltMagnitude = Math.sqrt(
      rotationX.value * rotationX.value + rotationY.value * rotationY.value,
    );
    const shadowRadius = baseRadius + tiltMagnitude * 0.5;

    // Subtle opacity variation (0.12 to 0.18)
    const shadowOpacity = 0.15 + tiltMagnitude * 0.003;

    return {
      shadowOffset: {
        width: shadowX,
        height: shadowY,
      },
      shadowOpacity: Math.min(0.18, shadowOpacity),
      shadowRadius: Math.min(25, shadowRadius),
      shadowColor: '#000',
    };
  });

  // Function to reset the reference point
  const resetReference = useCallback(() => {
    'worklet';
    isInitialized.value = false;
    rotationX.value = 0;
    rotationY.value = 0;
  }, [isInitialized, rotationX, rotationY]);

  return {
    shadowStyle,
    isAvailable,
    rotationX,
    rotationY,
    resetReference,
  };
}
