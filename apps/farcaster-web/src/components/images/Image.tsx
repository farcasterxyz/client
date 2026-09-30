import {
  DetailedHTMLProps,
  FC,
  ImgHTMLAttributes,
  memo,
  useCallback,
  useState,
} from 'react';

export type ImageProps = DetailedHTMLProps<
  ImgHTMLAttributes<{}>,
  HTMLImageElement
> & {
  alt: string;
  fallback?: string;
  src: string;
  /**
   * When true, sets fetchpriority="high" and loading="eager"
   * for LCP-critical images. Use sparingly on above-the-fold images only.
   */
  priority?: boolean;
};

const Image: FC<ImageProps> = memo(
  ({ fallback, src, loading = 'lazy', priority, onError, ...props }) => {
    const [didFailToLoadMap, setDidFailToLoadMap] = useState<
      Record<string, boolean | undefined>
    >({});

    const resolvedSrc = didFailToLoadMap[src] && fallback ? fallback : src;

    const wrappedOnError = useCallback<
      React.ReactEventHandler<HTMLImageElement>
    >(
      (event) => {
        setDidFailToLoadMap((prevMap) => ({ ...prevMap, [src]: true }));

        onError?.(event);
      },
      [onError, src],
    );

    const imageLoading = priority ? 'eager' : loading;
    const imageFetchPriority = priority ? 'high' : undefined;

    return (
      <img
        loading={imageLoading}
        fetchPriority={imageFetchPriority}
        src={resolvedSrc}
        onError={wrappedOnError}
        {...props}
      />
    );
  },
);

Image.displayName = 'Image';

export { Image };
