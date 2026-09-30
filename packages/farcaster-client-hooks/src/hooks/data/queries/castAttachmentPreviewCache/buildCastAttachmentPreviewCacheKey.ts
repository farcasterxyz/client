import { compactQueryKey } from '../../../../utils/QueryUtils';

const buildCastAttachmentPreviewCacheKey = ({
  previewUrl,
}: {
  previewUrl?: string;
} = {}) =>
  compactQueryKey(['castAttachmentPreviewCache', previewUrl]) as string[];

export { buildCastAttachmentPreviewCacheKey };
