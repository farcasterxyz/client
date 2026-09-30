import { Insets } from 'react-native';

const hitSlopInset = 14;
const hitSlopInsetSm = Math.round(hitSlopInset / 2);
const hitSlopInsetXs = Math.round(hitSlopInset / 4);
const hitSlopInsetXl = Math.round(hitSlopInset * 1.25);
const hitSlopInset2xl = Math.round(hitSlopInset * 2);

const hitSlop: Insets = {
  left: hitSlopInset,
  top: hitSlopInset,
  right: hitSlopInset,
  bottom: hitSlopInset,
};

const hitSlopSm: Insets = {
  left: hitSlopInsetSm,
  top: hitSlopInsetSm,
  right: hitSlopInsetSm,
  bottom: hitSlopInsetSm,
};

const hitSlopXs: Insets = {
  left: hitSlopInsetXs,
  top: hitSlopInsetXs,
  right: hitSlopInsetXs,
  bottom: hitSlopInsetXs,
};

const hitSlopLg: Insets = {
  left: hitSlopInsetXl,
  top: hitSlopInsetXl,
  right: hitSlopInsetXl,
  bottom: hitSlopInsetXl,
};

const hitSlopXl: Insets = {
  left: hitSlopInset2xl,
  top: hitSlopInset2xl,
  right: hitSlopInset2xl,
  bottom: hitSlopInset2xl,
};

export { hitSlop, hitSlopLg, hitSlopSm, hitSlopXl, hitSlopXs };
