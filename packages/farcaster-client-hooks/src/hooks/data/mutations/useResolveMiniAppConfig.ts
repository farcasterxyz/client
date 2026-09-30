import { ApiFrameEmbedNextExtended, ApiUser } from 'farcaster-client-data';
import { useCallback } from 'react';

import { useValidateFrameEmbedV2 } from './useValidateFrameEmbedV2';

export type ResolvedMiniAppConfig = {
  url: string;
  name: string;
  splashImageUrl?: string;
  splashBackgroundColor?: string;
  author?: ApiUser;
};

/**
 * Resolves a URL to a mini app launch config by fetching and validating
 * the frame embed metadata. Throws if the URL is not a valid mini app.
 */
const useResolveMiniAppConfig = () => {
  const validateFrameEmbedV2 = useValidateFrameEmbedV2();

  return useCallback(
    async (url: string): Promise<ResolvedMiniAppConfig> => {
      const response = await validateFrameEmbedV2({ url });
      const frameEmbedNext: ApiFrameEmbedNextExtended | undefined =
        response.result.frameEmbedNext;

      if (
        frameEmbedNext?.frameEmbed?.button?.action.type !== 'launch_frame' &&
        frameEmbedNext?.frameEmbed?.button?.action.type !== 'launch_miniapp'
      ) {
        throw new Error(`URL ${url} is not a valid mini app`);
      }

      const action = frameEmbedNext.frameEmbed.button.action;
      if (!action.url) {
        throw new Error(`URL ${url} is not a valid mini app`);
      }

      return {
        url: action.url,
        name: action.name,
        splashImageUrl: action.splashImageUrl,
        splashBackgroundColor: action.splashBackgroundColor,
        author: frameEmbedNext.author,
      };
    },
    [validateFrameEmbedV2],
  );
};

export { useResolveMiniAppConfig };
