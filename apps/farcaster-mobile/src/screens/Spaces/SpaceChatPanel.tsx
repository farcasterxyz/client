import { Octicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  ApiAudioRoom,
  ApiCast,
  ApiCastEmbeds,
  ApiTokenLink,
  ApiUser,
} from 'farcaster-client-data';
import {
  AUDIO_SPACE_EVENTS,
  createAudioSpaceTelemetryId,
  normalizeAudioSpaceError,
  useAudioRoomChat,
  useCastComposerEmbeds,
  useCastComposerUrlEmbedCandidates,
  useCastHasBlockedUrl,
  useCreateCast,
  useGloballyCachedCast,
  useInvalidateAudioRoomChat,
} from 'farcaster-client-hooks';
import debounce from 'lodash/debounce';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { Avatar } from '~/components/Avatar';
import { BlockedByDomainPlaceholder } from '~/components/casts/BlockedByDomainPlaceholder';
import { Likes } from '~/components/casts/CastActions/Likes';
import { Recasts } from '~/components/casts/CastActions/Recasts';
import { CastBodyWithAttachments } from '~/components/casts/CastBodyWithAttachments';
import { SpaceUserDisplayNameWithProBadge } from '~/components/spaces/SpaceUserDisplayNameWithProBadge';
import { Text } from '~/components/Text';
import {
  cashtagMentionRegexForAutocomplete,
  mentionRegexForAutocomplete,
} from '~/constants/Regex';
import { useSpace } from '~/contexts/SpaceContext';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { TokenMentionAutocomplete } from '~/screens/CreateCast/TokenMentionAutocomplete';
import { UserMentionAutocomplete } from '~/screens/CreateCast/UserMentionAutocomplete';
import { DirectCastsOpenGraphCastAttachment } from '~/screens/PlaintextDirectCastsConversation/Embeds/DirectCastURLEmbedRenderer';
import { trackMobileAudioSpaceEvent } from '~/utils/AudioSpaceInstrumentation';
import { getGenericAutocompleteMentionInfo } from '~/utils/CastUtils';
import { trackError } from '~/utils/ErrorUtils';
import { requestMediaLibraryPermissions } from '~/utils/ImageUtils';
import { matchUrls } from '~/utils/LinkifyUtils';

const ACTION_PRIMARY = '#7c65c1';
const SPACE_CHAT_CAST_LOCAL_KEY = 1;
const SPACE_CHAT_CAST_LOCAL_KEYS = [SPACE_CHAT_CAST_LOCAL_KEY] as const;
const SPACE_CHAT_INPUT_MIN_HEIGHT = 34;
const SPACE_CHAT_INPUT_MAX_HEIGHT = 96;
const SPACE_CHAT_INPUT_LINE_HEIGHT = 18;
const MAX_RENDERED_CHAT_MESSAGES = 120;

const buildSpaceChatInputHeight = ({
  text,
  measuredHeight = 0,
}: {
  text: string;
  measuredHeight?: number;
}) => {
  if (text.length === 0) {
    return SPACE_CHAT_INPUT_MIN_HEIGHT;
  }

  const explicitLineHeight =
    SPACE_CHAT_INPUT_MIN_HEIGHT +
    (text.split('\n').length - 1) * SPACE_CHAT_INPUT_LINE_HEIGHT;

  return Math.min(
    Math.max(explicitLineHeight, measuredHeight, SPACE_CHAT_INPUT_MIN_HEIGHT),
    SPACE_CHAT_INPUT_MAX_HEIGHT,
  );
};

function useColors() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return {
    fg: isDark ? '#ffffff' : '#121212',
    fgFaint: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    border: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    bgFaint: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    bg: isDark ? '#101010' : '#ffffff',
    actionPrimary: ACTION_PRIMARY,
  };
}

type ChatMessage = {
  id: string;
  user: ApiUser;
  text: string;
  timestamp: string;
  cast?: ApiCast;
  isLocal?: boolean;
  optimisticImagePreviewUrls?: string[];
};

