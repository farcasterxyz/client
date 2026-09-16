import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildUserThreadHiddenRepliesKey = ({
  focusedCastHash,
}: {
  focusedCastHash?: string;
}) => compactQueryKey(['userThreadHiddenReplies', focusedCastHash]);

export { buildUserThreadHiddenRepliesKey };
