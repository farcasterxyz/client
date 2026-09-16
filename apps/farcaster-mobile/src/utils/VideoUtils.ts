import * as FileSystem from 'expo-file-system/legacy';
import {
  MAX_VIDEO_LENGTH_SECONDS,
  sleep,
  useGetVideoState,
  usePrepareVideoUpload,
  useTelemetry,
} from 'farcaster-client-hooks';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { getVideoMetaData, Video } from 'react-native-compressor';
import { Upload } from 'tus-js-client';

import { trackError } from './ErrorUtils';

function getMimeType(extension: string): string {
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mpeg':
      return 'video/mpeg';
    case 'mov':
      return 'video/quicktime';
    default:
      // Don't want to hard throw here. Best attempt for upload later.
      return 'video/mp4';
  }
}

const createVideoUploadTraceId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `video-upload-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const compactVideoMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const value = metadata as Record<string, unknown>;
  return {
    durationSeconds: value.duration,
    size: value.size,
    width: value.width,
    height: value.height,
    extension: value.extension,
    bitrate: value.bitrate,
  };
};

export async function videoTooLong(uri: string): Promise<boolean> {
  try {
    const info = await getVideoMetaData(uri);
    return info.duration > MAX_VIDEO_LENGTH_SECONDS;
  } catch (e: unknown) {
    // Ignore
    return false;
  }
}

export const compressVideo = async ({
  forceSkipCompression,
  fileName,
  uri,
  signal,
  onProgress,
}: {
  forceSkipCompression: boolean;
  fileName: string;
  uri: string;
  signal: AbortSignal;
  onProgress: (progress: number) => void;
}) => {
  const metadata = await getVideoMetaData(uri);

  if (forceSkipCompression) {
    return {
      size: metadata.size,
      uri: uri,
      type: getMimeType(metadata.extension),
      name: fileName,
      clientUploadMetadata: {
        compressionAttempted: false,
        forceSkipCompression: true,
        original: compactVideoMetadata(metadata),
        final: compactVideoMetadata(metadata),
      },
    };
  }

  try {
    const compressedUri = await Video.compress(
      uri,
      {
        compressionMethod: 'manual',
        bitrate: 3_000_000,
        maxSize: 1920,
        minimumFileSizeForCompress: 25,
        getCancellationId: (id) => {
          signal.addEventListener('abort', () => {
            Video.cancelCompression(id);
          });
        },
      },
      onProgress,
    );

    const compressedMetadata = await getVideoMetaData(compressedUri);

    return {
      size: compressedMetadata.size,
      uri: compressedUri,
      type: getMimeType(compressedMetadata.extension),
      name: fileName,
      clientUploadMetadata: {
        compressionAttempted: true,
        compressionSucceeded: true,
        forceSkipCompression: false,
        original: compactVideoMetadata(metadata),
        final: compactVideoMetadata(compressedMetadata),
      },
    };
  } catch (e) {
    trackError('Error compressing video', { error: e });
    return {
      size: metadata.size,
      uri: uri,
      type: getMimeType(metadata.extension),
      name: fileName,
      clientUploadMetadata: {
        compressionAttempted: true,
        compressionSucceeded: false,
        forceSkipCompression: false,
        original: compactVideoMetadata(metadata),
        final: compactVideoMetadata(metadata),
        compressionError: e instanceof Error ? e.message : `${e}`,
      },
    };
  }
};

const HEAVY_COMPRESSION_UPLOAD_FLOW = Platform.OS === 'android';

type FileOrBlob =
  | {
      uri: string;
      name: string;
      type: string;
      size: number;
    }
  | Blob;

const TELEMETRY_EVENT_VIDEO_UPLOAD = 'videos:upload';
export const TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR = 'videos:upload:error';
const TELEMETRY_EVENT_VIDEO_UPLOAD_PROGRESS = 'videos:upload:progress';
const TELEMETRY_EVENT_VIDEO_UPLOAD_SUCCESS = 'videos:upload:success';
const VIDEO_UPLOAD_IDLE_TIMEOUT_MS = 2 * 60 * 1000;

export function useUploadVideo(): ({
  fileUri,
}: {
  fileUri: string;
}) => Promise<string> {
  const { startAction, stopAction, addAction } = useTelemetry();

  const prepareVideoUpload = usePrepareVideoUpload();
  const getVideoState = useGetVideoState();

  const pollVideoUntilReady = useCallback(
    async ({
      videoId,
      timeoutMs = 20 * 60 * 1000,
      baseDelay = 1000,
    }: {
      videoId: string;
      timeoutMs?: number;
      baseDelay?: number;
    }): Promise<string> => {
      const start = Date.now();
      let attempt = 0;

      for (;;) {
        if (Date.now() - start > timeoutMs) {
          throw new Error('video-processing-timeout');
        }

        try {
          const v = await getVideoState({ videoId });
          if (v.state === 'ready' && v.embed.width && v.embed.height) {
            return `https://stream.farcaster.xyz/v1/video/${videoId}.m3u8`;
          }
          if (v.state === 'failed') {
            throw new Error('video-processing-failed');
          }
        } catch (err) {
          // network hiccup -> keep polling
        }

        attempt++;
        const wait = baseDelay * Math.min(8, attempt); // linear-ish backoff
        await sleep(wait);
      }
    },
    [getVideoState],
  );

  return useCallback(
    async ({ fileUri }: { fileUri: string }) => {
      const uploadStart = Date.now();

      startAction(TELEMETRY_EVENT_VIDEO_UPLOAD, undefined, uploadStart);

      // Make sure the uri is RN/tus friendly to avoid "cannot fetch file.uri as Blob"
      // 1) Ensure it starts with file://
      // 2) If it's content:// (Android), copy to a tmp file first
      const normalized = await ensureLocalFile(fileUri);

      const abortController = new AbortController();

      const compressed = await compressVideo({
        fileName: 'video-embed',
        uri: normalized.uri,
        signal: abortController.signal,
        onProgress: () => {},
        forceSkipCompression: !HEAVY_COMPRESSION_UPLOAD_FLOW,
      });

      const { size: videoSizeBytes, type, name, uri } = compressed;
      const uploadTraceId = createVideoUploadTraceId();

      const fileOrBlob: FileOrBlob = {
        uri,
        name: name,
        type: type,
        size: videoSizeBytes,
      };

      const {
        videoId,
        uploadUrl,
        headers,
        metadata: extraMeta,
      } = await prepareVideoUpload({
        videoSizeBytes: videoSizeBytes,
        supportsDynamicUpload: true,
        clientUploadMetadata: {
          uploadTraceId,
          source: 'mobile_upload_video',
          platform: Platform.OS,
          file: {
            name,
            type,
            size: videoSizeBytes,
          },
          compressor: compressed.clientUploadMetadata,
        },
      });

      const uploadPromise = new Promise<string>((resolve, reject) => {
        let upload: Upload | undefined;
        let uploadIdleTimeout: ReturnType<typeof setTimeout> | undefined;
        let uploadTransportFinished = false;

        const clearUploadIdleTimeout = () => {
          if (uploadIdleTimeout) {
            clearTimeout(uploadIdleTimeout);
            uploadIdleTimeout = undefined;
          }
        };

        const finishUploadTransport = () => {
          if (uploadTransportFinished) {
            return false;
          }

          uploadTransportFinished = true;
          clearUploadIdleTimeout();
          return true;
        };

        const resetUploadIdleTimeout = () => {
          if (uploadTransportFinished) {
            return;
          }

          clearUploadIdleTimeout();
          uploadIdleTimeout = setTimeout(() => {
            if (!finishUploadTransport()) {
              return;
            }

            const error = new Error('Video upload stalled. Please try again.');
            addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
              error,
              location: 'idle-timeout',
              reason: 'video-upload-stalled',
              uploadTraceId,
              videoId,
            });

            void upload?.abort();
            reject(error);
          }, VIDEO_UPLOAD_IDLE_TIMEOUT_MS);
        };

        const handleError = (error: unknown) => {
          if (!finishUploadTransport()) {
            return;
          }

          addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
            error,
            location: 'onError',
            uploadTraceId,
            videoId,
          });
          reject(error as Error);
        };

        const handleSuccess = async () => {
          if (!finishUploadTransport()) {
            return;
          }

          try {
            const result = await pollVideoUntilReady({ videoId });

            stopAction(TELEMETRY_EVENT_VIDEO_UPLOAD, {
              videoId,
              uploadTraceId,
              duration: Date.now() - uploadStart,
            });

            addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_SUCCESS, {
              videoId,
              uploadTraceId,
            });

            resolve(result);
          } catch (error) {
            addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
              error: error,
              location: 'onSuccess',
              uploadTraceId,
              videoId,
            });

            reject(error as Error);
          }
        };

        let lastProgressDecileSent = -1;

        const handleProgress = ({
          uploadedBytes,
          totalBytes,
          progress,
        }: {
          fileUri: string;
          uploadedBytes: number;
          totalBytes: number;
          progress: number;
        }) => {
          const decile = Math.min(10, Math.floor((progress ?? 0) * 10));
          if (decile <= lastProgressDecileSent) {
            return;
          }
          lastProgressDecileSent = decile;

          addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_PROGRESS, {
            progress: progress,
            location: 'onProgress',
            uploadTraceId,
            videoId,
            uploadedBytes,
            totalBytes,
          });
        };

        try {
          upload = new Upload(fileOrBlob as unknown as File, {
            endpoint: uploadUrl,
            headers: headers as Record<string, string>,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: {
              filetype: type,
              name,
              uploadTraceId,
              ...(extraMeta as Record<string, string>),
            },
            chunkSize: 5242880,
            onError: handleError,
            onProgress(bytesUploaded: number, bytesTotal: number) {
              resetUploadIdleTimeout();
              handleProgress({
                fileUri: uri,
                uploadedBytes: bytesUploaded,
                totalBytes: bytesTotal,
                progress: bytesTotal > 0 ? bytesUploaded / bytesTotal : 0,
              });
            },
            async onSuccess() {
              await handleSuccess();
            },
          });

          abortController.signal.addEventListener('abort', () => {
            if (!finishUploadTransport()) {
              return;
            }

            void upload?.abort();
            reject(new Error('upload-aborted'));
          });

          resetUploadIdleTimeout();
          upload.start();
        } catch (e) {
          if (!finishUploadTransport()) {
            return;
          }

          addAction(TELEMETRY_EVENT_VIDEO_UPLOAD_ERROR, {
            error: e,
            location: 'try-catch',
            uploadTraceId,
            videoId,
          });
          reject(e as Error);
        }
      });

      return uploadPromise;
    },
    [
      addAction,
      pollVideoUntilReady,
      prepareVideoUpload,
      startAction,
      stopAction,
    ],
  );
}

export async function ensureLocalFile(uri: string) {
  try {
    // Example impl using expo-file-system
    // - If already file:// just return
    // - If content:// copy to FileSystem.cacheDirectory
    // Adapt as needed for your stack.
    if (uri.startsWith('file://')) {
      return { uri };
    }

    const tmp = `${FileSystem.cacheDirectory}upload-${Date.now()}.bin`;
    await FileSystem.copyAsync({ from: uri, to: tmp });
    return { uri: tmp };
  } catch {
    return { uri };
  }
}
