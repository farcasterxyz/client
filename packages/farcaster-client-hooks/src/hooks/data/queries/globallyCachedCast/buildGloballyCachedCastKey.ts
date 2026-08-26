import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildGloballyCachedCastKey = ({
  hash,
  recast,
}: {
  hash?: string;
  recast?: boolean;
} = {}) => compactQueryKey(['globallyCachedCast', hash, recast]) as string[];

export { buildGloballyCachedCastKey };
