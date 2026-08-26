// Once upon a time, clients were using a defautl avatar url when creating a directory.
// As of June 29th-ish, 2022, we're not doing that anymore.
// We now just use this to determine whether previously registered users
// have uploaded an avatar or not.
const defaultAvatarUrl = 'https://farcaster.xyz/avatar.png';

const xs2AvatarDiameter = 16;
const xsAvatarDiameter = 20;
const sm1AvatarDiameter = 24;
const smAvatarDiameter = 36;
const sm2AvatarDiamater = 42;
const mdAvatarDiameter = 48;
const lgAvatarDiameter = 56;
const lg2AvatarDiameter = 64;
const xlAvatarDiameter = 80;
const xl2AvatarDiameter = 96;

export {
  defaultAvatarUrl,
  lg2AvatarDiameter,
  lgAvatarDiameter,
  mdAvatarDiameter,
  sm1AvatarDiameter,
  sm2AvatarDiamater,
  smAvatarDiameter,
  xl2AvatarDiameter,
  xlAvatarDiameter,
  xs2AvatarDiameter,
  xsAvatarDiameter,
};
