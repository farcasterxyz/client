import { ApiFarcasterFrame } from 'farcaster-client-data';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// Frame functionality has been deprecated and removed
import { frameUrlToDomain } from '../utils';

type FrameContextValue = {
  frame: ApiFarcasterFrame;
  frameUrl: string;
  frameDomain: string;
  // Deprecated - these will throw errors if called
  postJSON: () => Promise<never>;
  postTransaction: () => Promise<never>;
  dismissAppError: () => void;
};

const FrameContext = createContext<FrameContextValue>(null!);

export const useFrame = () => useContext(FrameContext);

export type FrameProviderProps = {
  firstFrameUrl: string;
  firstFrame: ApiFarcasterFrame;
  children: ReactNode;
};

export function FrameProvider({
  firstFrame,
  firstFrameUrl,
  children,
}: FrameProviderProps) {
  const [frame] = useState<ApiFarcasterFrame>(firstFrame);
  const [frameUrl] = useState<string>(firstFrameUrl);

  // Deprecated methods that throw errors when called
  const postTransaction = useCallback(async (): Promise<never> => {
    throw new Error('Frame transactions are no longer supported');
  }, []);

  const postJSON = useCallback(async (): Promise<never> => {
    throw new Error('Frame JSON operations are no longer supported');
  }, []);

  const dismissAppError = useCallback(() => {
    // No-op for compatibility
  }, []);

  const contextValue = useMemo(
    () => ({
      frame,
      frameUrl,
      frameDomain: frameUrlToDomain(frameUrl),
      // Deprecated methods for backward compatibility
      postJSON,
      postTransaction,
      dismissAppError,
    }),
    [frame, frameUrl, postJSON, postTransaction, dismissAppError],
  );

  return (
    <FrameContext.Provider value={contextValue}>
      {children}
    </FrameContext.Provider>
  );
}
