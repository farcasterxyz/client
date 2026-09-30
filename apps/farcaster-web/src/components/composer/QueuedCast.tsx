import Editor from '@draft-js-plugins/editor';
import { XIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import {
  DraftHandleValue,
  EditorState,
  getDefaultKeyBinding,
  KeyBindingUtil,
  Modifier,
  SelectionState,
} from 'draft-js';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getTokenEmbedUrl } from 'farcaster-client-data';
import {
  CastComposerEmbedsReturn,
  isCastEmbedReference,
  normalizeComposerEmbedUrl,
  useCastComposerUrlEmbedCandidates,
  useDevToolsRefreshOpenGraphMetadata,
  useTrackEvent,
} from 'farcaster-client-hooks';
import debounce from 'lodash/debounce';
import React, { FC, memo } from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { Threadline } from '~/components/casts/Threadline';
import { ComposerImageAttachment } from '~/components/composer/components/ComposerImageAttachment';
import { ComposerOpenGraphAttachment } from '~/components/composer/components/ComposerOpenGraphAttachment';
import { ComposerVideoAttachment } from '~/components/composer/components/ComposerVideoAttachment';
import { useChannelMentionsComposerPlugin } from '~/components/composer/plugins/ChannelMentionsComposerPlugin';
import { useLinkifyComposerPlugin } from '~/components/composer/plugins/LinkifyComposerPlugin';
import { useMentionsComposerPlugin } from '~/components/composer/plugins/MentionsComposerPlugin';
import { useTokenMentionsComposerPlugin } from '~/components/composer/plugins/TokenMentionsComposerPlugin';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { mdAvatarDiameter } from '~/constants/avatar';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsDarkMode } from '~/hooks/useIsDarkMode';
import { CastComposerIntent } from '~/types';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

import { showComposerAttachmentLimitToast } from './composerAttachmentLimitToast';
import { getCastComposerEmbedsForLocalKey } from './composerStateDefaults';
import { useOptimisticMediaEmbeds } from './context/OptimisticMediaEmbedsProvider';

const deleteCastConfirmationBody = (
  <>Deleting this cast will cause your content to be lost.</>
);

export type QueuedCastInfo = {
  localKey: number;
  editorState: EditorState;
};

type QueuedCastProps = QueuedCastInfo & {
  intent: CastComposerIntent | undefined;
  castComposerEmbeds: CastComposerEmbedsReturn;
  wrappedMode: boolean;
  loadedURLEmbedsFromIntents: boolean;
  setOptimisticImages: (
    localKey: number,
    optimisticImages: { [imageUrl: string]: Promise<Response> } | undefined,
  ) => void;
  updateEditorState: (localKey: number, editorState: EditorState) => void;
  shouldImmediatelySetOpenGraphLink:
    | {
        linkEmbedsString: string;
        afterSetOpenGraphLink: () => void;
      }
    | undefined;
  placeholder: string;
  onCastClick: () => Promise<void>;
  addMediaEmbed: (mediaEmbedInfo: { file: File }) => Promise<void>;
  setShowDetailedUploadingError: (localKey: number | undefined) => void;
  onEditorFocus: (
    localKey: number,
    castPosition: { y: number; height: number } | undefined,
  ) => void;
  shouldFocus: (() => void) | undefined;
  removeCast: (localKey: number) => void;
  isFirst: boolean;
  isLast: boolean;
  isFocused: boolean;
  isOnlyCast: boolean;
};

