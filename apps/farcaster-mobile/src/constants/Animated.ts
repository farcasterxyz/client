import { Easing } from 'react-native-reanimated';

// See Apple's "CAMediaTimingFunction Class Reference" for the Bezier control points
export const easing = Easing.bezier(0.25, 0.1, 0.25, 1);
