import { Dimensions, Platform } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

// Gesture thresholds
export const DISMISS_THRESHOLD = 100;
export const MAX_TRANSLATION = 200;
export const EDGE_SWIPE_WIDTH = 40;
export const MIN_GESTURE_DISTANCE = 5;

// Animation configurations
export const SLOW_SPRING_CONFIG = {
  mass: Platform.OS === 'ios' ? 1.25 : 0.75,
  damping: 300,
  stiffness: 800,
  restDisplacementThreshold: 0.01,
  overshootClamping: true,
};

export const FAST_SPRING_CONFIG = {
  mass: Platform.OS === 'ios' ? 1.25 : 0.75,
  damping: 150,
  stiffness: 900,
  restDisplacementThreshold: 0.01,
  overshootClamping: true,
};

export const FASTER_SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  overshootClamping: true,
};

export const FADE_DURATION = 300;
export const DISMISS_DURATION = 250;

// UI constants
export const BACKGROUND_COLOR = '#1D1D1D';
export const BACKGROUND_OPACITY = 0.3;
export const MAX_BORDER_RADIUS = 32;
