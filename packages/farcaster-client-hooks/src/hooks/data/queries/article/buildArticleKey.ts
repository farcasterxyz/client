import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildArticleKey = ({ publicId }: { publicId: string }) =>
  compactQueryKey(['article', publicId]);

export { buildArticleKey };
