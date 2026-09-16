import Editor from '@draft-js-plugins/editor';
import {
  type DraftHandleValue,
  EditorState,
  Modifier,
  SelectionState,
} from 'draft-js';
import {
  ApiAudioRoom,
  ApiCast,
  ApiCastEmbeds,
  ApiUser,
  getTokenEmbedUrl,
} from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  normalizeComposerEmbedUrl,
  useAudioRoomChat,
  useCastComposerEmbeds,
  useCastComposerUrlEmbedCandidates,
  useCastHasBlockedUrl,
  useCreateCast,
  useGloballyCachedCast,
  useInvalidateAudioRoomChat,
} from 'farcaster-client-hooks';
import debounce from 'lodash/debounce';
import { ImagePlus, Send, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { Reactions } from '~/components/casts/actions/Reactions';
import { Recasts } from '~/components/casts/actions/Recasts';
import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
import { CastBodyWithAttachments } from '~/components/casts/CastBodyWithAttachments';
import { ComposerOpenGraphAttachment } from '~/components/composer/components/ComposerOpenGraphAttachment';
import { useLinkifyComposerPlugin } from '~/components/composer/plugins/LinkifyComposerPlugin';
import { useMentionsComposerPlugin } from '~/components/composer/plugins/MentionsComposerPlugin';
import { useTokenMentionsComposerPlugin } from '~/components/composer/plugins/TokenMentionsComposerPlugin';
import { LinkToProfileWithSummaryTooltip } from '~/components/links/LinkToProfileWithSummaryTooltip';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { useSpace } from '~/contexts/SpaceContext';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { trackWebAudioSpaceEvent } from '~/utils/audioSpaceInstrumentation';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

/**
 * Chat panel for a Space. Messages are replies to the host's anchor cast —
 * the cast that started the Space, with the canonical Space URL as its embed.
 * Sending a chat message creates a real reply cast that appears in the host's
 * normal reply thread.
 *
 * For pre-live scheduled rooms (no anchor cast yet), the composer is disabled.
 *
 * Real-time refresh: `useAudioRoomChat` has a 3s staleTime and we invalidate
 * immediately after a local send. Optimistic local messages bridge the gap
 * until the next refetch.
 */

type ChatMessage = {
  id: string;
  user: ApiUser;
  text: string;
  timestamp: string;
  cast?: ApiCast;
  isLocal?: boolean;
  optimisticImagePreviewUrls?: string[];
};

const SPACE_CHAT_CAST_LOCAL_KEY = 1;
const SPACE_CHAT_CAST_LOCAL_KEYS = [SPACE_CHAT_CAST_LOCAL_KEY] as const;

const getImageDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      resolve({ width: 1, height: 1 });
      URL.revokeObjectURL(objectUrl);
    };
    image.src = objectUrl;
  });