/**
 * Holds the optimistic-pending state shared between the messages list
 * (`SpaceChatPanel`) and the composer (`SpaceChatComposer`). The composer
 * pushes a local message on send; the messages list dedupes once the API
 * confirms the cast. Lives at `SpaceRoomScreen` level so messages can render
 * inside the outer ScrollView while the composer can be pinned to the
 * keyboard with `KeyboardStickyView`.
 */
type SpaceChatContextValue = {
  pending: ChatMessage[];
  addPending: (msg: ChatMessage) => void;
  removePending: (id: string) => void;
};

const SpaceChatContext = createContext<SpaceChatContextValue | null>(null);

const SpaceChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const addPending = useCallback((msg: ChatMessage) => {
    setPending((prev) => [...prev, msg]);
  }, []);
  const removePending = useCallback((id: string) => {
    setPending((prev) => prev.filter((m) => m.id !== id));
  }, []);
  const value = useMemo<SpaceChatContextValue>(
    () => ({ pending, addPending, removePending }),
    [pending, addPending, removePending],
  );
  return (
    <SpaceChatContext.Provider value={value}>
      {children}
    </SpaceChatContext.Provider>
  );
};

function useSpaceChat(): SpaceChatContextValue {
  const ctx = useContext(SpaceChatContext);
  if (!ctx) {
    throw new Error('useSpaceChat must be used inside <SpaceChatProvider>');
  }
  return ctx;
}

/**
 * Mobile chat panel for a Space — messages list only. Renders inside the
 * outer ScrollView. The composer is rendered separately via
 * `SpaceChatComposer` so it can be pinned to the keyboard outside the scroll.
 *
 * Messages are replies to the host's anchor cast — the cast that started the
 * Space, with the canonical Space URL as its embed.
 *
 * `useAudioRoomChat` has a 3s staleTime; the composer invalidates immediately
 * after a local send. Optimistic local messages bridge until the next refetch
 * and are deduped by sender + text once the server returns the confirmed cast.
 */
const SpaceChatPanel: React.FC<{
  room: ApiAudioRoom;
}> = React.memo(({ room }) => {
  const roomId = room.id;

  const c = useColors();
  const currentUser = useCurrentUser();
  const { data: chatData } = useAudioRoomChat({ roomId });
  const { pending } = useSpaceChat();

  const allMessages = useMemo(() => {
    const fromApi: ChatMessage[] = (chatData?.result.casts ?? []).map(
      (cast) => ({
        id: cast.hash,
        user: cast.author,
        text: cast.text ?? '',
        cast,
        timestamp: cast.timestamp
          ? new Date(cast.timestamp).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })
          : '',
      }),
    );
    // Server returns newest-first; keep that order in the UI.

    if (!currentUser) {
      return fromApi.slice(0, MAX_RENDERED_CHAT_MESSAGES);
    }
    const apiTextsFromMe = new Set(
      fromApi.filter((m) => m.user.fid === currentUser.fid).map((m) => m.text),
    );
    const stillPending = pending.filter((m) => !apiTextsFromMe.has(m.text));
    return [...stillPending, ...fromApi].slice(0, MAX_RENDERED_CHAT_MESSAGES);
  }, [chatData, pending, currentUser]);

  return (
    <View style={styles.wrap}>
      {allMessages.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.fgFaint }]}>
          No messages yet. Be the first to chat!
        </Text>
      ) : (
        <View>
          {allMessages.map((msg) => (
            <ChatRow key={msg.id} message={msg} />
          ))}
        </View>
      )}
    </View>
  );
});

SpaceChatPanel.displayName = 'SpaceChatPanel';

/**
 * Composer for the Space chat. Rendered outside the outer ScrollView so it
 * can be pinned to the keyboard via `KeyboardStickyView`. Shows a placeholder
 * pre-live (no `rootCastHash` yet) and a TextInput once the room is live.
 */
