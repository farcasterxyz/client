import { getCloudflareImageUrl } from 'farcaster-client-hooks';
import { useMemo } from 'react';

import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';

import { getAbsoluteUrl } from './urlUtils';

const getImageUrl = ({
  host,
  path,
}: {
  host: string | undefined;
  path: string;
}) => {
  return getAbsoluteUrl({ host, path });
};

const useFastOgImageWithFallback = (url: string | undefined, width: number) => {
  const { host } = useRequest();

  return useMemo(() => {
    return url
      ? {
          imageUrl: getCloudflareImageUrl({
            url,
            windowWidth: width,
            applyWidthLimits: true,
            blockAnimated: true,
            increasedWidth: false,
            width: width,
          }),
          size: width,
        }
      : {
          imageUrl: getImageUrl({
            host,
            path: defaultOGImagePath,
          }),
          size: 512,
        };
  }, [host, url, width]);
};

export { getImageUrl, useFastOgImageWithFallback };
