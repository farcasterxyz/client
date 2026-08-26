import React from 'react';

type ComposerOptimisticImage = {
  previewUrl: string;
  imageUrl: string;
  aspectRatio: number;
  uploadPromise: Promise<Response>;
};

type ComposerOptimisticImagesContextValue = {
  addOptimisticImage: ({ image }: { image: ComposerOptimisticImage }) => void;
  clearOptimisticImages: () => void;
  images: ComposerOptimisticImage[];
};

const ComposerContext =
  React.createContext<ComposerOptimisticImagesContextValue>({} as never);

export function ComposerOptimisticImagesProvider({
  children,
}: React.PropsWithChildren) {
  const [optimisticImages, setOptimisticImages] = React.useState<
    | {
        [imageUrl: string]: ComposerOptimisticImage;
      }
    | undefined
  >(undefined);

  const addOptimisticImage = React.useCallback(
    ({ image }: { image: ComposerOptimisticImage }) => {
      setOptimisticImages((prev) => ({ ...prev, [image.imageUrl]: image }));
    },
    [],
  );

  const clearOptimisticImages = React.useCallback(() => {
    setOptimisticImages(undefined);
  }, []);

  const images = React.useMemo(() => {
    if (typeof optimisticImages === 'undefined') {
      return [];
    }

    return Object.values(optimisticImages);
  }, [optimisticImages]);

  return React.useMemo(
    () => (
      <ComposerContext.Provider
        value={{ addOptimisticImage, clearOptimisticImages, images }}
      >
        {children}
      </ComposerContext.Provider>
    ),
    [children, addOptimisticImage, clearOptimisticImages, images],
  );
}

export const useComposerOptimisticImages = () => {
  return React.useContext(ComposerContext);
};
