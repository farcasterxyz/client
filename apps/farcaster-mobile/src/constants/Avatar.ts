// Once upon a time, clients were using a defautl avatar url when creating a directory.
// As of June 29th-ish, 2022, we're not doing that anymore.
// We now just use this to determine whether previously registered users
// have uploaded an avatar or not.
export const defaultAvatarUrl = 'https://farcaster.xyz/avatar.png';
