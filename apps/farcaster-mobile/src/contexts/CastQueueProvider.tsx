import { ApiCastFeedIncludeReason } from 'farcaster-client-data';
import { useHaptics, useTheme } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';

import { CastingToast } from '~/components/toasts/CastingToast';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import type { LocalDraftKey } from '~/screens/CreateCast/LocalDrafts';
import {
  getOptimisticMediaLookupKey,
  OptimisticMediaEmbedsProvider,
  useOptimisticMediaEmbeds,
} from '~/screens/CreateCast/OptimisticMediaEmbedsProvider';
import { useSubmitCastsInQueue } from '~/screens/CreateCast/useSubmitCastsInQueue';
import { ComposerOnSuccessCallback, QueuedCastInfoWithEmbeds } from '~/types';
import { createUUID } from '~/utils/UUIDUtils';

type CastQueueParams = {
  casts: QueuedCastInfoWithEmbeds[];
  activeDraftId: string | undefined;
  // The schedule of the draft this publish was opened from, if any. Carried so
  // the pre-publish recovery auto-save can re-send it: the backend treats
  // `scheduledAt` as authoritative on every store, so upserting the draft
  // without it would silently unschedule a scheduled draft on a failed publish.
  scheduledAt: Date | undefined;
  feed?: string;
  includeReason?: ApiCastFeedIncludeReason['type'];
  quoteReactions?: {
    castHash: string;
    castFid: number;
  }[];
  parentCastHash: string | undefined;
  localDraftKey: LocalDraftKey;
  channelKey: string | undefined;
  tokenKey: string | undefined;
  queueIdOverrideForEmbeds: string | undefined;
  onSuccess: ComposerOnSuccessCallback | undefined;
  onError?: (message: string) => void;
};

type QueueState = {
  queueId: string;
  status: 'in-progress' | 'published' | 'errored';
  errorMessage?: string;
};

type CastPayload = {
  castTarget:
    | {
        castHash: string;
        castAuthorUsername: string | undefined;
      }
    | undefined;
  queueState: QueueState;
  params: CastQueueParams;
};

type Action =
  | {
      type: 'AddToQueue';
      queueId: string;
      params: CastQueueParams;
    }
  | {
      type: 'RemoveFromQueue';
      queueId: string;
    }
  | {
      type: 'MarkAsPublished';
      queueId: string;
      castHash: string;
      castAuthorUsername: string | undefined;
    }
  | {
      type: 'MarkAsErrored';
      queueId: string;
      errorMessage?: string;
    };

interface State {
  [queueId: string]: CastPayload;
}

function castQueueReducer(state: State, action: Action): State {
  let updatedState = state;

  switch (action.type) {
    case 'AddToQueue': {
      updatedState = {
        ...state,
        [action.queueId]: {
          params: action.params,
          queueState: {
            queueId: action.queueId,
            status: 'in-progress',
          },
          castTarget: undefined,
        },
      };
      break;
    }
    case 'RemoveFromQueue': {
      const { [action.queueId]: _, ...rest } = state;
      updatedState = rest;
      break;
    }
    case 'MarkAsPublished': {
      updatedState = {
        ...state,
        [action.queueId]: {
          params: state[action.queueId].params,
          queueState: {
            queueId: action.queueId,
            status: 'published',
          },
          castTarget: {
            castHash: action.castHash,
            castAuthorUsername: action.castAuthorUsername,
          },
        },
      };
      break;
    }
    case 'MarkAsErrored': {
      updatedState = {
        ...state,
        [action.queueId]: {
          params: state[action.queueId].params,
          queueState: {
            queueId: action.queueId,
            status: 'errored',
            errorMessage: action.errorMessage,
          },
          castTarget: undefined,
        },
      };
      break;
    }
  }

  return updatedState;
}

type CastQueueContextValue = {
  reducer: [State, React.ActionDispatch<[action: Action]>];
  enqueue: ({
    queueId,
    params,
  }: {
    queueId: string;
    params: CastQueueParams;
  }) => void;
  hasActivelyQueuedCasts: boolean;
  hasActivelyQueuedTopLevelCasts: boolean;
};

const CastQueueContext = React.createContext<CastQueueContextValue>(
  {} as never,
);

function CastQueueProvider({ children }: React.PropsWithChildren) {
  const reducer = React.useReducer(castQueueReducer, {});

  const [state, dispatch] = reducer;

  const enqueue = React.useCallback(
    ({ queueId, params }: { queueId: string; params: CastQueueParams }) => {
      dispatch({
        type: 'AddToQueue',
        queueId,
        params,
      });
    },
    [dispatch],
  );

  const hasActivelyQueuedTopLevelCasts = React.useMemo(() => {
    const casts = Object.values(state);

    const topLevelCasts = casts.filter(
      (cast) => typeof cast.params.parentCastHash === 'undefined',
    );

    return topLevelCasts.length !== 0;
  }, [state]);

  const hasActivelyQueuedCasts = React.useMemo(() => {
    return Object.keys(state).length !== 0;
  }, [state]);

  const contextValue = React.useMemo(
    () => ({
      reducer,
      enqueue: enqueue,
      hasActivelyQueuedCasts,
      hasActivelyQueuedTopLevelCasts,
    }),
    [enqueue, hasActivelyQueuedCasts, hasActivelyQueuedTopLevelCasts, reducer],
  );

  return (
    <CastQueueContext.Provider value={contextValue}>
      <OptimisticMediaEmbedsProvider>
        {children}
        <QueueProcessor />
      </OptimisticMediaEmbedsProvider>
    </CastQueueContext.Provider>
  );
}

