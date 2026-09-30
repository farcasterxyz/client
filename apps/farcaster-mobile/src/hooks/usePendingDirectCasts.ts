import {
  ApiDirectCastMessageV3,
  isHandledFetchError,
} from 'farcaster-client-data';
import {
  getOptimisticMessageFromSendDirectCastData,
  SendDirectCastParams,
  useSendDirectCast,
} from 'farcaster-client-hooks';
import * as React from 'react';

import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/ErrorUtils';
import { deleteItem, getItem, setItem } from '~/utils/StorageUtils';

import { useAppState } from './useAppState';

const PENDING_DIRECT_CASTS_KEY = 'pending-direct-casts';

type StoredPendingDirectCasts = {
  userFid: number;
  pendingDirectCasts: PendingDirectCast[];
};
type ReturnedPendingDirectCasts = {
  pendingDirectCasts: PendingDirectCast[];
};
type PendingDirectCast = {
  sendDirectCastParams: SendDirectCastParams;
};

async function getPendingDirectCasts(
  currentUserFid: number,
): Promise<ReturnedPendingDirectCasts | undefined> {
  const stored = await getItem<StoredPendingDirectCasts | undefined>({
    key: PENDING_DIRECT_CASTS_KEY,
    fallback: undefined,
  });
  if (!stored) {
    return stored;
  }
  const { userFid, pendingDirectCasts } = stored;
  if (userFid !== currentUserFid) {
    return undefined;
  }
  return { pendingDirectCasts };
}

async function setPendingDirectCasts(
  currentUserFid: number,
  pendingDirectCasts: ReturnedPendingDirectCasts | undefined,
): Promise<void> {
  if (!pendingDirectCasts) {
    await deleteItem({ key: PENDING_DIRECT_CASTS_KEY });
    return;
  }
  await setItem({
    key: PENDING_DIRECT_CASTS_KEY,
    value: { ...pendingDirectCasts, userFid: currentUserFid },
  });
}

type PendingDirectCasts = {
  loadedFromStorage: boolean;
  pendingDirectCasts: PendingDirectCast[];
};

export type UsePendingDirectCastsReturn = {
  sendDirectCast: (params: SendDirectCastParams) => void;
  optimisticPendingDirectCasts: ApiDirectCastMessageV3[];
};

