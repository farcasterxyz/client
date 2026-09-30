import { ApiUserMinimal } from 'farcaster-client-data';
import { useMemo } from 'react';

import { resolveUsernameShort } from '../../utils';

export type FrameAnalyticsProperties = {
  frameUrl: string;
  frameName?: string;
  frameNameExt?: string;
  frameDomain: string;
  isStudioGenerated?: boolean;
  authorFid?: number;
  authorUsername?: string;
  platform?: 'web' | 'mobile';
};

export const frameAnalyticsProperties = ({
  frameUrl,
  frameName,
  author,
  platform,
}: {
  frameUrl: string;
  frameName?: string;
  platform?: 'web' | 'mobile';
  author?: ApiUserMinimal;
}) => {
  const frameDomain = new URL(frameUrl).hostname;
  const authorUsername = author ? resolveUsernameShort(author) : undefined;
  const isStudioGenerated = frameDomain.endsWith('.neynar.app');

  return {
    frameName,
    frameNameExt:
      author && frameName ? `${frameName} by ${authorUsername}` : frameDomain,
    frameUrl,
    frameDomain,
    isStudioGenerated,
    authorFid: author?.fid,
    authorUsername,
    platform,
  };
};

export const useFrameAnalytcsProperties = ({
  frameUrl,
  frameName,
  author,
  platform,
}: {
  frameUrl?: string;
  frameName?: string;
  author?: ApiUserMinimal;
  platform?: 'web' | 'mobile';
}): FrameAnalyticsProperties | undefined => {
  return useMemo<FrameAnalyticsProperties | undefined>(() => {
    if (!frameUrl) {
      return undefined;
    }
    return frameAnalyticsProperties({ frameUrl, frameName, author, platform });
  }, [author, frameName, frameUrl, platform]);
};
