import {
  hitSlop,
  hitSlopLg,
  hitSlopSm,
  hitSlopXl,
  hitSlopXs,
} from 'farcaster-expo';
import { Insets } from 'react-native';

const createOneOffHitSlop = (size: number): Insets => ({
  top: size,
  left: size,
  bottom: size,
  right: size,
});

export {
  createOneOffHitSlop,
  hitSlop,
  hitSlopLg,
  hitSlopSm,
  hitSlopXl,
  hitSlopXs,
};
