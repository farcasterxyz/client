import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildDirectCastKeysByAccountKey = ({
  fid,
}: {
  fid: number | undefined;
}) => compactQueryKey(['directCastKeysByAccount', fid]);

export { buildDirectCastKeysByAccountKey };
