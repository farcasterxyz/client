const buildSyncChannelKey = ({ channelId }: { channelId: string }) => [
  'syncChannel',
  channelId,
];

export { buildSyncChannelKey };
