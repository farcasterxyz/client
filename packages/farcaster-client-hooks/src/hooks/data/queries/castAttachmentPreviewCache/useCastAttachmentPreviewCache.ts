import { useQueryClient } from '@tanstack/react-query';
import { ApiCastEmbeds, ApiCastUrlEmbed } from 'farcaster-client-data';
import { useCallback } from 'react';

import { buildCastAttachmentPreviewCacheKey } from './buildCastAttachmentPreviewCacheKey';

const useCastAttachmentPreviewCache = () => {
  const qc = useQueryClient();

  return useCallback(
    ({ previewUrl }: { previewUrl: string }): ApiCastUrlEmbed | undefined => {
      return qc.getQueryData(
        buildCastAttachmentPreviewCacheKey({ previewUrl }),
      );
    },
    [qc],
  );
};

const useSetCastAttachmentPreviewCache = () => {
  const qc = useQueryClient();

  return useCallback(
    ({ embeds }: { embeds: ApiCastEmbeds | undefined }) => {
      if (!embeds) return;

      for (const embed of embeds.urls) {
        qc.setQueryData(
          buildCastAttachmentPreviewCacheKey({
            previewUrl: embed.openGraph.url,
          }),
          () => embed,
        );
      }
    },
    [qc],
  );
};

export { useCastAttachmentPreviewCache, useSetCastAttachmentPreviewCache };
