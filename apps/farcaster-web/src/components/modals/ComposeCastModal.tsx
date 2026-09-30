import { ComposeCast } from '@farcaster/miniapp-core';
import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCaststormBody, ApiCaststormDraft } from 'farcaster-client-data';
import {
  useDiscardDraftCast,
  useInvalidateUserAppContext,
  useStoreDraftCaststorm,
} from 'farcaster-client-hooks';
import React from 'react';

import { ComposerErrorBoundary } from '~/components/composer/components/ComposerErrorBoundary';
// We are using forwardRef and lazy-loaded components are not doing well
// as they are setup with this. Disabling it for cast composer.
// eslint-disable-next-line no-restricted-imports
import { Composer } from '~/components/composer/Composer';
import { Drafts } from '~/components/composer/Drafts';
import {
  getActiveDraftLocalDraftKey,
  getLocalDraft,
  getReplyLocalDraftKey,
  LOCAL_DRAFT_TOP_LEVEL_KEY,
  setLocalDraft,
} from '~/components/composer/LocalDrafts';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { CastComposerIntent } from '~/types';
import { trackError } from '~/utils/errorUtils';

import { ConfirmationModal } from './ConfirmationModal';

function getComposerLocalDraftKey(
  intent: CastComposerIntent | undefined,
): string {
  if (typeof intent?.activeDraftId !== 'undefined') {
    return getActiveDraftLocalDraftKey(intent.activeDraftId);
  }
  if (typeof intent?.parentCastHash !== 'undefined') {
    return getReplyLocalDraftKey(intent.parentCastHash);
  }
  return LOCAL_DRAFT_TOP_LEVEL_KEY;
}

type ComposeCastModalProps = {
  onClose: (cast: ComposeCast.Result<false>['cast'] | undefined) => void;
  intent: CastComposerIntent | undefined;
  isIntentFromSearchParams?: boolean;
  backgrounded?: boolean;
};

