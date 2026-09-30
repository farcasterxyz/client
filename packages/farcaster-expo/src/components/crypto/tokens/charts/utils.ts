import { ApiOnchainTokenChartAnnotation } from 'farcaster-client-data';
import { Dimensions } from 'react-native';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  price: number;
  volume: number;
  index: number;
  annotation?: ApiOnchainTokenChartAnnotation;
}

export const colors = {
  green: '#28D02C',
  red: '#FF043C',
  blue: '#0079D8',
};

export const sizes = {
  width: Dimensions.get('window').width,
  height: 250,
};

export const ensureBoundedX = (inputX: number, width?: number) => {
  'worklet';
  const x = Math.max(0, Math.min(inputX, sizes.width));
  if (!width) {
    return x;
  }

  const halfWidth = width / 2;
  const finalX = x - halfWidth;
  if (finalX < 0) {
    return 0;
  }
  if (finalX + width > sizes.width) {
    return sizes.width - width;
  }
  return finalX;
};
