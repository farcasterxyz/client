import { SignManifest } from '@farcaster/miniapp-core';
import { ApiJsonFarcasterSignature } from 'farcaster-client-data';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { isValidDomain } from '../utils/DomainUtils';

type SignManifestState = {
  domain: string;
  resolve: (value: ApiJsonFarcasterSignature) => void;
  reject: (
    reason: SignManifest.RejectedByUser | SignManifest.GenericError,
  ) => void;
} | null;

type SignManifestContextValue = {
  signManifest: ({
    domain,
  }: {
    domain: string;
  }) => Promise<ApiJsonFarcasterSignature>;
};

const SignManifestContext = React.createContext<SignManifestContextValue>({
  signManifest: async () => {
    throw new Error('Must be called in SignManifestProvider');
  },
});

export function useSignManifest() {
  const context = React.useContext(SignManifestContext);
  if (!context) {
    throw new Error(
      'useSignManifest must be used within a SignManifestProvider',
    );
  }
  return context;
}

export function SharedSignManifestProvider({
  children,
  url,
  signManifestFn,
  bottomSheetFn,
  onSignManifestRequest,
}: {
  children: React.ReactNode;
  url?: string;
  signManifestFn: (domain: string) => Promise<ApiJsonFarcasterSignature>;
  bottomSheetFn: ({
    onOpen,
    onConfirm,
    domain,
    hostDomain,
  }: {
    onOpen: () => void;
    onConfirm: () => void;
    domain: string;
    hostDomain: string;
  }) => React.ReactNode;
  onSignManifestRequest?: (params: {
    domain: string;
    hostDomain: string;
  }) => void;
}) {
  const [state, setState] = useState<SignManifestState>(null);

  const hostDomain = useMemo(() => {
    if (!url) {
      return null;
    }
    return new URL(url).hostname;
  }, [url]);

  const signManifest = useCallback(
    ({ domain }: { domain: string }) => {
      if (!isValidDomain(domain)) {
        throw new SignManifest.InvalidDomain();
      }
      if (state) {
        throw new SignManifest.GenericError(
          'A manifest is already being signed',
        );
      }

      if (!hostDomain) {
        throw new SignManifest.GenericError('Host domain not found');
      }

      // Report analytics event
      onSignManifestRequest?.({
        domain,
        hostDomain,
      });

      return new Promise<ApiJsonFarcasterSignature>((resolve, reject) => {
        setState({ domain, resolve, reject });
      });
    },
    [state, hostDomain, onSignManifestRequest],
  );

  const onDismiss = useCallback(() => {
    if (state) {
      state.reject(new SignManifest.RejectedByUser());
      setState(null);
    }
  }, [state]);

  const onConfirm = useCallback(async () => {
    if (!state) {
      return;
    }
    try {
      const result = await signManifestFn(state.domain);
      state.resolve(result);
    } catch (e) {
      state.reject(new SignManifest.GenericError('Could not sign manifest'));
    } finally {
      setState(null);
    }
  }, [state, signManifestFn]);

  // Reject any pending request if provider unmounts to avoid dangling promises
  const pendingRef = useRef<typeof state>(null);
  useEffect(() => {
    pendingRef.current = state;
  }, [state]);
  useEffect(() => {
    return () => {
      if (pendingRef.current) {
        pendingRef.current.reject(new SignManifest.RejectedByUser());
      }
    };
  }, []);

  // Reject any pending request when the url (host) changes
  useEffect(() => {
    if (pendingRef.current) {
      pendingRef.current.reject(new SignManifest.RejectedByUser());
      setState(null);
    }
  }, [url]);

  return (
    <SignManifestContext.Provider value={{ signManifest }}>
      {children}

      {!!state &&
        hostDomain &&
        bottomSheetFn({
          onOpen: onDismiss,
          onConfirm,
          domain: state.domain,
          hostDomain,
        })}
    </SignManifestContext.Provider>
  );
}
