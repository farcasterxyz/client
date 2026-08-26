import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDraftCastsKey = ({
  channelKey,
}: {
  channelKey: string | undefined;
}) => compactQueryKey(['draftCasts', channelKey]);

export { buildDraftCastsKey };