const QueuedCast: FC<QueuedCastProps> = memo(
  ({
    localKey,
    editorState,
    intent,
    castComposerEmbeds,
    wrappedMode,
    loadedURLEmbedsFromIntents,
    setOptimisticImages,
    updateEditorState,
    shouldImmediatelySetOpenGraphLink,
    placeholder,
    onCastClick,
    addMediaEmbed,
    setShowDetailedUploadingError,
    onEditorFocus,
    shouldFocus,
    removeCast,
    isFirst,
    isLast,
    isFocused,
    isOnlyCast,
  }) => {
    const currentUser = useCurrentUser();
    const { developerModeEnabled, castEmbedLimit } = useUserAppContext();
    const refreshOpenGraphMetadata = useDevToolsRefreshOpenGraphMetadata();
    const { trackEvent } = useTrackEvent();

    const editorRef = React.useRef<Editor>(null);

    const {
      embeds: allEmbeds,
      embedUrls,
      processedEmbeds,
      getMediaEmbedUrls,
      syncEmbedsBySource,
      removeImageEmbedByUrl,
      removeUrlEmbed: baseRemoveUrlEmbed,
      removeVideoEmbed,
      uploadingStatuses,
      uploadingErrors,
      detailedUploadingErrors,
      setEmbedsFromDraftCast,
      getRemainingEmbedsCount,
    } = castComposerEmbeds;

    const [manuallyAddedUrls, setManuallyAddedUrls] = React.useState<string[]>(
      [],
    );

    // ticker (lowercase) → set of embed URLs for tokens picked from the
    // suggestion list.  A single ticker can map to multiple URLs when the same
    // ticker exists on different chains/contract-addresses.
    const tokenMentionMapRef = React.useRef(new Map<string, Set<string>>());

    const embeds = getCastComposerEmbedsForLocalKey({
      embeds: allEmbeds,
      localKey,
    });
    const castProcessedEmbeds = processedEmbeds[localKey];
    const uploadingStatus = uploadingStatuses[localKey];
    const uploadingError = uploadingErrors[localKey];
    const detailedUploadingError = detailedUploadingErrors[localKey];
    const isAddressedToUser =
      typeof intent?.addressedToUsername !== 'undefined';

    React.useEffect(() => {
      if (embeds.images.length === 0) {
        setOptimisticImages(localKey, undefined);
        return;
      }
      const promises: { [url: string]: Promise<Response> } = {};
      for (const ie of embeds.images) {
        if (ie.version === 'v2') {
          promises[ie.url] = ie.uploadPromise;
        }
      }

      setOptimisticImages(localKey, promises);
    }, [localKey, setOptimisticImages, embeds.images]);

    const [injectedMention, setInjectedMention] =
      React.useState<boolean>(false);

    // If the cast is addressed to a user, we inject the mention at the start of the cast.
    React.useEffect(() => {
      const injectMention = async () => {
        if (!isAddressedToUser || injectedMention) {
          return;
        }
        const mention = `@${intent.addressedToUsername}`;
        const contentState = editorState.getCurrentContent();

        const contentStateWithEntity = contentState.createEntity(
          'mention',
          'IMMUTABLE',
          { mention: { name: intent.addressedToUsername } },
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        const selectionState = SelectionState.createEmpty(
          contentState.getFirstBlock().getKey(),
        );

        let newContentState = Modifier.insertText(
          contentStateWithEntity,
          selectionState,
          mention,
          undefined,
          entityKey,
        );
        let newSelection = newContentState.getSelectionAfter();

        newContentState = Modifier.insertText(
          newContentState,
          newSelection,
          ' ',
        );
        newSelection = newContentState.getSelectionAfter();

        let newEditorState = EditorState.createWithContent(newContentState);
        newEditorState = EditorState.forceSelection(
          newEditorState,
          newSelection,
        );

        updateEditorState(localKey, newEditorState);
        setInjectedMention(true);

        // Ensure cursor is placed at the end of text after mention injection
        // We need to do this in a timeout because the editor moves the cursor
        // back to the start at some point.
        setTimeout(() => {
          if (editorRef.current) {
            const currentSelection = editorState.getSelection();
            if (currentSelection.getStartOffset() === 0) {
              const content =
                editorRef.current.props.editorState.getCurrentContent();
              const lastBlock = content.getLastBlock();
              const endOffset = lastBlock.getLength();

              const newSelection = SelectionState.createEmpty(
                lastBlock.getKey(),
              ).merge({
                anchorOffset: endOffset,
                focusOffset: endOffset,
              });

              const newEditorState = EditorState.forceSelection(
                editorRef.current.props.editorState,
                newSelection,
              );

              updateEditorState(localKey, newEditorState);
              editorRef.current.focus();
            }
          }
        }, 100);
      };
      injectMention();
    }, [
      intent?.addressedToUsername,
      editorState,
      localKey,
      updateEditorState,
      injectedMention,
      isAddressedToUser,
    ]);

    const {
      plugin: mentionComposerPlugin,
      renderPlugin: renderMentionComposerPlugin,
    } = useMentionsComposerPlugin();
    const {
      plugin: channelMentionComposerPlugin,
      renderPlugin: renderChannelMentionComposerPlugin,
    } = useChannelMentionsComposerPlugin();
    const onAddTokenMention = React.useCallback(
      ({ token }: { token: { chain: string; ca: string; ticker: string } }) => {
        const url = getTokenEmbedUrl({ chain: token.chain, ca: token.ca });
        const key = token.ticker.toLowerCase();
        const existing = tokenMentionMapRef.current.get(key);
        if (existing) {
          existing.add(url);
        } else {
          tokenMentionMapRef.current.set(key, new Set([url]));
        }
        setManuallyAddedUrls((prev) => {
          const key = normalizeComposerEmbedUrl(url);
          return prev.some((p) => normalizeComposerEmbedUrl(p) === key)
            ? prev
            : [...prev, url];
        });
      },
      [],
    );

    const {
      plugin: tokenMentionComposerPlugin,
      renderPlugin: renderTokenMentionComposerPlugin,
    } = useTokenMentionsComposerPlugin({ onAddMention: onAddTokenMention });
    const editorPlugins = React.useMemo(
      () => [
        mentionComposerPlugin,
        channelMentionComposerPlugin,
        tokenMentionComposerPlugin,
      ],
      [
        mentionComposerPlugin,
        channelMentionComposerPlugin,
        tokenMentionComposerPlugin,
      ],
    );
    const {
      debouncedSetOpenGraphLink,
      getNonTokenLinkMatches,
      immediateSetOpenGraphLink,
      openGraphLinks,
      openGraphLinksScannedText,
    } = useLinkifyComposerPlugin();

    // Visual-only link styling via Draft inline style.
    //
    // NOTE: We intentionally avoid using a decorator-based Link component in
    // the composer editor. Decorators (e.g. `@draft-js-plugins/linkify`) create
    // new React subtrees per decorated range, which causes a `removeChild`
    // crash on rapid edits (see NEYN-10591). Inline styles instead are rendered
    // by Draft as plain inline `<span>`s with no React component boundaries.
    //
    // We also avoid applying the style synchronously on every `onChange` (that
    // races with Draft's in-flight selection/composition and caused the
    // "double-period / cursor-jump" behavior). Instead, we apply via a short
    // debounce after the user pauses typing.
    const composerLinkCustomStyleMap = React.useMemo(
      () =>
        ({
          COMPOSER_LINK: {
            color: 'var(--composer-link-color)',
          },
        }) as const,
      [],
    );

    const editorStateRef = React.useRef(editorState);

    const applyComposerLinkStyles = React.useCallback(
      (es: EditorState): EditorState | undefined => {
        if (es.isInCompositionMode()) {
          return undefined;
        }

        const content = es.getCurrentContent();
        let nextContent = content;
        let didChange = false;

        content.getBlockMap().forEach((block) => {
          if (!block) {
            return;
          }

          const blockKey = block.getKey();
          const text = block.getText();
          if (text.length === 0) {
            return;
          }

          // Compute desired COMPOSER_LINK ranges from linkify matches
          // (skipping $token mentions which have their own styling).
          const wantedRanges: Array<[number, number]> = getNonTokenLinkMatches(
            text,
          )
            .filter((m) => m.lastIndex > m.index)
            .map((m) => [m.index, m.lastIndex]);

          // Compute current styled ranges in this block.
          const currentRanges: Array<[number, number]> = [];
          let runStart: number | null = null;
          for (let i = 0; i < text.length; i += 1) {
            const has = block.getInlineStyleAt(i).has('COMPOSER_LINK');
            if (has && runStart === null) {
              runStart = i;
            }
            if (!has && runStart !== null) {
              currentRanges.push([runStart, i]);
              runStart = null;
            }
          }
          if (runStart !== null) {
            currentRanges.push([runStart, text.length]);
          }

          // Short-circuit if nothing changed for this block.
          const rangesMatch =
            wantedRanges.length === currentRanges.length &&
            wantedRanges.every(
              (r, idx) =>
                r[0] === currentRanges[idx][0] &&
                r[1] === currentRanges[idx][1],
            );
          if (rangesMatch) {
            return;
          }

          // Clear any prior COMPOSER_LINK styles in this block.
          const fullBlockSelection = SelectionState.createEmpty(blockKey).merge(
            {
              anchorOffset: 0,
              focusOffset: text.length,
            },
          ) as SelectionState;

          const cleared = Modifier.removeInlineStyle(
            nextContent,
            fullBlockSelection,
            'COMPOSER_LINK',
          );
          if (cleared !== nextContent) {
            nextContent = cleared;
            didChange = true;
          }

          for (const [from, to] of wantedRanges) {
            const linkSelection = SelectionState.createEmpty(blockKey).merge({
              anchorOffset: from,
              focusOffset: to,
            }) as SelectionState;

            const applied = Modifier.applyInlineStyle(
              nextContent,
              linkSelection,
              'COMPOSER_LINK',
            );
            if (applied !== nextContent) {
              nextContent = applied;
              didChange = true;
            }
          }
        });

        if (!didChange) {
          return undefined;
        }

        // Swap in the styled content without touching selection, undo/redo,
        // or decorator.  `EditorState.set` with only `currentContent` is the
        // minimal mutation — no undo-stack entry, no forced selection — so
        // calling this from a debounced timer cannot fight with in-flight
        // user edits or move the cursor.
        return EditorState.set(es, { currentContent: nextContent });
      },
      [getNonTokenLinkMatches],
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedApplyLinkStyles = React.useCallback(
      debounce(() => {
        const latest = editorStateRef.current;
        const styled = applyComposerLinkStyles(latest);
        if (styled) {
          updateEditorState(localKey, styled);
        }
      }, 300),
      [applyComposerLinkStyles, updateEditorState, localKey],
    );

    React.useEffect(() => {
      return () => {
        debouncedApplyLinkStyles.cancel();
      };
    }, [debouncedApplyLinkStyles]);

    React.useEffect(() => {
      editorStateRef.current = editorState;
      debouncedApplyLinkStyles();
    }, [editorState, debouncedApplyLinkStyles]);

    // Memoized: avoid `getPlainText()` on every parent render when `editorState`
    // is unchanged. Keeping this (not `editorState`) in effect deps avoids
    // re-running on selection-only `EditorState` updates where text is identical.
    const editorPlainText = React.useMemo(
      () => editorState.getCurrentContent().getPlainText(),
      [editorState],
    );

    // Candidate sources for text-sourced URL embeds. `openGraphLinks` is the
    // single source of truth for "URLs currently in the editor text" — we
    // deliberately do NOT fold prior canonical text URLs back in, because
    // that turns each keystroke into an accumulator (typing `grin.io/chat`
    // would leave `grin.io/c`, `grin.io/ch`, … behind). The remount race
    // (NEYN-10950) is handled by gating the sync effect on
    // `openGraphLinksScannedText === editorPlainText` (inside the hook) and
    // by triggering an immediate scan on mount (below).
    const candidateUrlSources = React.useMemo(() => {
      const urlsFromIntentEmbeds =
        typeof intent !== 'undefined' && typeof intent.embeds !== 'undefined'
          ? intent.embeds.filter((embed) => !isCastEmbedReference(embed))
          : [];
      return [urlsFromIntentEmbeds, openGraphLinks, manuallyAddedUrls];
    }, [intent, manuallyAddedUrls, openGraphLinks]);

    const { dismissUrl } = useCastComposerUrlEmbedCandidates({
      castLocalKey: localKey,
      candidateUrlSources,
      editorText: editorPlainText,
      scannedText: openGraphLinksScannedText,
      syncEmbedsBySource,
      removeUrlEmbed: baseRemoveUrlEmbed,
      getMediaEmbedUrls,
    });

    // On mount, trigger an immediate scan so the next sync sees the right URL
    // set without waiting for the debounce. This handles composer remounts:
    // canonical state survives the unmount, but linkify state does not, so
    // without this the sync gate inside the hook would block forever until
    // the user typed.
    React.useEffect(() => {
      if (openGraphLinksScannedText !== editorPlainText) {
        immediateSetOpenGraphLink(editorPlainText);
      }
      // The debounced linkify path handles typing; this safety net is only for
      // remounts where linkify state was reset.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const removeUrlEmbed = React.useCallback(
      ({ url }: { url: string }) => {
        const dismissKey = normalizeComposerEmbedUrl(url);
        setManuallyAddedUrls((prev) =>
          prev.filter((p) => normalizeComposerEmbedUrl(p) !== dismissKey),
        );
        for (const [ticker, urls] of tokenMentionMapRef.current) {
          if (urls.delete(url)) {
            if (urls.size === 0) {
              tokenMentionMapRef.current.delete(ticker);
            }
            break;
          }
        }
        trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
          castLocalKey: localKey,
          type: 'url',
        });
        dismissUrl(url);
      },
      [dismissUrl, localKey, trackEvent],
    );

    // Remove token embed URLs whose $ticker no longer appears in the editor.
    // Only removes from manuallyAddedUrls (does NOT call baseRemoveUrlEmbed)
    // because baseRemoveUrlEmbed permanently adds the URL to urlsToIgnore,
    // which would block the same token from being re-embedded later.
    React.useEffect(() => {
      if (tokenMentionMapRef.current.size === 0) {
        return;
      }

      const text = editorPlainText.toLowerCase();
      const staleUrls: string[] = [];

      for (const [ticker, urls] of tokenMentionMapRef.current) {
        const escaped = ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\$${escaped}(?![a-zA-Z0-9])`);
        if (!pattern.test(text)) {
          for (const u of urls) {
            staleUrls.push(u);
          }
          tokenMentionMapRef.current.delete(ticker);
        }
      }

      if (staleUrls.length > 0) {
        const staleSet = new Set(staleUrls);
        setManuallyAddedUrls((prev) => prev.filter((u) => !staleSet.has(u)));
      }
    }, [editorPlainText]);

    React.useEffect(() => {
      if (!shouldImmediatelySetOpenGraphLink) {
        return;
      }
      const { linkEmbedsString, afterSetOpenGraphLink } =
        shouldImmediatelySetOpenGraphLink;
      immediateSetOpenGraphLink(linkEmbedsString);
      afterSetOpenGraphLink();
    }, [shouldImmediatelySetOpenGraphLink, immediateSetOpenGraphLink]);

    const onEditorStateChange = React.useCallback(
      (es: EditorState) => {
        updateEditorState(localKey, es);
        debouncedApplyLinkStyles();
        const changed = es.getUndoStack().size !== 0;
        if (changed) {
          debouncedSetOpenGraphLink(es);
        }
      },
      [
        debouncedApplyLinkStyles,
        debouncedSetOpenGraphLink,
        updateEditorState,
        localKey,
      ],
    );

    const handlePastedFiles = React.useCallback(
      (files: File[]): DraftHandleValue => {
        if (files.length === 0) {
          return 'not-handled';
        }
        const remaining = getRemainingEmbedsCount(localKey);
        if (remaining <= 0) {
          showComposerAttachmentLimitToast({ castEmbedLimit });
          return 'handled';
        }
        if (files.length > remaining) {
          toast({
            message: `Only the first ${remaining} file${
              remaining === 1 ? '' : 's'
            } will be attached`,
            type: 'info',
            toastId: 'composer-attachment-truncated',
          });
        }
        const accepted = files.slice(0, remaining);
        void (async () => {
          for (const file of accepted) {
            try {
              await addMediaEmbed({ file });
            } catch (e) {
              trackError(e);
            }
          }
        })();
        return 'handled';
      },
      [addMediaEmbed, castEmbedLimit, getRemainingEmbedsCount, localKey],
    );

    const [showDeleteCastConfirmation, setShowDeleteCastConfirmation] =
      React.useState<boolean>(false);

    const rawDeleteCast = React.useCallback(() => {
      trackEvent(AnalyticsEvent.CastComposerRemoveCastPressed, {
        castLocalKey: localKey,
      });
      removeCast(localKey);
    }, [removeCast, localKey, trackEvent]);

    const text = editorState.getCurrentContent().getPlainText().trim();
    const onClickDeleteCast = React.useCallback(() => {
      if (
        text.length === 0 &&
        (!embedUrls[localKey] || embedUrls[localKey].length === 0)
      ) {
        rawDeleteCast();
      } else {
        setShowDeleteCastConfirmation(true);
      }
    }, [localKey, rawDeleteCast, text, embedUrls]);

    const dismissDeleteCastConfirmationModal = React.useCallback(() => {
      setShowDeleteCastConfirmation(false);
    }, []);

    const isReply = !!intent?.parentCastHash;
    React.useEffect(() => {
      if (!shouldFocus) {
        return;
      }
      // Apparently, setting focus on the editor right away breaks plugins. (mentions & emojis)
      // Wrapping it with a timout fixes it.
      // Doesn't seem like there is a desire to fix it upstream so we will keep this hack for now. (goksu)
      // https://github.com/draft-js-plugins/draft-js-plugins/issues/800
      // We use a longer timeout for isReply because in that case, the focus has
      // to occur during mount, and observationally the issue still occurs at
      // the lower timestamp. Note that we don't allow queuing casts when isReply,
      // so the longer timestamp will only apply on the initial render.
      const timeout = setTimeout(
        () => {
          editorRef.current?.focus();
          shouldFocus();
        },
        isReply ? 200 : 50,
      );
      return () => clearTimeout(timeout);
    }, [shouldFocus, isReply]);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const onFocus = React.useCallback(() => {
      let castPosition: { y: number; height: number } | undefined;
      if (containerRef.current) {
        castPosition = {
          y: containerRef.current.offsetTop,
          height: containerRef.current.offsetHeight,
        };
      }
      requestAnimationFrame(() => {
        // We need requestAnimationFrame here because the browser may update
        // scroll position as a result of the focus event, and we won't have
        // the updated value unless we wait.
        onEditorFocus(localKey, castPosition);
      });
    }, [onEditorFocus, localKey]);

    const [state, dispatch] = useOptimisticMediaEmbeds();

    const optimisticMedia = state[localKey] || {
      optimisticImages: [],
      optimisticVideos: [],
    };

    const onClickEditorContainer = React.useCallback(() => {
      // Apparently, setting focus on the editor right away breaks plugins. (mentions & emojis)
      // Wrapping it with a timout of 50ms fixes it.
      // Doesn't seem like there is a desire to fix it upstream so we will keep this hack for now. (goksu)
      // https://github.com/draft-js-plugins/draft-js-plugins/issues/800
      setTimeout(() => {
        editorRef.current?.focus();
      }, 50);
    }, []);

    const handleRefreshClick = async (url: string) => {
      try {
        trackEvent(AnalyticsEvent.CastComposerEmbedRefreshPressed, {
          castLocalKey: localKey,
        });
        await refreshOpenGraphMetadata({
          url,
        });
        await setEmbedsFromDraftCast({
          embeds: [url],
          castLocalKey: localKey,
          // No-op for these as its a dev-specific flow
          onDraftImages: () => {},
          onDraftVideos: () => {},
          onDraftUrls: () => {},
        });
        trackEvent(AnalyticsEvent.ClickRefreshCastEmbeds);
        toast({
          message: 'Embed metadata refreshed',
        });
      } catch (error) {
        trackError(error);
        toast({
          message: 'Failed to refresh embed metadata',
          type: 'error',
        });
      }
    };

    const isDarkMode = useIsDarkMode();
    return (
      <>
        <div className="relative flex pr-7" ref={containerRef}>
          {!isLast && <Threadline threadPosition="composer_start" />}
          {!wrappedMode && (
            <div>
              <div
                className="absolute bg-app"
                style={{
                  borderRadius: mdAvatarDiameter,
                  width: mdAvatarDiameter,
                  height: mdAvatarDiameter,
                }}
              />
              <Avatar
                user={currentUser}
                size="md"
                className={classNames([
                  'relative mr-2 h-min',
                  !isFocused && isDarkMode && 'opacity-50',
                  !isFocused && !isDarkMode && 'opacity-60',
                ])}
                disabled={true}
              />
            </div>
          )}
          <div
            className={classNames(
              'outline-hidden h-auto w-full max-w-[540px] cursor-auto resize-none',
              !loadedURLEmbedsFromIntents && 'min-h-[96px]',
              !isFocused && 'text-faint',
            )}
            onClick={onClickEditorContainer}
          >
            <Editor
              ref={editorRef}
              editorState={editorState}
              placeholder={isAddressedToUser ? '' : placeholder}
              customStyleMap={composerLinkCustomStyleMap}
              plugins={editorPlugins}
              onChange={onEditorStateChange}
              spellCheck
              stripPastedStyles
              keyBindingFn={(e) => {
                if (
                  isLast &&
                  e.key === 'Enter' &&
                  KeyBindingUtil.hasCommandModifier(e)
                ) {
                  onCastClick();
                  return 'fc__drop-key-command';
                }
                return getDefaultKeyBinding(e);
              }}
              handlePastedFiles={handlePastedFiles}
              onFocus={onFocus}
            />
            {renderMentionComposerPlugin()}
            {renderChannelMentionComposerPlugin()}
            {renderTokenMentionComposerPlugin()}
            <div className="my-2">
              <div className="relative my-1 flex w-full flex-row gap-2">
                {optimisticMedia.optimisticVideos.map((video) => (
                  <ComposerVideoAttachment
                    key={video.src}
                    video={video}
                    onDelete={() => {
                      trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
                        castLocalKey: localKey,
                        type: 'video',
                      });
                      dispatch({
                        type: 'RemoveVideo',
                        castLocalKey: localKey,
                        video: video.src,
                      });

                      const ev = embeds.videos.find(
                        (o) => o.localUriRef === video.src,
                      );

                      if (typeof ev !== 'undefined') {
                        removeVideoEmbed({
                          videoId: ev.videoId,
                          videoUrl: ev.url,
                          castLocalKey: localKey,
                        });
                      }
                    }}
                    queuedCastLocalKey={localKey}
                  />
                ))}
                {optimisticMedia.optimisticImages.map((image) => (
                  <ComposerImageAttachment
                    key={image.src}
                    image={image}
                    isUploading={embeds.images.some(
                      (embed) =>
                        embed.version === 'v2' &&
                        embed.localUriRef === image.src &&
                        embed.uploadStatus === 'uploading',
                    )}
                    onRemove={() => {
                      trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
                        castLocalKey: localKey,
                        type: 'image',
                      });
                      dispatch({
                        type: 'RemoveImage',
                        castLocalKey: localKey,
                        image: image.src,
                      });

                      const ei = embeds.images.find(
                        (o) =>
                          o.version === 'v2' && o.localUriRef === image.src,
                      );

                      if (typeof ei !== 'undefined') {
                        removeImageEmbedByUrl({
                          imageUrl: ei.url,
                          castLocalKey: localKey,
                        });
                      }
                    }}
                  />
                ))}
                {uploadingStatus && (
                  <div className="absolute left-0 top-0 ml-2 mt-2 rounded-md p-1 text-sm text-white bg-overlay">
                    {uploadingStatus}
                  </div>
                )}
              </div>
              {castProcessedEmbeds && (
                <ComposerOpenGraphAttachment
                  processingEmbeds={false}
                  embeds={castProcessedEmbeds}
                  removeUrlEmbedClick={removeUrlEmbed}
                  refreshable={developerModeEnabled}
                  onRefreshClick={handleRefreshClick}
                />
              )}

              {uploadingError && (
                <span key="error" className="my-2 text-sm text-danger">
                  {uploadingError}
                  {detailedUploadingError && (
                    <>
                      {' '}
                      (
                      <span
                        className="cursor-pointer underline"
                        onClick={() => setShowDetailedUploadingError(localKey)}
                      >
                        View details
                      </span>
                      )
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
          {(!isFirst || !isOnlyCast) && isFocused && (
            <div
              className="absolute right-0 top-2 cursor-pointer text-faint hover:text-default"
              onClick={onClickDeleteCast}
            >
              <XIcon size={18} />
            </div>
          )}
        </div>
        {showDeleteCastConfirmation && (
          <ConfirmationModal
            onBackdropClose={dismissDeleteCastConfirmationModal}
            onCancel={dismissDeleteCastConfirmationModal}
            onConfirm={rawDeleteCast}
            cancelText="Cancel"
            confirmText="Delete"
            title="Delete cast"
            body={deleteCastConfirmationBody}
          />
        )}
      </>
    );
  },
);

export { QueuedCast };