const SpaceChatPanel: React.FC<{
  room: ApiAudioRoom;
}> = React.memo(({ room }) => {
  const roomId = room.id;
  const rootCastHash = room.rootCastHash;
  const canPost = !!rootCastHash;

  const currentUser = useCurrentUser();
  const { joined } = useSpace();
  const { castEmbedLimit, developerModeEnabled } = useUserAppContext();
  const createCast = useCreateCast();
  const uploadCloudflareImage = useUploadCloudflareImage();
  const { data: chatData } = useAudioRoomChat({ roomId });
  const { invalidateAudioRoomChat } = useInvalidateAudioRoomChat();
  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(),
  );
  const [selectedImages, setSelectedImages] = useState<
    { previewUrl: string; imageUrl: string }[]
  >([]);
  const [pendingLocalMessages, setPendingLocalMessages] = useState<
    ChatMessage[]
  >([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fallbackSpaceSessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_chat'),
  );
  const editorRef = useRef<Editor>(null);

  const selectedImagesRef = useRef(selectedImages);
  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) =>
        URL.revokeObjectURL(image.previewUrl),
      );
    };
  }, []);

  const {
    embedUrls,
    processedEmbeds,
    syncEmbedsBySource,
    removeUrlEmbed: baseRemoveUrlEmbed,
    getMediaEmbedUrls,
    getEmbedsToSubmit,
    addImageEmbedViaUpload,
    removeImageEmbedByUrl,
  } = useCastComposerEmbeds({
    castLocalKeys: SPACE_CHAT_CAST_LOCAL_KEYS,
    maxEmbedsLength: castEmbedLimit,
    uploadCloudflareImage,
    trackError,
  });

  const {
    plugin: mentionComposerPlugin,
    renderPlugin: renderMentionComposerPlugin,
  } = useMentionsComposerPlugin();
  const [manuallyAddedUrls, setManuallyAddedUrls] = useState<string[]>([]);
  const tokenMentionMapRef = useRef(new Map<string, Set<string>>());

  const onAddTokenMention = useCallback(
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
        const normalizedUrl = normalizeComposerEmbedUrl(url);
        return prev.some(
          (candidate) => normalizeComposerEmbedUrl(candidate) === normalizedUrl,
        )
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
  const editorPlugins = useMemo(
    () => [mentionComposerPlugin, tokenMentionComposerPlugin],
    [mentionComposerPlugin, tokenMentionComposerPlugin],
  );

  const {
    debouncedSetOpenGraphLink,
    getNonTokenLinkMatches,
    immediateSetOpenGraphLink,
    openGraphLinks,
    openGraphLinksScannedText,
  } = useLinkifyComposerPlugin();

  const editorPlainText = useMemo(
    () => editorState.getCurrentContent().getPlainText(),
    [editorState],
  );

  const composerLinkCustomStyleMap = useMemo(
    () =>
      ({
        COMPOSER_LINK: {
          color: 'var(--composer-link-color)',
        },
      }) as const,
    [],
  );

  const editorStateRef = useRef(editorState);

  const applyComposerLinkStyles = useCallback(
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
        const blockText = block.getText();
        if (blockText.length === 0) {
          return;
        }

        const wantedRanges: Array<[number, number]> = getNonTokenLinkMatches(
          blockText,
        )
          .filter((match) => match.lastIndex > match.index)
          .map((match) => [match.index, match.lastIndex]);

        const currentRanges: Array<[number, number]> = [];
        let runStart: number | null = null;
        for (let i = 0; i < blockText.length; i += 1) {
          const hasStyle = block.getInlineStyleAt(i).has('COMPOSER_LINK');
          if (hasStyle && runStart === null) {
            runStart = i;
          }
          if (!hasStyle && runStart !== null) {
            currentRanges.push([runStart, i]);
            runStart = null;
          }
        }
        if (runStart !== null) {
          currentRanges.push([runStart, blockText.length]);
        }

        const rangesMatch =
          wantedRanges.length === currentRanges.length &&
          wantedRanges.every(
            (range, idx) =>
              range[0] === currentRanges[idx][0] &&
              range[1] === currentRanges[idx][1],
          );
        if (rangesMatch) {
          return;
        }

        const fullBlockSelection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: 0,
          focusOffset: blockText.length,
        }) as SelectionState;

        const cleared = Modifier.removeInlineStyle(
          nextContent,
          fullBlockSelection,
          'COMPOSER_LINK',
        );
        if (cleared !== nextContent) {
          nextContent = cleared;
          didChange = true;
        }

        for (const [start, end] of wantedRanges) {
          const linkSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: start,
            focusOffset: end,
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
      return EditorState.set(es, { currentContent: nextContent });
    },
    [getNonTokenLinkMatches],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedApplyLinkStyles = useCallback(
    debounce(() => {
      const latest = editorStateRef.current;
      const styled = applyComposerLinkStyles(latest);
      if (styled) {
        setEditorState(styled);
      }
    }, 300),
    [applyComposerLinkStyles],
  );

  useEffect(() => {
    return () => {
      debouncedApplyLinkStyles.cancel();
    };
  }, [debouncedApplyLinkStyles]);

  useEffect(() => {
    editorStateRef.current = editorState;
    debouncedApplyLinkStyles();
  }, [editorState, debouncedApplyLinkStyles]);

  const candidateUrlSources = useMemo(
    () => [openGraphLinks, manuallyAddedUrls],
    [manuallyAddedUrls, openGraphLinks],
  );

  const { dismissUrl } = useCastComposerUrlEmbedCandidates({
    castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
    candidateUrlSources,
    editorText: editorPlainText,
    scannedText: openGraphLinksScannedText,
    syncEmbedsBySource,
    removeUrlEmbed: baseRemoveUrlEmbed,
    getMediaEmbedUrls,
  });

  useEffect(() => {
    if (openGraphLinksScannedText !== editorPlainText) {
      immediateSetOpenGraphLink(editorPlainText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeUrlEmbed = useCallback(
    ({ url }: { url: string }) => {
      const dismissKey = normalizeComposerEmbedUrl(url);
      setManuallyAddedUrls((prev) =>
        prev.filter(
          (candidate) => normalizeComposerEmbedUrl(candidate) !== dismissKey,
        ),
      );
      for (const [ticker, urls] of tokenMentionMapRef.current) {
        if (urls.delete(url)) {
          if (urls.size === 0) {
            tokenMentionMapRef.current.delete(ticker);
          }
          break;
        }
      }
      dismissUrl(url);
    },
    [dismissUrl],
  );

  useEffect(() => {
    if (tokenMentionMapRef.current.size === 0) {
      return;
    }
    const normalizedText = editorPlainText.toLowerCase();
    const staleUrls: string[] = [];
    for (const [ticker, urls] of tokenMentionMapRef.current) {
      const escaped = ticker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\$${escaped}(?![a-zA-Z0-9])`);
      if (!pattern.test(normalizedText)) {
        for (const url of urls) {
          staleUrls.push(url);
        }
        tokenMentionMapRef.current.delete(ticker);
      }
    }
    if (staleUrls.length === 0) {
      return;
    }
    const staleSet = new Set(staleUrls);
    setManuallyAddedUrls((prev) => prev.filter((url) => !staleSet.has(url)));
  }, [editorPlainText]);

  const onPickImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) {
        return;
      }
      const nextImages: { previewUrl: string; imageUrl: string }[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        try {
          const dimensions = await getImageDimensions(file);
          const uploaded = await uploadCloudflareImage({ file });
          if (!uploaded || uploaded.version !== 'v1') {
            throw new Error('Unable to upload image');
          }
          const previewUrl = URL.createObjectURL(file);
          nextImages.push({
            previewUrl,
            imageUrl: uploaded.imageUrl,
          });
          await addImageEmbedViaUpload(
            async () => ({
              version: 'v1',
              imageUrl: uploaded.imageUrl,
              width: dimensions.width,
              height: dimensions.height,
            }),
            SPACE_CHAT_CAST_LOCAL_KEY,
            previewUrl,
          );
        } catch {
          toast({ message: 'Failed to upload image', type: 'error' });
        }
      }
      if (nextImages.length !== 0) {
        setSelectedImages((prev) => [...prev, ...nextImages]);
      }
    },
    [addImageEmbedViaUpload, uploadCloudflareImage],
  );

  // Merge server messages with optimistic local messages (de-duplicated by
  // hash so confirmed casts replace their pending local twin).
  const allMessages = useMemo(() => {
    const fromApi: ChatMessage[] = (chatData?.result.casts ?? []).map((c) => ({
      id: c.hash,
      user: c.author,
      text: c.text ?? '',
      cast: c,
      timestamp: c.timestamp
        ? new Date(c.timestamp).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })
        : '',
    }));
    // Server returns newest-first; keep that order in the UI.

    // Drop local messages whose text already appears in API response from us
    // (within last 60s). Cheap dedupe — the next refetch resolves any drift.
    const apiTextsFromMe = new Set(
      fromApi.filter((m) => m.user.fid === currentUser.fid).map((m) => m.text),
    );
    const stillPending = pendingLocalMessages.filter(
      (m) => !apiTextsFromMe.has(m.text),
    );

    return [...stillPending, ...fromApi];
  }, [chatData, pendingLocalMessages, currentUser.fid]);

  const send = useCallback(async () => {
    const trimmed = editorPlainText.trim();
    const embeds = await getEmbedsToSubmit(SPACE_CHAT_CAST_LOCAL_KEY);
    const embedUrlsAtSend = embedUrls[SPACE_CHAT_CAST_LOCAL_KEY] ?? [];
    const selectedImagesAtSend = selectedImages;
    if ((!trimmed && embeds.length === 0) || isSending || !rootCastHash) {
      return;
    }
    setIsSending(true);
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      user: currentUser,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      }),
      isLocal: true,
      optimisticImagePreviewUrls: selectedImages.map(
        (image) => image.previewUrl,
      ),
    };
    setPendingLocalMessages((prev) => [...prev, optimistic]);
    setEditorState(EditorState.createEmpty());
    immediateSetOpenGraphLink('');
    selectedImagesAtSend.forEach((image) =>
      URL.revokeObjectURL(image.previewUrl),
    );
    setSelectedImages([]);
    setManuallyAddedUrls([]);
    tokenMentionMapRef.current.clear();
    await Promise.all(
      selectedImagesAtSend.map((image) =>
        removeImageEmbedByUrl({
          imageUrl: image.imageUrl,
          castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
        }),
      ),
    );
    embedUrlsAtSend
      .filter(
        (url) => !selectedImagesAtSend.some((image) => image.imageUrl === url),
      )
      .forEach((url) => {
        baseRemoveUrlEmbed({
          url,
          castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
        });
      });

    try {
      // Reply to the host's anchor cast. The backend resolves parent fid
      // from the parent hash, so we don't need to pass it explicitly.
      await createCast({
        fid: currentUser.fid,
        castText: trimmed,
        parentCastHash: rootCastHash,
        embeds: embeds.length !== 0 ? embeds : undefined,
        skipFeedRegenrationDelay: true,
      });
      await invalidateAudioRoomChat({ roomId });
    } catch (err) {
      trackWebAudioSpaceEvent({
        eventName: AUDIO_SPACE_EVENTS.chatSendFailed,
        context: {
          spaceSessionId:
            joined?.spaceSessionId ?? fallbackSpaceSessionIdRef.current,
          roomId,
          viewerFid: currentUser.fid,
          platform: 'web',
          entrySource: joined?.entrySource ?? 'unknown',
        },
        properties: normalizeAudioSpaceError(err),
      });
      setPendingLocalMessages((prev) =>
        prev.filter((m) => m.id !== optimistic.id),
      );
      toast({ message: 'Failed to send message', type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [
    editorPlainText,
    getEmbedsToSubmit,
    isSending,
    rootCastHash,
    createCast,
    currentUser,
    joined?.entrySource,
    joined?.spaceSessionId,
    invalidateAudioRoomChat,
    roomId,
    immediateSetOpenGraphLink,
    selectedImages,
    removeImageEmbedByUrl,
    embedUrls,
    baseRemoveUrlEmbed,
  ]);

  const onEditorStateChange = useCallback(
    (nextEditorState: EditorState) => {
      setEditorState(nextEditorState);
      debouncedApplyLinkStyles();
      debouncedSetOpenGraphLink(nextEditorState);
    },
    [debouncedApplyLinkStyles, debouncedSetOpenGraphLink],
  );

  const handleReturn = useCallback(
    (e: React.KeyboardEvent): DraftHandleValue => {
      if (e.shiftKey) {
        return 'not-handled';
      }

      void send();
      return 'handled';
    },
    [send],
  );

  const processedEmbedsForPreview = useMemo(() => {
    const embeds = processedEmbeds[SPACE_CHAT_CAST_LOCAL_KEY];
    if (!embeds) {
      return undefined;
    }
    return {
      ...embeds,
      images: [],
    } as ApiCastEmbeds;
  }, [processedEmbeds]);

  return (
    <div className="mt-3">
      {/* Composer */}
      {canPost ? (
        <div className="mt-3">
          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 bg-app border-faint">
            <Avatar user={currentUser} size="xs" disabled />
            <div
              className="min-w-0 flex-1 cursor-text bg-transparent text-[14px] text-default"
              style={{ lineHeight: '20px' }}
              onClick={() => editorRef.current?.focus()}
            >
              <Editor
                ref={editorRef}
                editorState={editorState}
                onChange={onEditorStateChange}
                plugins={editorPlugins}
                customStyleMap={composerLinkCustomStyleMap}
                placeholder="Cast in this Space..."
                handleReturn={handleReturn}
                spellCheck
                stripPastedStyles
              />
              {renderMentionComposerPlugin()}
              {renderTokenMentionComposerPlugin()}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center rounded-full text-faint hover:bg-overlay-faint hover:text-default"
              aria-label="Attach image"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              onClick={send}
              disabled={
                (!editorPlainText.trim() && selectedImages.length === 0) ||
                isSending
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-white bg-action-primary hover:opacity-90 disabled:opacity-40"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                await onPickImages(e.target.files);
                e.currentTarget.value = '';
              }}
            />
          </div>
          {selectedImages.length !== 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedImages.map((image) => (
                <div key={image.previewUrl} className="relative">
                  <img
                    src={image.previewUrl}
                    alt="Selected attachment"
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImages((prev) => {
                        const found = prev.find(
                          (candidate) =>
                            candidate.previewUrl === image.previewUrl,
                        );
                        if (found) {
                          URL.revokeObjectURL(found.previewUrl);
                        }
                        void removeImageEmbedByUrl({
                          imageUrl: image.imageUrl,
                          castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
                        });
                        return prev.filter(
                          (candidate) =>
                            candidate.previewUrl !== image.previewUrl,
                        );
                      });
                    }}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-white bg-overlay"
                    aria-label="Remove image"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {processedEmbedsForPreview && (
            <div className="mt-2">
              <ComposerOpenGraphAttachment
                processingEmbeds={false}
                embeds={processedEmbedsForPreview}
                removeUrlEmbedClick={removeUrlEmbed}
                refreshable={developerModeEnabled}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-full border px-4 py-2 text-center text-[13px] border-faint text-faint">
          Chat opens when the Space goes live
        </div>
      )}

      <div className="space-y-0.5">
        {allMessages.map((msg) => (
          <ChatRow key={msg.id} message={msg} />
        ))}
      </div>

      {allMessages.length === 0 && (
        <div className="py-4 text-center text-[13px] text-faint">
          No messages yet. Be the first to chat!
        </div>
      )}
    </div>
  );
});

SpaceChatPanel.displayName = 'SpaceChatPanel';

function ChatRow({ message }: { message: ChatMessage }) {
  const castHasBlockedUrl = useCastHasBlockedUrl();
  const isAdmin = useIsAdmin();

  // Mirror Cast.tsx's harmful-domain gate; chat bypasses that wrapper
  // and would otherwise render harmful mini-app embeds (NEYN-11871).
  if (message.cast && !message.isLocal && castHasBlockedUrl(message.cast)) {
    return isAdmin ? <BlockedByDomainPlaceholder /> : null;
  }

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg px-1 py-2 hover:bg-overlay-faint ${
        message.isLocal ? 'opacity-70' : ''
      }`}
    >
      <LinkToProfileWithSummaryTooltip
        user={message.user}
        title={message.user.displayName}
        className="flex h-min"
        stopPropagation={true}
      >
        <Avatar user={message.user} size="xs" disabled />
      </LinkToProfileWithSummaryTooltip>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <SpaceUserDisplayNameWithProBadge
            user={message.user}
            badgeSize={13}
            className="text-[13px] font-semibold text-default"
          />
          <span className="text-[11px] text-faint">{message.timestamp}</span>
        </div>
        <div className="whitespace-pre-wrap break-words text-[14px] leading-snug text-default">
          {message.cast && !message.isLocal ? (
            <CastBodyWithAttachments cast={message.cast} variant="chat" />
          ) : (
            message.text
          )}
        </div>
        {message.optimisticImagePreviewUrls &&
          message.optimisticImagePreviewUrls.length !== 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.optimisticImagePreviewUrls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Pending image attachment"
                  className="h-16 w-16 rounded-md object-cover"
                />
              ))}
            </div>
          )}
        {message.cast && !message.isLocal && (
          <div className="mt-1.5 flex items-center gap-8">
            <ChatCastActions cast={message.cast} />
          </div>
        )}
      </div>
    </div>
  );
}

function ChatCastActions({ cast }: { cast: ApiCast }) {
  const globallyCachedCast = useGloballyCachedCast({ fallback: cast });

  return (
    <>
      <Recasts cast={globallyCachedCast} />
      <Reactions cast={globallyCachedCast} />
    </>
  );
}

export { SpaceChatPanel };
