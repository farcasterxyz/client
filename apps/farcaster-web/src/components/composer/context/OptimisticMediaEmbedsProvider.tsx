import React from 'react';

export type LocallyProbedVideo = {
  src: string;
  w: number;
  h: number;
};

export type LocallyProbedImage = {
  src: string;
  w: number;
  h: number;
};

type Action =
  | {
      type: 'AddImage';
      castLocalKey: number;
      image: LocallyProbedImage;
    }
  | {
      type: 'RemoveImage';
      castLocalKey: number;
      image: string;
    }
  | {
      type: 'AddVideo';
      castLocalKey: number;
      video: LocallyProbedVideo;
    }
  | {
      type: 'RemoveVideo';
      castLocalKey: number;
      video: string;
    };

const emptyState = {
  optimisticImages: [] as LocallyProbedImage[],
  optimisticVideos: [] as LocallyProbedVideo[],
};

interface State {
  [castLocalKey: string]: {
    optimisticImages: LocallyProbedImage[];
    optimisticVideos: LocallyProbedVideo[];
  };
}

function optimisticMediaEmbedsReducer(state: State, action: Action): State {
  let updatedState = state;

  if (!state[action.castLocalKey]) {
    state = { ...state, [action.castLocalKey]: emptyState };
  }

  switch (action.type) {
    case 'AddImage': {
      updatedState = {
        ...state,
        [action.castLocalKey]: {
          ...state[action.castLocalKey],
          optimisticImages: [
            ...state[action.castLocalKey].optimisticImages,
            action.image,
          ],
        },
      };
      break;
    }
    case 'RemoveImage': {
      updatedState = {
        ...state,
        [action.castLocalKey]: {
          ...state[action.castLocalKey],
          optimisticImages: [
            ...state[action.castLocalKey].optimisticImages.filter(
              (o) => o.src !== action.image,
            ),
          ],
        },
      };
      break;
    }
    case 'AddVideo': {
      updatedState = {
        ...state,
        [action.castLocalKey]: {
          ...state[action.castLocalKey],
          optimisticVideos: [
            ...state[action.castLocalKey].optimisticVideos,
            action.video,
          ],
        },
      };
      break;
    }
    case 'RemoveVideo': {
      updatedState = {
        ...state,
        [action.castLocalKey]: {
          ...state[action.castLocalKey],
          optimisticVideos: [
            ...state[action.castLocalKey].optimisticVideos.filter(
              (o) => o.src !== action.video,
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
