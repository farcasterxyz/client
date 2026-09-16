import '~/snap-theme-scope.css';

import {
  SnapCard,
  type SnapPage,
  type SnapRenderState,
} from '@farcaster/snap/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  buildSnapActivationAnalyticsProps,
  buildSnapHandlerAnalyticsProps,
  getSnapPaginatorChangeAnalytics,
  type SnapActivationTrigger,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { updateSnapCache } from '~/hooks/snap/useFetchSnap';
import { useSnapActionHandlers } from '~/hooks/snap/useSnapActionHandlers';
import { useAppThemeName } from '~/hooks/theme/useAppTheme';

type SnapCastContext = {
  hash: string;
  authorFid: number;
};

type SnapRendererProps = {
  /**
   * The original snap URL. Used as the starting `sourceUrl` for action
   * signing and as the base for relative-URL resolution in submit/open_snap
   * targets. The rendered snap tracks its own `sourceUrl` internally so
   * subsequent `open_snap` navigations don't flow back here.
   */
  snapUrl: string;
  /**
   * Pre-fetched snap payload. Required — callers must resolve the snap
   * before rendering this component. Feed path uses `useFetchSnap` at the
   * wrapper level; other contexts (standalone page, share preview, etc.)
   * should do the same.
   */
  initialSnap: SnapPage;
  /**
   * Cast this snap is being rendered for, when applicable. Threaded into
   * signed-action payloads as the `surface` field. Omit for standalone
   * rendering (emulator, dev tools, etc.).
   */
  castContext?: SnapCastContext;
  /** Forwarded to `SnapCard` — shows a warning when content overflows. */
  showOverflowWarning?: boolean;
  /** Remounts the pure SnapCard presenter to clear internal expanded state. */
  expansionResetKey?: number;
  initialRenderState?: SnapRenderState;
  onRenderStateChange?: (state: SnapRenderState) => void;
  onSnapChange?: (snap: SnapPage | null) => void;
  onBeforeExternalAction?: () => void;
  onSnapActivation?: (trigger: SnapActivationTrigger) => void;
};

/**
 * Stateful snap orchestrator. Wraps `SnapCard` (the pure presenter from
 * `@farcaster/snap/react`) with submit / navigation action handling,
 * post-action snap state, theme + analytics wiring, and the
 * `ComposeCastModal` portal used by `compose_cast` actions.
 *
 * Mirrors `apps/farcaster-mobile/src/components/Snap/SnapRenderer.tsx`.
 * Callers (`SnapEmbedAttachment`, future standalone / share-preview
 * wrappers) supply context-specific styling, sizing, and loading states
 * around this component.
 */
export const SnapRenderer = React.memo(
  ({
    snapUrl,
    initialSnap,
    castContext,
    showOverflowWarning,
    expansionResetKey,
    initialRenderState,
    onRenderStateChange,
    onSnapChange,
    onBeforeExternalAction,
    onSnapActivation,
  }: SnapRendererProps) => {
    const { appThemeName } = useAppThemeName();
    const { trackEvent } = useAnalytics();
    const { defaultCastViewProps } = useTrackEvent();
    const [snap, setSnap] = useState<SnapPage | null>(null);
    const [snapDocumentUrl, setSnapDocumentUrl] = useState<string>(snapUrl);
    const [error, setError] = useState<string | null>(null);
    const snapActivationTrackedRef = useRef(false);
    const renderStateRef = useRef<SnapRenderState | undefined>(
      initialRenderState,
    );

    const activeSnap = snap ?? initialSnap;

    useEffect(() => {
      renderStateRef.current = initialRenderState;
    }, [activeSnap, initialRenderState, snapDocumentUrl]);

    useEffect(() => {
      snapActivationTrackedRef.current = false;
    }, [snapUrl]);

    const trackSnapActivation = useCallback(
      (activationTrigger: SnapActivationTrigger) => {
        if (onSnapActivation) {
          onSnapActivation(activationTrigger);
          return;
        }

        if (snapActivationTrackedRef.current) {
          return;
        }
        snapActivationTrackedRef.current = true;

        trackEvent(
          AnalyticsEvent.HomeFeedSnapActivated,
          buildSnapActivationAnalyticsProps(
            {
              snapUrl: snapDocumentUrl,
              surface: 'cast_embed_web',
              activationTrigger,
              castHash: castContext?.hash,
              castAuthorFid: castContext?.authorFid,
            },
            defaultCastViewProps,
          ),
        );
      },
      [
        castContext?.authorFid,
        castContext?.hash,
        defaultCastViewProps,
        onSnapActivation,
        snapDocumentUrl,
        trackEvent,
      ],
    );

    const onSnapLoad = useCallback(
      (newSnap: SnapPage, newUrl: string) => {
        setSnap(newSnap);
        setSnapDocumentUrl(newUrl);
        setError(null);
        onSnapChange?.(newSnap);
        updateSnapCache(newUrl, newSnap);
      },
      [onSnapChange],
    );

    const onError = useCallback((message: string) => {
      setError(message);
    }, []);

    const onClearError = useCallback(() => {
      setError(null);
    }, []);

    const handleRenderStateChange = useCallback(
      (state: SnapRenderState) => {
        const pagination = getSnapPaginatorChangeAnalytics({
          previousState: renderStateRef.current,
          nextState: state,
        });
        renderStateRef.current = state;

        if (pagination) {
          trackSnapActivation(pagination.handler);
          trackEvent(AnalyticsEvent.SnapHandler, {
            handler: pagination.handler,
            surface: 'cast_embed_web',
            previousPage: pagination.previousPage,
            page: pagination.page,
            pageCount: pagination.pageCount,
            ...buildSnapHandlerAnalyticsProps(snapDocumentUrl),
          });
        }

        onRenderStateChange?.(state);
      },
      [onRenderStateChange, snapDocumentUrl, trackEvent, trackSnapActivation],
    );

    const {
      handlers,
      loading: actionLoading,
      composeIntent,
      composeModalOpen,
      closeComposeModal,
    } = useSnapActionHandlers({
      snapDocumentUrl,
      castContext,
      onSnapLoad,
      onError,
      onClearError,
      onBeforeExternalAction,
      onSnapActivation: trackSnapActivation,
    });

    return (
      <>
        <div className="snap-theme-scope cursor-default bg-app">
          <SnapCard
            key={expansionResetKey}
            snap={activeSnap}
            handlers={handlers}
            loading={actionLoading}
            appearance={appThemeName}
            actionError={error}
            showOverflowWarning={showOverflowWarning}
            initialRenderState={initialRenderState}
            onRenderStateChange={handleRenderStateChange}
          />
        </div>
        {composeModalOpen ? (
          <ComposeCastModal
            intent={composeIntent}
            isIntentFromSearchParams={false}
            onClose={closeComposeModal}
          />
        ) : null}
      </>
    );
  },
);

SnapRenderer.displayName = 'SnapRenderer';
