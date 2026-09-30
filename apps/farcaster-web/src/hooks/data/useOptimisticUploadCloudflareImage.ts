import {
  useFetchImageUploadUrl,
  WARPCAST_CLOUDFLARE_CDN_PREFIX,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';

const IMAGE_EMBED_MAX_DIMENSIONS = {
  // We will never render an image above this resolution on any of our clients.
  // Opportunity for another client around image being centered. (NFT feeds etc.)
  width: 2000,
  height: 2000,
  size: 1000000,
};

const CLOUDFLARE_ANIMATION_TOO_LARGE_ERROR_CODE = 5443;
export const IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE =
  'This GIF is too large to upload. Try a lower-resolution or shorter GIF.';

type CloudflareImagesUploadResponse = {
  success?: boolean;
  errors?: { code?: number; message?: string }[];
};

class CloudflareImagesUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudflareImagesUploadError';
  }
}

async function getCloudflareImagesUploadErrorMessage(response: Response) {
  let responseBody: CloudflareImagesUploadResponse | undefined;

  try {
    responseBody = (await response.json()) as CloudflareImagesUploadResponse;
  } catch {}

  const cloudflareError = responseBody?.errors?.find(
    (error) => typeof error.message === 'string',
  );

  if (cloudflareError?.code === CLOUDFLARE_ANIMATION_TOO_LARGE_ERROR_CODE) {
    return IMAGE_UPLOAD_ANIMATION_TOO_LARGE_MESSAGE;
  }

  if (cloudflareError?.message) {
    return cloudflareError.message;
  }

  return 'Cloudflare failed to accept the image';
}

async function assertCloudflareImagesUploadAccepted(response: Response) {
  if (response.ok) {
    return response;
  }

  throw new CloudflareImagesUploadError(
    await getCloudflareImagesUploadErrorMessage(response),
  );
}

function containImageRes(
  w: number,
  h: number,
): [width: number, height: number] {
  let scale = 1;

  const { width: maxWidth, height: maxHeight } = IMAGE_EMBED_MAX_DIMENSIONS;
  if (w > maxWidth || h > maxHeight) {
    scale = w > h ? maxWidth / w : maxHeight / h;
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }

  return [w, h];
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const blobUrl = URL.createObjectURL(file);
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      };
      img.src = blobUrl;
    });
  } catch (err) {
    URL.revokeObjectURL(blobUrl);
    throw err;
  }
}

function getDataUriSize(dataUri: string): number {
  const base64Data = dataUri.split(',')[1];
  if (!base64Data) {
    return 0;
  }
  const padding = (base64Data.match(/=+$/) || [''])[0].length;
  return (base64Data.length * 3) / 4 - padding;
}

async function getFileDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const blobURL = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      URL.revokeObjectURL(blobURL);
      resolve({ width, height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(blobURL);
      reject(err);
    };
    img.src = blobURL;
  });
}

function dataUriToBlob(dataUri: string): Blob {
  const byteString = atob(dataUri.split(',')[1]);
  const arrayBuffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    arrayBuffer[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: 'image/jpeg' });
}

async function compressImage({ file }: { file: File }): Promise<File> {
  const { width, height } = await getFileDimensions(file);

  const [w, h] = containImageRes(width, height);

  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  for (let i = 10; i > 0; i--) {
    const factor = i / 10;
    const dataUri = canvas.toDataURL('image/jpeg', factor);
    if (getDataUriSize(dataUri) <= IMAGE_EMBED_MAX_DIMENSIONS.size) {
      const blob = dataUriToBlob(dataUri);
      return new File([blob], file.name, { type: 'image/jpeg' });
    }
  }

  throw new Error('Unable to transform image');
}

const useOptimisticUploadCloudflareImage = () => {
  const fetchImageUploadUrl = useFetchImageUploadUrl();

  return useCallback(
    async ({
      file,
      imageUploaderPromise,
    }: {
      file: File;
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
        typeof fetchImageUploadUrlResponse.url === 'undefined' ||
        typeof fetchImageUploadUrlResponse.optimisticImageId === 'undefined'
      ) {
        return;
      }

      const imageUploadUrl = fetchImageUploadUrlResponse.url;
      const imageUrl = `${WARPCAST_CLOUDFLARE_CDN_PREFIX}/${fetchImageUploadUrlResponse.optimisticImageId}/original`;

      const uploadPromise = new Promise<Response>((resolve, reject) => {
        (async () => {
          let finalFileToUpload = file;

          if (file.type.indexOf('gif') === -1) {
            finalFileToUpload = await compressImage({
              file,
            });
          }

          const body = new FormData();

          // @ts-ignore-next-line
          body.append('file', finalFileToUpload, finalFileToUpload.name);

          const response = await fetch(imageUploadUrl, {
            method: 'POST',
            body,
          });

          return resolve(assertCloudflareImagesUploadAccepted(response));
        })().catch(reject);
      });

      const previewUrl = URL.createObjectURL(file);

      return {
        version: 'v2',
        previewUrl,
        imageUrl,
        uploadPromise,
      } as {
        version: 'v2';
        previewUrl: string;
        imageUrl: string;
        uploadPromise: Promise<Response>;
      };
    },
    [fetchImageUploadUrl],
  );
};

export { useOptimisticUploadCloudflareImage };
