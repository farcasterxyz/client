import React from 'react';

export type MediaAsset = {
  src: string;
  w: number;
  h: number;
  uploadPromise: Promise<string>;
  uploadStatus?: 'uploading' | 'uploaded' | 'failed';
  uploadError?: string;
};

type Action =
  | {
      type: 'AddURL';
      castQueueId: string;
      castLocalKey: number;
      url: string;
    }
  | {
      type: 'UpdateURLs';
      castQueueId: string;
      castLocalKey: number;
      urls: string[];
    }
  | {
      type: 'RemoveURL';
      castQueueId: string;
      castLocalKey: number;
      url: string;
    }
  | {
      type: 'AddImage';
      castQueueId: string;
      castLocalKey: number;
      image: MediaAsset;
    }
  | {
      type: 'RemoveImage';
      castQueueId: string;
      castLocalKey: number;
      src: string;
    }
  | {
      type: 'MarkImageUploadComplete';
      castQueueId: string;
      castLocalKey: number;
      src: string;
    }
  | {
      type: 'AddVideo';
      castQueueId: string;
      castLocalKey: number;
      video: MediaAsset;
    }
  | {
      type: 'MarkVideoUploadComplete';
      castQueueId: string;
      castLocalKey: number;
      src: string;
    }
  | {
      type: 'MarkVideoUploadFailed';
      castQueueId: string;
      castLocalKey: number;
      src: string;
      errorMessage: string;
    }
  | {
      type: 'RemoveVideo';
      castQueueId: string;
      castLocalKey: number;
      src: string;
    };

const emptyState = {
  optimisticVideos: [] as MediaAsset[],
  optimisticImages: [] as MediaAsset[],
  urls: [] as string[],
  removedUrls: [] as string[],
};

interface State {
  [lookupKey: string]: {
    optimisticVideos: MediaAsset[];
    optimisticImages: MediaAsset[];
    urls: string[];
    removedUrls: string[];
  };
}

function optimisticMediaEmbedsReducer(state: State, action: Action): State {
  const { lookupKey } = getOptimisticMediaLookupKey({
    castQueueId: action.castQueueId,
    castLocalKey: action.castLocalKey,
  });

  let updatedState = state;

  if (!state[lookupKey]) {
    state = { ...state, [lookupKey]: emptyState };
  }

  switch (action.type) {
    case 'AddURL': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          urls: [
            ...state[lookupKey].urls.filter((url) => url !== action.url),
            action.url,
          ],
        },
      };
      break;
    }
    case 'UpdateURLs': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          urls: [
            ...action.urls.filter(
              (url) => (state[lookupKey].removedUrls || []).indexOf(url) === -1,
            ),
          ],
        },
      };
      break;
    }
    case 'RemoveURL': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          urls: [...state[lookupKey].urls.filter((url) => url !== action.url)],
          removedUrls: [
            ...state[lookupKey].removedUrls.filter((url) => url !== action.url),
            action.url,
          ],
        },
      };
      break;
    }
    case 'AddImage': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticImages: [
            ...state[lookupKey].optimisticImages,
            action.image,
          ],
        },
      };
      break;
    }
    case 'RemoveImage': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticImages: [
            ...state[lookupKey].optimisticImages.filter(
              (o) => o.src !== action.src,
            ),
          ],
        },
      };
      break;
    }
    case 'MarkImageUploadComplete': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticImages: state[lookupKey].optimisticImages.map((image) =>
            image.src === action.src
              ? { ...image, uploadStatus: 'uploaded' }
              : image,
          ),
        },
      };
      break;
    }
    case 'AddVideo': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticVideos: [
            ...state[lookupKey].optimisticVideos,
            action.video,
          ],
        },
      };
      break;
    }
    case 'MarkVideoUploadComplete': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticVideos: state[lookupKey].optimisticVideos.map((video) =>
            video.src === action.src
              ? { ...video, uploadStatus: 'uploaded', uploadError: undefined }
              : video,
          ),
        },
      };
      break;
    }
    case 'MarkVideoUploadFailed': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticVideos: state[lookupKey].optimisticVideos.map((video) =>
            video.src === action.src
              ? {
                  ...video,
                  uploadStatus: 'failed',
                  uploadError: action.errorMessage,
                }
              : video,
          ),
        },
      };
      break;
    }
    case 'RemoveVideo': {
      updatedState = {
        ...state,
        [lookupKey]: {
          ...state[lookupKey],
          optimisticVideos: [
            ...state[lookupKey].optimisticVideos.filter(
              (o) => o.src !== action.src,
            ),
          ],
        },
      };
      break;
    }
  }

  return updatedState;
}

type OptimisticMediaEmbedsProviderContextValue = [
  State,
  (action: Action) => void,
];

const OptimisticMediaEmbedsProviderContext =
  React.createContext<OptimisticMediaEmbedsProviderContextValue>([] as never);

type OptimisticMediaEmbedsProviderProps = React.PropsWithChildren;

export function OptimisticMediaEmbedsProvider({
  children,
}: OptimisticMediaEmbedsProviderProps) {
  const [state, dispatch] = React.useReducer(optimisticMediaEmbedsReducer, {});

  return React.useMemo(
    () => (
      <OptimisticMediaEmbedsProviderContext.Provider value={[state, dispatch]}>
        {children}
      </OptimisticMediaEmbedsProviderContext.Provider>
    ),
    [children, state],
  );
}

export const useOptimisticMediaEmbeds = () => {
  return React.useContext(OptimisticMediaEmbedsProviderContext);
};

export function getOptimisticMediaLookupKey({
  castQueueId,
  castLocalKey,
}: {
  castQueueId: string;
  castLocalKey: number;
}): { lookupKey: string } {
  return { lookupKey: `${castQueueId}:${castLocalKey}` };
}