const AUTO_DISMISS_MS_PUBLISHED = 3_000;
const AUTO_DISMISS_MS_ERRORED = 3_000;

const GLOBAL_SUMITTED_QUEUE_REFS = new Set();

export function registerOnCastQueue() {
  const queueId = createUUID();

  return { queueId };
}

function QueueProcessor() {
  const submitCastsInQueue = useSubmitCastsInQueue();

  const { reducer } = useCastQueue();
  const [state, dispatch] = reducer;

  const runningRef = React.useRef<Set<string>>(new Set());
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  React.useEffect(() => {
    const currentTimersRef = timersRef.current;
    const currentRunningRef = runningRef.current;

    for (const [queueId, payload] of Object.entries(state)) {
      const { status } = payload.queueState;
      if (
        !GLOBAL_SUMITTED_QUEUE_REFS.has(queueId) &&
        status === 'in-progress' &&
        !currentRunningRef.has(queueId)
      ) {
        GLOBAL_SUMITTED_QUEUE_REFS.add(queueId);
        currentRunningRef.add(queueId);
        void submitCastsInQueue({ queueId }).finally(() => {
          currentRunningRef.delete(queueId);
        });
      }
    }

    for (const [queueId, payload] of Object.entries(state)) {
      const { status } = payload.queueState;

      const ms =
        status === 'published'
          ? AUTO_DISMISS_MS_PUBLISHED
          : status === 'errored'
            ? AUTO_DISMISS_MS_ERRORED
            : null;

      if (ms === null) {
        const existing = currentTimersRef.get(queueId);
        if (existing) {
          clearTimeout(existing);
          currentTimersRef.delete(queueId);
        }
        continue;
      }

      if (currentTimersRef.has(queueId)) {
        continue;
      }

      const timeoutId = setTimeout(() => {
        dispatch({ type: 'RemoveFromQueue', queueId });
        currentTimersRef.delete(queueId);
        GLOBAL_SUMITTED_QUEUE_REFS.delete(queueId);
      }, ms);

      currentTimersRef.set(queueId, timeoutId);
    }

    return () => {
      currentTimersRef.forEach(clearTimeout);
      currentTimersRef.clear();
      currentRunningRef.clear();
    };
  }, [dispatch, state, submitCastsInQueue]);

  return null;
}

function CastQueueToasts() {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const { reducer, enqueue } = useCastQueue();
  const [state, dispatch] = reducer;
  const [optimisticMediaEmbedsState] = useOptimisticMediaEmbeds();

  const navigate = useNavigate();

  const queuedCasts = React.useMemo(() => {
    return Object.values(state);
  }, [state]);

  const onToastPress = React.useCallback(
    ({ queueState }: { queueState: QueueState }) => {
      if (
        queueState.status === 'in-progress' ||
        typeof state[queueState.queueId] === 'undefined'
      ) {
        return;
      }

      dispatch({ type: 'RemoveFromQueue', queueId: queueState.queueId });

      if (queueState.status === 'errored') {
        const params = state[queueState.queueId].params;

        triggerImpactAsync();

        const { queueId: newQueueId } = registerOnCastQueue();

        // We want to make sure optimistic embeds are carried over properly.
        // First re-try only though as we don't carry over from the next retry.
        params.queueIdOverrideForEmbeds =
          typeof params.queueIdOverrideForEmbeds !== 'undefined'
            ? params.queueIdOverrideForEmbeds
            : queueState.queueId;

        enqueue({ queueId: newQueueId, params });
      }

      if (queueState.status === 'published') {
        const castTarget = state[queueState.queueId].castTarget;

        if (typeof castTarget !== 'undefined') {
          triggerImpactAsync();

          navigate('Cast', {
            castHash: castTarget.castHash,
            username: castTarget.castAuthorUsername,
            navigatedFromCastToast: true,
          });
        }
      }
    },
    [dispatch, enqueue, navigate, state, triggerImpactAsync],
  );

  const getEmbedsForPreview = React.useCallback(
    ({
      castQueueId,
      castLocalKey,
    }: {
      castQueueId: string;
      castLocalKey: number;
    }) => {
      const { lookupKey } = getOptimisticMediaLookupKey({
        castQueueId: castQueueId,
        castLocalKey: castLocalKey,
      });

      const embedStateLookups = optimisticMediaEmbedsState[lookupKey];

      if (typeof embedStateLookups === 'undefined') {
        return { imageEmbeds: [], videoEmbeds: [] };
      }

      return {
        imageEmbeds: embedStateLookups.optimisticImages,
        videoEmbeds: embedStateLookups.optimisticVideos,
      };
    },
    [optimisticMediaEmbedsState],
  );

  if (queuedCasts.length === 0) {
    return null;
  }

  return (
    <View style={[t.wFull, { gap: 12 }]}>
      {queuedCasts.map(({ queueState, params: { casts } }) => {
        const cast = casts[0];

        const castLocalKey = cast.localKey;
        const castText = cast.text;

        const { imageEmbeds, videoEmbeds } = getEmbedsForPreview({
          castQueueId: queueState.queueId,
          castLocalKey,
        });

        return (
          <CastingToast
            key={queueState.queueId}
            status={queueState.status}
            castText={castText}
            imageEmbeds={imageEmbeds}
            videoEmbeds={videoEmbeds}
            errorMessage={queueState.errorMessage}
            onPress={() => onToastPress({ queueState })}
          />
        );
      })}
    </View>
  );
}

const useCastQueue = () => React.useContext(CastQueueContext);

export { CastQueueProvider, CastQueueToasts, useCastQueue };
