import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { SNAP_INTERACTED_URLS_TTL_MS } from './constants';
import {
  loadInteractedSnapUrlTimestamps,
  markInteractedSnapUrl,
} from './interactedSnapUrlsModel';
import { snapInteractionKey } from './snapInteractionKey';
import type { InteractedSnapUrlsStore } from './types';

type InteractedSnapUrlsContextValue = {
  hasInteracted: (url: string) => boolean;
  markInteracted: (url: string) => void;
};

const InteractedSnapUrlsContext =
  createContext<InteractedSnapUrlsContextValue | null>(null);

type InteractedSnapUrlsProviderProps = {
  store: InteractedSnapUrlsStore;
  viewerFid: number | undefined;
  children: React.ReactNode;
};

function useInteractedSnapUrls() {
  const ctx = useContext(InteractedSnapUrlsContext);
  if (!ctx) {
    throw new Error(
      'useInteractedSnapUrls must be used within InteractedSnapUrlsProvider',
    );
  }
  return ctx;
}

const InteractedSnapUrlsProvider: React.FC<InteractedSnapUrlsProviderProps> = ({
  store,
  viewerFid,
  children,
}) => {
  const [timestamps, setTimestamps] = useState<Record<string, number>>({});
  const isMountedRef = useRef(false);
  const viewerFidRef = useRef(viewerFid);
  viewerFidRef.current = viewerFid;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setTimestamps({});
    if (viewerFid === undefined) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const loaded = await loadInteractedSnapUrlTimestamps(store, {
          viewerFid,
        });
        if (cancelled) {
          return;
        }
        setTimestamps(loaded);
      } catch {
        // Storage is best-effort; avoid surfacing provider hydration failures.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, viewerFid]);

  const hasInteracted = useCallback(
    (url: string): boolean => {
      if (viewerFid === undefined) {
        return false;
      }
      const key = snapInteractionKey(url);
      if (!key) {
        return false;
      }
      const ts = timestamps[key];
      if (ts === undefined) {
        return false;
      }
      return Date.now() - ts <= SNAP_INTERACTED_URLS_TTL_MS;
    },
    [timestamps, viewerFid],
  );

  const markInteracted = useCallback(
    (url: string) => {
      if (viewerFid === undefined) {
        return;
      }
      void (async () => {
        try {
          const updated = await markInteractedSnapUrl(
            store,
            { viewerFid },
            url,
          );
          if (!isMountedRef.current) {
            return;
          }
          if (viewerFidRef.current !== viewerFid) {
            return;
          }
          setTimestamps(updated);
        } catch {
          // Storage is best-effort; keep interaction marking fire-and-forget.
        }
      })();
    },
    [store, viewerFid],
  );

  const value = useMemo(
    () => ({ hasInteracted, markInteracted }),
    [hasInteracted, markInteracted],
  );

  return (
    <InteractedSnapUrlsContext.Provider value={value}>
      {children}
    </InteractedSnapUrlsContext.Provider>
  );
};

export { InteractedSnapUrlsProvider, useInteractedSnapUrls };