const ComposeCastModal: React.FC<ComposeCastModalProps> = React.memo(
  ({ onClose, intent, isIntentFromSearchParams, backgrounded = false }) => {
    const discardDraftCast = useDiscardDraftCast();
    const storeDraftCaststorm = useStoreDraftCaststorm();
    const invalidateUserAppContext = useInvalidateUserAppContext();
    const { trackEvent } = useAnalytics();

    React.useEffect(() => {
      invalidateUserAppContext();
    }, [invalidateUserAppContext]);

    React.useEffect(() => {
      trackEvent(AnalyticsEvent.CastComposerShown, {
        isReply: Boolean(intent?.parentCastHash),
        hasIntent: typeof intent !== 'undefined',
        hasDrafts: Boolean(intent?.draftCasts?.length),
      });
    }, [intent, trackEvent]);

    const [focusedTab, setFocusedTab] = React.useState<'composer' | 'drafts'>(
      'composer',
    );

    const fullWrapperRef = React.useRef<HTMLDivElement>(null);
    const composerRef = React.useRef<{
      shouldPromptOnClose: () => boolean;
      getComposerState: () => {
        caststorm: ApiCaststormBody;
      };
    }>(null);

    const [
      showDismissComposerConfirmation,
      setShowDismissComposerConfirmation,
    ] = React.useState<boolean>(false);

    const [activeDraft, setActiveDraft] = React.useState<
      ApiCaststormDraft | undefined
    >(undefined);
    const [composerIntentOverride, setComposerIntentOverride] =
      React.useState<CastComposerIntent>();

    const conditionallyShowDismissComposerConfirmation =
      React.useCallback(() => {
        const selection = window.getSelection();
        if (
          selection === null ||
          selection.type === 'None' ||
          (selection.focusNode && selection.focusNode.nodeName !== '#text')
        ) {
          setShowDismissComposerConfirmation(true);
        }
      }, []);

    const onCloseCallbackInsideModal = React.useCallback(() => {
      if (composerRef.current && !composerRef.current.shouldPromptOnClose()) {
        onClose(undefined);
      } else {
        setShowDismissComposerConfirmation(true);
      }
    }, [onClose]);

    const onCloseCallback = React.useCallback(
      (e?: React.SyntheticEvent<HTMLDivElement>) => {
        if (typeof e === 'undefined') {
          if (
            composerRef.current &&
            fullWrapperRef.current &&
            !composerRef.current.shouldPromptOnClose()
          ) {
            // This can happen after the user successfully posts a cast, or
            // if the the Esc key is pressed when !shouldPromptOnClose
            onClose(undefined);
          } else {
            // This can only happen in the case of the Esc key being pressed
            // when shouldPromptOnClose
            setShowDismissComposerConfirmation(true);
          }
        }

        if (
          typeof e !== 'undefined' &&
          composerRef.current &&
          fullWrapperRef.current &&
          !fullWrapperRef.current.contains(e.target as Node)
        ) {
          if (!composerRef.current.shouldPromptOnClose()) {
            onClose(undefined);
          } else {
            conditionallyShowDismissComposerConfirmation();
          }
        }

        if (
          typeof e !== 'undefined' &&
          composerRef.current === null &&
          fullWrapperRef.current &&
          !fullWrapperRef.current.contains(e.target as Node)
        ) {
          onClose(undefined);
        }
      },
      [conditionallyShowDismissComposerConfirmation, onClose],
    );

    const onDraftEditClick = React.useCallback(
      ({ draft }: { draft: ApiCaststormDraft }) => {
        const composerIntentOverride: CastComposerIntent = {
          draftCasts: draft.casts,
          channelKey: draft.channelKey,
          activeDraftId: draft.draftId,
          parentCastHash: draft.parent?.hash,
          scheduledAt: draft.scheduledAt
            ? new Date(draft.scheduledAt)
            : undefined,
        };

        setActiveDraft(draft);

        setComposerIntentOverride(composerIntentOverride);

        setFocusedTab('composer');
      },
      [],
    );

    const intentToRender = React.useMemo(() => {
      return typeof composerIntentOverride !== 'undefined'
        ? composerIntentOverride
        : intent;
    }, [composerIntentOverride, intent]);

    const localDraftKey = React.useMemo(
      () => getComposerLocalDraftKey(intentToRender),
      [intentToRender],
    );

    const clearLocalDraftForCurrentComposer = React.useCallback(() => {
      setLocalDraft(undefined, localDraftKey);
      if (localDraftKey === LOCAL_DRAFT_TOP_LEVEL_KEY) {
        setLocalDraft(undefined);
      }
    }, [localDraftKey]);

    const composerErrorDebugData = React.useMemo(
      () => ({
        focused_tab: focusedTab,
        is_backgrounded: backgrounded,
        is_intent_from_search_params: isIntentFromSearchParams,
        has_original_intent: typeof intent !== 'undefined',
        has_intent_override: typeof composerIntentOverride !== 'undefined',
        is_reply: Boolean(intentToRender?.parentCastHash),
        parent_cast_hash: intentToRender?.parentCastHash,
        channel_key: intentToRender?.channelKey,
        active_draft_id: intentToRender?.activeDraftId,
        intent_draft_cast_count: intentToRender?.draftCasts?.length,
        has_scheduled_at: typeof intentToRender?.scheduledAt !== 'undefined',
      }),
      [
        backgrounded,
        composerIntentOverride,
        focusedTab,
        intent,
        intentToRender,
        isIntentFromSearchParams,
      ],
    );

    const getComposerErrorDebugData = React.useCallback(() => {
      const localDraft =
        getLocalDraft(localDraftKey) ??
        (localDraftKey === LOCAL_DRAFT_TOP_LEVEL_KEY
          ? getLocalDraft()
          : undefined);
      const composerState = composerRef.current?.getComposerState();
      const caststorm = composerState?.caststorm;

      return {
        has_composer_ref: composerRef.current !== null,
        composer_cast_count: caststorm?.casts.length,
        composer_casts_with_text_count: caststorm?.casts.filter(
          (cast) => cast.text.length > 0,
        ).length,
        composer_total_text_length: caststorm?.casts.reduce(
          (total, cast) => total + cast.text.length,
          0,
        ),
        composer_total_embed_count: caststorm?.casts.reduce(
          (total, cast) => total + (cast.embeds?.length ?? 0),
          0,
        ),
        composer_has_parent: typeof caststorm?.parent !== 'undefined',
        composer_parent_cast_hash: caststorm?.parent?.hash,
        composer_channel_key: caststorm?.channelKey,
        has_local_draft: typeof localDraft !== 'undefined',
        local_draft_cast_count: localDraft?.casts.length,
        local_draft_casts_with_text_count: localDraft?.casts.filter(
          (cast) => cast.text.length > 0,
        ).length,
        local_draft_total_text_length: localDraft?.casts.reduce(
          (total, cast) => total + cast.text.length,
          0,
        ),
        local_draft_total_embed_count: localDraft?.casts.reduce(
          (total, cast) => total + cast.embeds.length,
          0,
        ),
        local_draft_has_parent:
          typeof localDraft?.parentCastHash !== 'undefined',
        local_draft_parent_cast_hash: localDraft?.parentCastHash,
        local_draft_channel_key: localDraft?.channelKey,
        local_draft_has_scheduled_at:
          typeof localDraft?.scheduledAt !== 'undefined',
      };
    }, [localDraftKey]);

    return (
      <>
        <Modal active={!backgrounded}>
          <DefaultModalContainer
            onClose={onCloseCallback}
            // FIXME: Disabling this for now as its causing too much headache at this time.
            // We have the fallback of composer confirmation now if user drags and attempts close.
            registerMouseMoveCaptures={false}
            avoidRegisteringKeyPressListeners={true}
            className={
              backgrounded ? 'hidden' : 'fixed inset-0 z-10 bg-overlay'
            }
          >
            <div className="mt-20 flex size-full select-none flex-col items-center">
              <div
                className="relative flex w-full max-w-2xl flex-col items-start rounded-lg border py-2 bg-app border-default"
                ref={fullWrapperRef}
              >
                <div className="mb-4 flex h-12 w-full flex-row items-center justify-between pl-4 pr-2">
                  <Tabs className="!h-12 !w-max space-x-4 !border-b-0">
                    <div
                      className="flex size-full cursor-pointer items-center justify-center text-inherit"
                      onClick={() => {
                        trackEvent(
                          AnalyticsEvent.CastComposerComposeTabPressed,
                          {
                            previousTab: focusedTab,
                          },
                        );
                        setFocusedTab('composer');
                      }}
                    >
                      <Tab
                        isFocused={focusedTab === 'composer'}
                        className="hover:!bg-app"
                      >
                        Compose
                      </Tab>
                    </div>
                    <div
                      className="flex size-full cursor-pointer items-center justify-center text-inherit"
                      onClick={() => {
                        trackEvent(
                          AnalyticsEvent.CastComposerDraftsTabPressed,
                          {
                            previousTab: focusedTab,
                          },
                        );
                        setFocusedTab('drafts');
                      }}
                    >
                      <Tab
                        isFocused={focusedTab === 'drafts'}
                        className="hover:!bg-app"
                      >
                        Drafts
                      </Tab>
                    </div>
                  </Tabs>
                  <DefaultCloseModalButton
                    onClick={() => {
                      trackEvent(AnalyticsEvent.CastComposerClosed, {
                        source: 'close_button',
                      });
                      onCloseCallbackInsideModal();
                    }}
                    className="p-2"
                  />
                </div>
                <div
                  className="w-full"
                  onClick={(e) => {
                    // Need this for the discard dialog handler otherwise composer clicks will trigger it
                    e.stopPropagation();
                  }}
                >
                  <span
                    className={classNames(
                      focusedTab === 'composer' ? 'block' : 'hidden',
                    )}
                  >
                    <ComposerErrorBoundary
                      debugData={composerErrorDebugData}
                      getDebugData={getComposerErrorDebugData}
                    >
                      <Composer
                        placeholder={'Start typing a new cast here...'}
                        intent={intentToRender}
                        onForceCloseWrappingModal={onCloseCallback}
                        ref={composerRef}
                        onClose={onClose}
                        activeDraft={activeDraft}
                        isIntentFromSearchParams={isIntentFromSearchParams}
                      />
                    </ComposerErrorBoundary>
                  </span>
                  <span
                    className={classNames(
                      focusedTab === 'drafts' ? 'block' : 'hidden',
                    )}
                  >
                    <Drafts onEditClick={onDraftEditClick} />
                  </span>
                </div>
              </div>
            </div>
          </DefaultModalContainer>
        </Modal>
        {showDismissComposerConfirmation && (
          <ConfirmationModal
            onBackdropClose={() => {
              setShowDismissComposerConfirmation(false);
            }}
            onCancel={() => {
              // User chose "Discard": clear the local-first copy too so
              // the next composer launch starts fresh.
              clearLocalDraftForCurrentComposer();
              onClose(undefined);
            }}
            onConfirm={async () => {
              try {
                if (!composerRef.current) {
                  return;
                }

                const { caststorm } = composerRef.current.getComposerState();

                // we explicitly ignore scheduledAt here, to prevent accidental schedulings
                await storeDraftCaststorm({ caststorm });

                if (typeof activeDraft !== 'undefined') {
                  await discardDraftCast({
                    draftId: activeDraft.draftId,
                    castChannelKey: undefined,
                  });
                }

                // Server holds the canonical draft now; drop the local copy
                // so we don't double-show it on next reopen.
                clearLocalDraftForCurrentComposer();

                onClose(undefined);
              } catch (e) {
                trackError(e);
              }
            }}
            cancelText="Discard"
            confirmText="Save draft"
            title="Save cast"
            body={
              <>
                If you are still working on your cast, you can save it and
                continue later on.
              </>
            }
          />
        )}
      </>
    );
  },
);

ComposeCastModal.displayName = 'ComposeCastModal';

export { ComposeCastModal };
