import { compactQueryKey } from '../../../../utils/QueryUtils';

// Not used, needed only to make the keys test happy
const buildValidateNewChannelKeyKey = ({
  channelKey,
}: {
  channelKey: string;
}) => compactQueryKey(['validateNewChannelKey', channelKey]);

export { buildValidateNewChannelKeyKey };
