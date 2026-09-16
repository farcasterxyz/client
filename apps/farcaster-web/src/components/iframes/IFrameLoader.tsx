import React, {
  forwardRef,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

const IFRAME_DOMAIN_BLOCKLIST = [
  'wallet.farcaster.xyz',
  'wallet-export.farcaster.xyz',
  'wallet.warpcast.com',
  'wallet-export.warpcast.com',
];

interface IFrameLoaderProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  transition?: boolean;
  children?: React.ReactNode;
  backgroundColor?: string;
  width?: number;
  height?: number;
  onLoaded?: () => void;
}

export interface IFrameLoaderRef {
  postMessage: (message: unknown, origin: string) => void;
  refresh: () => void;
  iframe: HTMLIFrameElement | null;
}

// Returns ReactElement instead of ReactNode because the latter allows falsey
// values. We want to make sure we always return children so that the wallet
// iframe is perma-loaded and doesn't need to be reloaded when a mini app opens.
export const IFrameLoader = forwardRef<
  IFrameLoaderRef,
  PropsWithChildren<IFrameLoaderProps>
>(
  (
    { transition, children, width, height, onLoaded, ...iframeProps },
    ref,
  ): ReactElement => {
    const [isLoaded, setIsLoaded] = useState(false);
    const iframeRef = React.useRef<HTMLIFrameElement>(null);

    useEffect(() => {
      setIsLoaded(false);
    }, [iframeProps.src]);

    const handleLoad = useCallback(
      (event: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
        setIsLoaded(true);
        onLoaded?.();
        iframeProps.onLoad?.(event);
      },
      [iframeProps, onLoaded],
    );

    useImperativeHandle(ref, () => ({
      postMessage: (message: unknown, origin: string) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, origin);
        }
      },
      refresh: () => {
        if (iframeRef.current) {
          // eslint-disable-next-line no-self-assign
          iframeRef.current.src = iframeRef.current.src;
        }
      },
      iframe: iframeRef.current,
    }));

    const iframe = useMemo(() => {
      if (!iframeProps.src) {
        return null;
      }

      const url = new URL(iframeProps.src);

      if (
        url.protocol !== 'https:' ||
        IFRAME_DOMAIN_BLOCKLIST.includes(url.hostname)
      ) {
        return null;
      }

      return (
        <iframe
          {...iframeProps}
          ref={iframeRef}
          className={`scrollbar-hide size-full flex-1 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${transition ? 'transition-opacity duration-1000' : ''} ${iframeProps.className || ''}`}
          onLoad={handleLoad}
        />
      );
    }, [handleLoad, iframeProps, isLoaded, transition]);

    // It's important we always render children here otherwise the wallet iframe
    // will get unmounted and remounted!
    return (
      <div
        className="relative flex size-full min-h-0 flex-1 flex-col bg-app"
        style={{ width, height }}
      >
        {!isLoaded && <div className="absolute inset-0 bg-app" />}
        {iframe}
        {children}
      </div>
    );
  },
);