const SpaceChatComposer: React.FC<{
  room: ApiAudioRoom;
}> = React.memo(({ room }) => {
  const roomId = room.id;
  const rootCastHash = room.rootCastHash;
  const canPost = !!rootCastHash;

  const c = useColors();
  const toast = useToast();
  const currentUser = useCurrentUser();
  const { castEmbedLimit } = useUserAppContext();
  const uploadImageToCloudflare = useUploadCloudflareImage();
  const { joined } = useSpace();
  const createCast = useCreateCast();
  const { invalidateAudioRoomChat } = useInvalidateAudioRoomChat();
  const { addPending, removePending } = useSpaceChat();

  const [text, setText] = useState('');
  const [selection, setSelection] = useState<{ start: number; end: number }>();
  const [suppressMentionText, setSuppressMentionText] = useState(false);
  const [selectedImages, setSelectedImages] = useState<
    { previewUrl: string; imageUrl: string }[]
  >([]);
  const [selectedTokenMentions, setSelectedTokenMentions] = useState<
    ApiTokenLink[]
  >([]);
  const [matchedUniqueUrls, setMatchedUniqueUrls] = useState<string[]>([]);
  const [matchedUniqueUrlsScannedText, setMatchedUniqueUrlsScannedText] =
    useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [inputHeight, setInputHeight] = useState(SPACE_CHAT_INPUT_MIN_HEIGHT);
  const { isVisible: isKeyboardVisible } = useKeyboardVisibility();
  const textInputRef = useRef<TextInput | null>(null);
  const textRef = useRef(text);
  const fallbackSpaceSessionIdRef = useRef(
    createAudioSpaceTelemetryId('space_chat'),
  );

  const {
    processedEmbeds,
    embedUrls,
    syncEmbedsBySource,
    removeUrlEmbed: baseRemoveUrlEmbed,
    getMediaEmbedUrls,
    getEmbedsToSubmit,
    addImageEmbedViaUpload,
    removeImageEmbedByUrl,
  } = useCastComposerEmbeds({
    castLocalKeys: SPACE_CHAT_CAST_LOCAL_KEYS,
    maxEmbedsLength: castEmbedLimit,
    trackError,
  });

  const mentionInfo = useMemo(() => {
    const userMentionInfo = getGenericAutocompleteMentionInfo(
      text.toLowerCase(),
      selection,
      '@',
      mentionRegexForAutocomplete,
    );
    if (userMentionInfo) {
      return { ...userMentionInfo, type: 'user' as const };
    }
    const tokenMentionInfo = getGenericAutocompleteMentionInfo(
      text,
      selection,
      '$',
      cashtagMentionRegexForAutocomplete,
    );
    if (tokenMentionInfo) {
      return { ...tokenMentionInfo, type: 'token' as const };
    }
    return undefined;
  }, [selection, text]);

  const onAutocompleteMention = useCallback(
    (user: ApiUser) => {
      if (mentionInfo?.type !== 'user') {
        return;
      }
      const username = user.username ?? user.fid.toString();
      const newText =
        text.slice(0, mentionInfo.replace.start) +
        username +
        ' ' +
        text.slice(mentionInfo.replace.end);
      const nextCursor = mentionInfo.replace.start + username.length + 1;
      setText(newText);
      setSelection({ start: nextCursor, end: nextCursor });
      setSuppressMentionText(true);
      setTimeout(() => {
        textInputRef.current?.focus?.();
        textInputRef.current?.setNativeProps?.({
          selection: { start: nextCursor, end: nextCursor },
        });
      }, 50);
    },
    [mentionInfo, text],
  );

  const onAutocompleteTokenMention = useCallback(
    ({ token }: { token: ApiTokenLink }) => {
      if (mentionInfo?.type !== 'token') {
        return;
      }
      const nextText =
        text.slice(0, mentionInfo.replace.start) +
        token.ticker +
        ' ' +
        text.slice(mentionInfo.replace.end);
      const nextCursor = mentionInfo.replace.start + token.ticker.length + 1;
      setText(nextText);
      setSelection({ start: nextCursor, end: nextCursor });
      setSuppressMentionText(true);
      setSelectedTokenMentions((prev) => {
        const tokenKey = `${token.chain}:${token.ca}`;
        const nextTokenMentions = prev.some(
          (candidate) => `${candidate.chain}:${candidate.ca}` === tokenKey,
        )
          ? prev
          : [...prev, token];
        const { urls } = matchUrls({
          text: nextText,
          tokenMentions: nextTokenMentions,
          shouldMatchFirstToken: false,
        });
        setMatchedUniqueUrls(Array.from(new Set(urls)));
        setMatchedUniqueUrlsScannedText(nextText);
        return nextTokenMentions;
      });
      setTimeout(() => {
        textInputRef.current?.focus?.();
        textInputRef.current?.setNativeProps?.({
          selection: { start: nextCursor, end: nextCursor },
        });
      }, 50);
    },
    [mentionInfo, text],
  );

  const setOpenGraphPreview = useMemo(
    () =>
      debounce(
        ({ nextText }: { nextText: string }) => {
          const { urls } = matchUrls({
            text: nextText,
            tokenMentions: selectedTokenMentions,
            shouldMatchFirstToken: false,
          });
          setMatchedUniqueUrls(Array.from(new Set(urls)));
          setMatchedUniqueUrlsScannedText(nextText);
        },
        750,
        { leading: true },
      ),
    [selectedTokenMentions],
  );

  useEffect(() => {
    return () => {
      setOpenGraphPreview.cancel();
    };
  }, [setOpenGraphPreview]);

  useEffect(() => {
    textRef.current = text;
    if (text.length === 0) {
      setInputHeight(SPACE_CHAT_INPUT_MIN_HEIGHT);
    }
  }, [text]);

  const candidateUrlSources = useMemo(
    () => [matchedUniqueUrls],
    [matchedUniqueUrls],
  );

  const { dismissUrl } = useCastComposerUrlEmbedCandidates({
    castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
    candidateUrlSources,
    editorText: text,
    scannedText: matchedUniqueUrlsScannedText,
    syncEmbedsBySource,
    removeUrlEmbed: baseRemoveUrlEmbed,
    getMediaEmbedUrls,
  });

  const removeUrlEmbed = useCallback(
    ({ url }: { url: string }) => {
      dismissUrl(url);
    },
    [dismissUrl],
  );

  const processedEmbedsForPreview = useMemo(() => {
    const embeds = processedEmbeds[SPACE_CHAT_CAST_LOCAL_KEY];
    if (!embeds) {
      return undefined;
    }
    // Keep existing lightweight thumbnail strip for selected images in this
    // chat composer; show only URL-style previews from the shared embed system.
    return {
      ...embeds,
      images: [],
    };
  }, [processedEmbeds]);

  const onPickImages = useCallback(async () => {
    await requestMediaLibraryPermissions();
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 4,
      mediaTypes: ['images', 'livePhotos'],
      allowsEditing: false,
      quality: 1,
      exif: false,
      legacy: true,
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
    });
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const nextImages: { previewUrl: string; imageUrl: string }[] = [];
    for (const asset of result.assets) {
      if (!asset.uri) {
        continue;
      }
      try {
        const uploaded = await uploadImageToCloudflare({
          uri: asset.uri,
          name: asset.fileName ?? 'space-chat-image.jpg',
        });
        if (!uploaded?.imageUrl) {
          throw new Error('No uploaded image URL');
        }
        nextImages.push({
          previewUrl: asset.uri,
          imageUrl: uploaded.imageUrl,
        });
        await addImageEmbedViaUpload(
          async () => ({
            version: 'v1',
            imageUrl: uploaded.imageUrl,
            width: asset.width ?? 1,
            height: asset.height ?? 1,
          }),
          SPACE_CHAT_CAST_LOCAL_KEY,
          asset.uri,
        );
      } catch {
        toast.show('Failed to upload image', { type: 'danger' });
      }
    }

    if (nextImages.length !== 0) {
      setSelectedImages((prev) => [...prev, ...nextImages]);
    }
  }, [addImageEmbedViaUpload, toast, uploadImageToCloudflare]);

  const send = useCallback(async () => {
    const trimmed = text.trim();
    const embeds = await getEmbedsToSubmit(SPACE_CHAT_CAST_LOCAL_KEY);
    const embedUrlsAtSend = embedUrls[SPACE_CHAT_CAST_LOCAL_KEY] ?? [];
    const selectedImagesAtSend = selectedImages;
    if (
      (!trimmed && embeds.length === 0) ||
      isSending ||
      !currentUser ||
      !rootCastHash
    ) {
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
    addPending(optimistic);
    textRef.current = '';
    setText('');
    setInputHeight(SPACE_CHAT_INPUT_MIN_HEIGHT);
    setMatchedUniqueUrls([]);
    setMatchedUniqueUrlsScannedText('');
    setSelectedImages([]);
    setSelectedTokenMentions([]);
    setSuppressMentionText(false);
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
      // Reply to the host's anchor cast for this Space.
      await createCast({
        fid: currentUser.fid,
        castText: trimmed,
        parentCastHash: rootCastHash,
        embeds: embeds.length === 0 ? undefined : embeds,
        skipFeedRegenrationDelay: true,
      });
      await invalidateAudioRoomChat({ roomId });
    } catch (err) {
      trackMobileAudioSpaceEvent({
        eventName: AUDIO_SPACE_EVENTS.chatSendFailed,
        context: {
          spaceSessionId:
            joined?.spaceSessionId ?? fallbackSpaceSessionIdRef.current,
          roomId,
          viewerFid: currentUser.fid,
          platform: 'mobile',
          entrySource: joined?.entrySource ?? 'unknown',
        },
        properties: normalizeAudioSpaceError(err),
      });
      removePending(optimistic.id);
      toast.show('Failed to send message', { type: 'danger' });
    } finally {
      setIsSending(false);
    }
  }, [
    text,
    getEmbedsToSubmit,
    embedUrls,
    baseRemoveUrlEmbed,
    removeImageEmbedByUrl,
    isSending,
    currentUser,
    joined?.entrySource,
    joined?.spaceSessionId,
    rootCastHash,
    selectedImages,
    addPending,
    removePending,
    createCast,
    invalidateAudioRoomChat,
    roomId,
    toast,
  ]);

  if (!canPost) {
    return (
      <View
        style={[
          styles.composerWrap,
          { backgroundColor: c.bg, borderColor: c.border },
        ]}
      >
        <View
          style={[
            styles.preLivePlaceholder,
            { borderColor: c.border, backgroundColor: c.bgFaint },
          ]}
        >
          <Text style={[styles.preLiveText, { color: c.fgFaint }]}>
            Chat opens when the Space goes live
          </Text>
        </View>
      </View>
    );
  }

  if (!currentUser) return null;

  return (
    <View>
      <UserMentionAutocomplete
        mentionText={
          mentionInfo?.type === 'user' && !suppressMentionText
            ? mentionInfo.text
            : undefined
        }
        onAutocompleteMention={onAutocompleteMention}
        style={{ backgroundColor: c.bg }}
        inBottomSheet={true}
      />
      <View style={{ backgroundColor: c.bg }}>
        <TokenMentionAutocomplete
          mentionText={
            mentionInfo?.type === 'token' && !suppressMentionText
              ? mentionInfo.text
              : undefined
          }
          onAutocompleteMention={onAutocompleteTokenMention}
        />
      </View>
      <View
        style={[
          styles.composerWrap,
          { backgroundColor: c.bg, borderColor: c.border },
        ]}
      >
        <View style={styles.composerRow}>
          <View
            style={[
              styles.composer,
              { borderColor: c.border, backgroundColor: c.bgFaint },
            ]}
          >
            <Avatar pfpUrl={currentUser.pfp?.url} diameter={24} />
            <TextInput
              ref={textInputRef}
              value={text}
              onChangeText={(nextText) => {
                textRef.current = nextText;
                setInputHeight(buildSpaceChatInputHeight({ text: nextText }));
                setText(nextText);
                if (suppressMentionText) {
                  setSuppressMentionText(false);
                }
                setOpenGraphPreview({ nextText });
              }}
              onSelectionChange={(event) => {
                setSelection(event.nativeEvent.selection);
                if (suppressMentionText) {
                  setSuppressMentionText(false);
                }
              }}
              placeholder="Cast in this Space..."
              placeholderTextColor={c.fgFaint}
              style={[
                styles.composerInput,
                { color: c.fg, height: inputHeight },
              ]}
              onContentSizeChange={(event) => {
                if (textRef.current.length === 0) {
                  setInputHeight(SPACE_CHAT_INPUT_MIN_HEIGHT);
                  return;
                }

                setInputHeight(
                  buildSpaceChatInputHeight({
                    text: textRef.current,
                    measuredHeight: event.nativeEvent.contentSize.height,
                  }),
                );
              }}
              multiline
              returnKeyType="default"
              blurOnSubmit={false}
            />
            <Pressable
              onPress={onPickImages}
              style={styles.actionButton}
              accessibilityLabel="Attach image"
            >
              <Octicons name="image" size={14} color={c.fgFaint} />
            </Pressable>
            <Pressable
              onPress={send}
              disabled={!text.trim() && selectedImages.length === 0}
              style={[
                styles.sendButton,
                {
                  backgroundColor: c.actionPrimary,
                  opacity:
                    (!text.trim() && selectedImages.length === 0) || isSending
                      ? 0.4
                      : 1,
                },
              ]}
            >
              <Octicons name="paper-airplane" size={14} color="white" />
            </Pressable>
          </View>
          {Platform.OS === 'ios' && isKeyboardVisible && (
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={[
                styles.keyboardDismissButton,
                { borderColor: c.border, backgroundColor: c.bgFaint },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss keyboard"
            >
              <Octicons name="chevron-down" size={14} color={c.fgFaint} />
            </Pressable>
          )}
        </View>
        {selectedImages.length !== 0 && (
          <View style={styles.selectedImagesWrap}>
            {selectedImages.map((image) => (
              <View
                key={`${image.previewUrl}-${image.imageUrl}`}
                style={styles.selectedImageWrap}
              >
                <Image
                  source={{ uri: image.previewUrl }}
                  style={styles.selectedImage}
                />
                <Pressable
                  onPress={() => {
                    void removeImageEmbedByUrl({
                      imageUrl: image.imageUrl,
                      castLocalKey: SPACE_CHAT_CAST_LOCAL_KEY,
                    });
                    setSelectedImages((prev) =>
                      prev.filter(
                        (candidate) =>
                          candidate.previewUrl !== image.previewUrl,
                      ),
                    );
                  }}
                  style={styles.removeImageButton}
                >
                  <Octicons name="x" size={10} color="white" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {processedEmbedsForPreview && (
          <SpaceChatComposerUrlPreview
            processedEmbeds={processedEmbedsForPreview}
            removeUrlEmbed={removeUrlEmbed}
          />
        )}
      </View>
    </View>
  );
});

SpaceChatComposer.displayName = 'SpaceChatComposer';

function SpaceChatComposerUrlPreview({
  processedEmbeds,
  removeUrlEmbed,
}: {
  processedEmbeds: ApiCastEmbeds;
  removeUrlEmbed: ({ url }: { url: string }) => void;
}) {
  const urlEmbed = processedEmbeds.urls[0];
  if (!urlEmbed) {
    return null;
  }

  return (
    <View style={styles.compactUrlPreviewWrap}>
      <DirectCastsOpenGraphCastAttachment
        urlEmbed={urlEmbed}
        disabled={true}
        variant="direct-cast"
        layout="compact"
      />
      <Pressable
        onPress={() => removeUrlEmbed({ url: urlEmbed.openGraph.url })}
        style={styles.removeUrlPreviewButton}
      >
        <Octicons name="x" size={14} color="white" />
      </Pressable>
    </View>
  );
}

const ChatRow = React.memo(function ChatRow({
  message,
}: {
  message: ChatMessage;
}) {
  const c = useColors();
  const castHasBlockedUrl = useCastHasBlockedUrl();
  const isAdmin = useIsAdmin();

  // Mirror Cast.tsx's harmful-domain gate; chat bypasses that wrapper
  // and would otherwise render harmful mini-app embeds (NEYN-11871).
  if (message.cast && !message.isLocal && castHasBlockedUrl(message.cast)) {
    return isAdmin ? <BlockedByDomainPlaceholder /> : null;
  }

  return (
    <View style={[styles.row, { opacity: message.isLocal ? 0.7 : 1 }]}>
      <Avatar pfpUrl={message.user.pfp?.url} diameter={28} />
      <View style={{ flex: 1, marginLeft: 10, minWidth: 0 }}>
        <View style={styles.rowHeader}>
          <SpaceUserDisplayNameWithProBadge
            user={message.user}
            name={message.user.displayName || message.user.username}
            badgeSize={12}
            textStyle={[styles.rowName, { color: c.fg }]}
          />
          <Text style={[styles.rowTime, { color: c.fgFaint }]}>
            {message.timestamp}
          </Text>
        </View>
        {message.cast && !message.isLocal ? (
          <CastBodyWithAttachments cast={message.cast} variant="chat" />
        ) : (
          <Text style={[styles.rowBody, { color: c.fg }]}>{message.text}</Text>
        )}
        {message.optimisticImagePreviewUrls &&
          message.optimisticImagePreviewUrls.length !== 0 && (
            <View style={styles.pendingImagesWrap}>
              {message.optimisticImagePreviewUrls.map((previewUrl) => (
                <Image
                  key={previewUrl}
                  source={{ uri: previewUrl }}
                  style={styles.pendingImage}
                />
              ))}
            </View>
          )}
        {message.cast && !message.isLocal && (
          <ChatCastActions cast={message.cast} />
        )}
      </View>
    </View>
  );
});

const ChatCastActions = React.memo(function ChatCastActions({
  cast,
}: {
  cast: ApiCast;
}) {
  const globallyCachedCast = useGloballyCachedCast({ fallback: cast });
  const castRef = useRef(globallyCachedCast);
  const recastCount =
    globallyCachedCast.combinedRecastCount ?? globallyCachedCast.recasts.count;
  const likeCount = globallyCachedCast.reactions.count;

  useEffect(() => {
    castRef.current = globallyCachedCast;
  }, [globallyCachedCast]);

  return (
    <View style={styles.castActionsWrap}>
      <Recasts
        castRef={castRef}
        recasted={globallyCachedCast.viewerContext?.recast || false}
        count={recastCount}
      />
      <Likes
        castRef={castRef}
        castText={globallyCachedCast.text}
        reacted={globallyCachedCast.viewerContext?.reacted || false}
        count={likeCount}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginTop: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  rowName: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  rowTime: { fontSize: 11 },
  rowBody: { fontSize: 14, lineHeight: 18 },
  castActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginTop: 6,
    marginLeft: -2,
    alignSelf: 'flex-start',
  },
  composerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  preLivePlaceholder: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  preLiveText: { fontSize: 13 },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: SPACE_CHAT_INPUT_LINE_HEIGHT,
    paddingVertical: 8,
    minHeight: SPACE_CHAT_INPUT_MIN_HEIGHT,
    maxHeight: SPACE_CHAT_INPUT_MAX_HEIGHT,
    textAlignVertical: 'top',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardDismissButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedImagesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedImageWrap: { position: 'relative' },
  selectedImage: { width: 64, height: 64, borderRadius: 6 },
  removeImageButton: {
    position: 'absolute',
    right: -4,
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  pendingImagesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  pendingImage: { width: 64, height: 64, borderRadius: 6 },
  compactUrlPreviewWrap: {
    position: 'relative',
    marginTop: 8,
  },
  removeUrlPreviewButton: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
});

export { SpaceChatComposer, SpaceChatPanel, SpaceChatProvider };
