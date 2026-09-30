import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastAttachmentCacheKey = ({
  fid,
  hash,
}: {
  fid?: number;
  hash?: string;
} = {}) => compactQueryKey(['castAttachmentCache', fid, hash]) as string[];

export { buildCastAttachmentCacheKey };
