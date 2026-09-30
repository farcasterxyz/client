import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { getStorage } from '~/utils/FastStorageUtils';

interface CameraAndMicrophoneAccessContextValue {
  hasPermissions: boolean;
  isRequestPending: boolean;

  // When the user dismisses the permission request, we need to dismiss the pending request without setting the permissions
  dismissPendingRequest: () => void;
  requestPermissions: () => Promise<void>;
  setPermissions: (granted: boolean) => void;
}

const CameraAndMicrophoneAccessContext =
  createContext<CameraAndMicrophoneAccessContextValue | null>(null);

export function CameraAndMicrophoneAccessProvider({
  children,
  domain,
}: {
  children: React.ReactNode;
  domain: string;
}) {
  const [hasPermissions, setHasPermissionsState] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const pendingRequest = useRef<{
    resolve: () => void;
    reject: () => void;
  } | null>(null);

  // Load permissions on mount and domain change
  useEffect(() => {
    const value = getStorage().getString(`mediaPermissions:${domain}`);
    setHasPermissionsState(value === 'grant');
    setIsRequestPending(false);
    pendingRequest.current?.reject();
    pendingRequest.current = null;
  }, [domain]);

  const setPermissions = useCallback(
    (granted: boolean) => {
      // Update storage
      if (granted) {
        getStorage().set(`mediaPermissions:${domain}`, 'grant');
      } else {
        getStorage().delete(`mediaPermissions:${domain}`);
      }

      // Update state
      setHasPermissionsState(granted);

      // Resolve pending request
      if (pendingRequest.current) {
        if (granted) {
          pendingRequest.current.resolve();
        } else {
          pendingRequest.current.reject();
        }
        pendingRequest.current = null;
        setIsRequestPending(false);
      }
    },
    [domain],
  );

  const dismissPendingRequest = useCallback(() => {
    // Reject the pending request without changing permissions
    setIsRequestPending(false);
    if (pendingRequest.current) {
      pendingRequest.current.reject();
      pendingRequest.current = null;
    }
  }, []);

  const requestPermissions = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // If already has permissions, resolve immediately
      if (hasPermissions) {
        resolve();
        return;
      }

      // Set up new request
      pendingRequest.current = { resolve, reject };
      setIsRequestPending(true);
    });
  }, [hasPermissions]);

  const value = {
    hasPermissions,
    isRequestPending,
    requestPermissions,
    setPermissions,
    dismissPendingRequest,
  };

  return (
    <CameraAndMicrophoneAccessContext.Provider value={value}>
      {children}
    </CameraAndMicrophoneAccessContext.Provider>
  );
}

export function useCameraAndMicrophoneAccess() {
  const context = useContext(CameraAndMicrophoneAccessContext);
  if (!context) {
    throw new Error(
      'useCameraAndMicrophoneAccess must be used within CameraAndMicrophoneAccessProvider',
    );
  }
  return context;
}
