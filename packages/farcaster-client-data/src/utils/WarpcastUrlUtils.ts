export const getWarpcastInviteUrl = ({
  channelKey,
  inviteCode,
}: {
  channelKey: string;
  inviteCode: string;
}) =>
  `https://farcaster.xyz/~/channel/${channelKey}/join?inviteCode=${inviteCode}`;

export const getTokenEmbedUrl = ({
  chain,
  ca,
}: {
  chain: string;
  ca: string;
}): string => `https://farcaster.xyz/~/c/${chain}:${ca}`;
