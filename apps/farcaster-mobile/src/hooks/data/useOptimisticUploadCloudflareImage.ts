import { Image } from 'expo-image';
import {
  useFetchImageUploadUrl,
  WARPCAST_CLOUDFLARE_CDN_PREFIX,
  wrapWithWrpCdnForPrefetching,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

const prefetchAllVariants = async ({ variants }: { variants: string[] }) => {
  if (variants.length !== 0) {
    const cloudflaredVariants = variants
      .filter(
        (variant) =>
          variant.endsWith('/original') ||
          variant.indexOf('rectcontain') !== -1,
      )
      .map((variant) => wrapWithWrpCdnForPrefetching({ url: variant }));

    Image.prefetch(cloudflaredVariants, {
      cachePolicy: 'memory-disk',
    });
  }
};

const useOptimisticUploadCloudflareImage = () => {
  const fetchImageUploadUrl = useFetchImageUploadUrl();

  return useCallback(
    async ({
      uri,
      name,
      imageUploaderPromise,
    }: {
      uri: string;
      name: string;
      imageUploaderPromise?: Promise<{
        url: string;
        optimisticImageId: string;
      }>;
    }) => {
      const fetcher =
        typeof imageUploaderPromise !== 'undefined'
          ? imageUploaderPromise
          : fetchImageUploadUrl();

      const fetchImageUploadUrlResponse = await fetcher;

      if (
        typeof fetchImageUploadUrlResponse === 'undefined' ||
        typeof fetchImageUploadUrlResponse.url === 'undefined'
      ) {
        return;
      }

      const imageUploadUrl = fetchImageUploadUrlResponse.url;
      const imageUrl = `${WARPCAST_CLOUDFLARE_CDN_PREFIX}/${fetchImageUploadUrlResponse.optimisticImageId}/original`;

      const file = {
        uri: uri,
        type: 'image/jpeg',
        name: name,
      };

      const body = new FormData();
      // @ts-ignore-next-line
      body.append('file', file);

      const uploadPromise = fetch(imageUploadUrl, {
        method: 'POST',
        body,
      });

      return {
        uploadPromise,
        previewUri: uri,
        imageUrl,
      };
    },
    [fetchImageUploadUrl],
  );
};

export { prefetchAllVariants, useOptimisticUploadCloudflareImage };
