import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastRecastersKey = ({
  castHash,
}: {
  castHash: string | undefined;
}) => compactQueryKey(['castRecasters', castHash]);

export { buildCastRecastersKey };
