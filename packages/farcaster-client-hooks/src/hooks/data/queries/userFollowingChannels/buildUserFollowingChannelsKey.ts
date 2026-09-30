import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserFollowingChannelsKey = ({
  forComposer,
}: {
  forComposer?: boolean;
}) => compactQueryKey(['userFollowingChannels', forComposer]);

export { buildUserFollowingChannelsKey };