function usePendingDirectCasts(): UsePendingDirectCastsReturn {
  const [pendingDCs, setPendingDCs] = React.useState<PendingDirectCasts>({
    loadedFromStorage: false,
    pendingDirectCasts: [],
  });

  const currentUser = useCurrentUser_UNSAFE();
  const currentUserFid = currentUser.fid;

  React.useEffect(() => {
    // This effect loads pending DCs from storage. If any have been queued
    // before we finish loading, we'll save them to the storage (along with
    // what's already there) once loading concludes.
    (async () => {
      const stored = await getPendingDirectCasts(currentUserFid);
      setPendingDCs((prevPendingDCs) => {
        const pendingCastsFromStore = stored ? stored.pendingDirectCasts : [];
        if (prevPendingDCs.pendingDirectCasts.length === 0) {
          return {
            loadedFromStorage: true,
            pendingDirectCasts: pendingCastsFromStore,
          };
        }
        const newPendingDirectCasts = [
          ...pendingCastsFromStore,
          ...prevPendingDCs.pendingDirectCasts,
        ];
        setPendingDirectCasts(currentUserFid, {
          pendingDirectCasts: newPendingDirectCasts,
        });
        return {
          loadedFromStorage: true,
          pendingDirectCasts: newPendingDirectCasts,
        };
      });
    })();
  }, [currentUserFid]);

  const pendingDCSendStatusRef = React.useRef<{
    successfulSends: number;
    currentlySending: Set<string>;
    failedAttempts: Map<string, number>;
  }>({
    successfulSends: 0,
    currentlySending: new Set<string>(),
    failedAttempts: new Map<string, number>(),
  });

  // We persist all undelivered message to local state, so that if they fail to
  // send we can retry later. We only remove the messages from that state when
  // sending succeeds.
  const sendDirectCast = React.useCallback(
    (params: SendDirectCastParams) => {
      pendingDCSendStatusRef.current.successfulSends = 0;
      const pendingDirectCast = { sendDirectCastParams: params };
      setPendingDCs((prevPendingDCs) => {
        const newPendingDirectCasts = [
          ...prevPendingDCs.pendingDirectCasts,
          pendingDirectCast,
        ];
        if (!prevPendingDCs.loadedFromStorage) {
          return {
            loadedFromStorage: false,
            pendingDirectCasts: newPendingDirectCasts,
          };
        }
        // We only save to the store if we've finished loading from the store,
        // to avoid overwriting. Once loading concludes, the effect above will
        // make sure we save anything we haven't saved yet.
        setPendingDirectCasts(currentUserFid, {
          pendingDirectCasts: newPendingDirectCasts,
        });
        return {
          loadedFromStorage: true,
          pendingDirectCasts: newPendingDirectCasts,
        };
      });
    },
    [currentUserFid],
  );

  const removePendingDirectCast = React.useCallback(
    (messageId: string) => {
      setPendingDCs((prevPendingDCs) => {
        const prevPendingDirectCasts = prevPendingDCs.pendingDirectCasts;
        const newPendingDirectCasts = prevPendingDirectCasts.filter(
          (pendingDC) =>
            pendingDC.sendDirectCastParams.data.messageId !== messageId,
        );
        if (newPendingDirectCasts.length === prevPendingDirectCasts.length) {
          return prevPendingDCs;
        }
        if (prevPendingDCs.loadedFromStorage) {
          setPendingDirectCasts(currentUserFid, {
            pendingDirectCasts: newPendingDirectCasts,
          });
        }
        return {
          ...prevPendingDCs,
          pendingDirectCasts: newPendingDirectCasts,
        };
      });
    },
    [currentUserFid],
  );

  // We reset the pending send status when the app is foregrounded
  const appState = useAppState();
  const isActive = appState === 'active';
  React.useEffect(() => {
    if (!isActive) {
      return;
    }
    pendingDCSendStatusRef.current = {
      successfulSends: 0,
      currentlySending: new Set<string>(),
      failedAttempts: new Map<string, number>(),
    };
  }, [isActive]);

  const onSendSuccess = React.useCallback(
    (messageId: string) => {
      pendingDCSendStatusRef.current.successfulSends++;
      pendingDCSendStatusRef.current.failedAttempts.delete(messageId);
      removePendingDirectCast(messageId);
    },
    [removePendingDirectCast],
  );

  const onSendError = React.useCallback(
    (messageId: string, error: unknown) => {
      if (isHandledFetchError(error) && error.status === 403) {
        onSendSuccess(messageId);
        return;
      }
      trackError(error);
      const curFailedAttempts =
        pendingDCSendStatusRef.current.failedAttempts.get(messageId) ?? 0;
      if (
        curFailedAttempts > 1 &&
        pendingDCSendStatusRef.current.successfulSends > 1
      ) {
        // If we have 3 failed attempts for this message, and are able to
        // successfully deliver 2 other messages, we can conclude that
        // there's something problematic about this particular message, and
        // give up on it
        pendingDCSendStatusRef.current.failedAttempts.delete(messageId);
        removePendingDirectCast(messageId);
      } else {
        pendingDCSendStatusRef.current.failedAttempts.set(
          messageId,
          curFailedAttempts + 1,
        );
      }
    },
    [removePendingDirectCast, onSendSuccess],
  );

  const { pendingDirectCasts } = pendingDCs;
  const baseSendDirectCast = useSendDirectCast();
  const trySendingPendingDirectCasts = React.useCallback(async () => {
    for (const pendingDirectCast of pendingDirectCasts) {
      const { messageId } = pendingDirectCast.sendDirectCastParams.data;
      pendingDCSendStatusRef.current.currentlySending.add(messageId);
      try {
        const { error } = await baseSendDirectCast(
          pendingDirectCast.sendDirectCastParams,
        );
        if (error) {
          onSendError(messageId, error);
        } else {
          onSendSuccess(messageId);
        }
      } catch (e) {
        onSendError(messageId, e);
      } finally {
        pendingDCSendStatusRef.current.currentlySending.delete(messageId);
      }
    }
  }, [pendingDirectCasts, baseSendDirectCast, onSendError, onSendSuccess]);

  // Self-terminate when the queue drains and never run in background so the
  // JS thread isn't woken every 3s on every authed screen.
  const hasPending = pendingDirectCasts.length > 0;
  React.useEffect(() => {
    if (!isActive || !hasPending) {
      return;
    }
    let latestTimeout: ReturnType<typeof setTimeout> | undefined;
    let effectShouldContinueScheduling = true;
    const trySend = async () => {
      await trySendingPendingDirectCasts();
      if (effectShouldContinueScheduling) {
        latestTimeout = setTimeout(trySend, 3000);
      }
    };
    trySend();
    return () => {
      effectShouldContinueScheduling = false;
      if (latestTimeout) {
        clearTimeout(latestTimeout);
      }
    };
  }, [trySendingPendingDirectCasts, isActive, hasPending]);

  const optimisticPendingDirectCasts = pendingDirectCasts.map(
    ({ sendDirectCastParams }) =>
      getOptimisticMessageFromSendDirectCastData(sendDirectCastParams.data),
  );

  return React.useMemo(
    () => ({
      sendDirectCast,
      optimisticPendingDirectCasts,
    }),
    [sendDirectCast, optimisticPendingDirectCasts],
  );
}

export { usePendingDirectCasts };
