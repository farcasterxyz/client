import { useFetchImageUploadUrl } from 'farcaster-client-hooks';
import { useCallback } from 'react';

const useUploadCloudflareImage = () => {
  const fetchImageUploadUrl = useFetchImageUploadUrl();

  return useCallback(
    async ({ uri, name }: { uri: string; name: string }) => {
      const fetchImageUploadUrlResponse = await fetchImageUploadUrl();

      if (
        typeof fetchImageUploadUrlResponse === 'undefined' ||
        typeof fetchImageUploadUrlResponse.url === 'undefined'
      ) {
        return;
      }

      const imageUploadUrl = fetchImageUploadUrlResponse.url;

      const file = {
        uri: uri,
        type: 'image/jpeg',
        name: name,
      };

      const body = new FormData();

      // @ts-ignore-next-line
      body.append('file', file);

      const r = await fetch(imageUploadUrl, {
        method: 'POST',
        body,
      });

      const response: { success: boolean; result: { variants: string[] } } =
        await r.json();

      if (
        typeof response === 'undefined' ||
        !response.success ||
        typeof response.result.variants === 'undefined'
      ) {
        return undefined;
      }

      const originalVariantImageUrl = response.result.variants.find((o) =>
        o.endsWith('/original'),
      );

      if (typeof originalVariantImageUrl === 'undefined') {
        return undefined;
      }

      return { imageUrl: originalVariantImageUrl };
    },
    [fetchImageUploadUrl],
  );
};

export { useUploadCloudflareImage };
