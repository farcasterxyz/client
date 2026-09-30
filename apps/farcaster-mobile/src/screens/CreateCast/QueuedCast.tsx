import { Octicons } from '@expo/vector-icons';
import { PastedFile } from '@mattermost/react-native-paste-input';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import {
  CastComposerEmbedsReturn,
  isCastEmbedReference,
  resolveUsername,
  useCastComposerUrlEmbedCandidates,
  useDevToolsRefreshOpenGraphMetadata,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import compact from 'lodash/compact';
import debounce from 'lodash/debounce';
import React, { FC, memo } from 'react';
import {
  Alert,
  LayoutChangeEvent,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Avatar } from '~/components/Avatar';
import { CastComposerEmbedsPreviews } from '~/components/casts/CastAttachments/CastComposerEmbedsPreviews';
import { ImageEmbedCastAttachmentOptimisticPreview } from '~/components/casts/CastAttachments/ImageEmbedCastAttachmentOptimisticPreview';
import { VideoEmbedCastAttachmentOptimisticPreview } from '~/components/casts/CastAttachments/VideoEmbedCastAttachmentOptimisticPreview';
import { Text } from '~/components/Text';
import { LinkifiedTextarea } from '~/components/TextInput/LinkifiedTextarea';
import { createCastAvatarDiameter } from '~/constants/Cast';
import { useComposerOptimisticImages } from '~/contexts/ComposerOptimisticImagesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { CastComposerIntent, QueuedCastInfo } from '~/types';
import { logCreateCastRumAction } from '~/utils/CastUtils';
import { getRenderableEmbeds } from '~/utils/EmbedRenderingUtils';
import { trackError } from '~/utils/ErrorUtils';
import { matchUrls } from '~/utils/LinkifyUtils';

import {
  getOptimisticMediaLookupKey,
  useOptimisticMediaEmbeds,
} from './OptimisticMediaEmbedsProvider';

type QueuedCastProps = QueuedCastInfo & {
  castQueueId: string;
  intent: CastComposerIntent | undefined;
  castComposerEmbeds: CastComposerEmbedsReturn;
  updateText: (localKey: number, text: string) => void;
  updateSelection: (
    localKey: number,
    selection: { start: number; end: number },
  ) => void;
  onTextInputFocus: (
    localKey: number,
    castPosition: { y: number; height: number } | undefined,
  ) => void;
  removeCast: (localKey: number) => void;
  onImagePaste: (pasteParams: { pastedImageFile: PastedFile }) => Promise<void>;
  parentCast: ApiCast | undefined;
  isFirst: boolean;
  isLast: boolean;
  isFocused: boolean;
  isOnlyCast: boolean;
  placeholder?: string;
  updateTokenKeyFromTicker: (ticker: string) => void;
  /**
   * Bumped by the parent to imperatively re-focus this cast's text input (and
   * thus re-open the keyboard) — e.g. after the draft-save prompt is dismissed
   * via its Cancel button.  Only the currently-focused cast reacts.
   */
  refocusSignal?: number;
};

const QueuedCast: FC<QueuedCastProps> = memo(
  ({
    castQueueId,
    localKey,
    text,
    userMentions,
    channelMentions,
    tokenMentions,
    intent,
    castComposerEmbeds,
    updateText,
    updateSelection,
    onTextInputFocus,
    removeCast,
    onImagePaste,
    parentCast,
    isFirst,
    isLast,
    isFocused,
    isOnlyCast,
    placeholder,
    updateTokenKeyFromTicker,
    refocusSignal,
  }) => {
    const t = useTheme();
    const toast = useRootToast();
    const currentUser = useCurrentUser_UNSAFE();
    const { developerModeEnabled } = useUserAppContext();
    const refreshOpenGraphMetadata = useDevToolsRefreshOpenGraphMetadata();
    const { trackEvent } = useTrackEvent();
    const ourParentCast = isFirst ? parentCast : undefined;

    const [matchedUniqueURLs, setMatchedUniqueURLs] = React.useState<string[]>(
      [],
    );
    // The editor text that produced `matchedUniqueURLs`. The sync effect
    // gates on `matchedUniqueURLsScannedText === text` so candidates are
    // never stale during the matchUrls debounce window.
    const [matchedUniqueURLsScannedText, setMatchedUniqueURLsScannedText] =
      React.useState<string>('');

    const [state, dispatch] = useOptimisticMediaEmbeds();
    const { lookupKey: optimisticMediaLookupKey } = getOptimisticMediaLookupKey(
      {
        castQueueId,
        castLocalKey: localKey,
      },
    );

    const optimisticMedia = React.useMemo(
      () =>
        state[optimisticMediaLookupKey] || {
          optimisticImages: [],
          optimisticVideos: [],
          removedUrls: [],
        },
      [optimisticMediaLookupKey, state],
    );

    const optimisticImageCount = optimisticMedia.optimisticImages.length;
    const optimisticVideoCount = optimisticMedia.optimisticVideos.length;

    const intentEmbeds = React.useMemo(() => intent?.embeds ?? [], [intent]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const setOpenGraphPreview = React.useCallback(
      debounce(
        ({ text }: { text: string }) => {
          const { urls: matchedURLs, ticker } = matchUrls({
            text,
            tokenMentions: tokenMentions || [],
            shouldMatchFirstToken: true,
          });

          const urlsFromIntentEmbeds = intentEmbeds.filter(
            (embed) =>
              !isCastEmbedReference(embed) &&
              optimisticMedia.optimisticImages.findIndex(
                ({ src }) => src === embed,
              ) === -1 &&
              optimisticMedia.optimisticVideos.findIndex(
                ({ src }) => src === embed,
              ) === -1 &&
              optimisticMedia.removedUrls.indexOf(embed) === -1,
          );

          const urls = [...urlsFromIntentEmbeds, ...matchedURLs].map(
            (url) => url,
          );

          const uniqueUrls = Array.from(new Set(urls));

          setMatchedUniqueURLs(uniqueUrls);
          setMatchedUniqueURLsScannedText(text);

          if (typeof ticker !== 'undefined') {
            updateTokenKeyFromTicker(ticker);
          }

          dispatch({
            type: 'UpdateURLs',
            castLocalKey: localKey,
            castQueueId,
            urls,
          });
        },
        1250,
        { leading: true },
      ),
      [
        castQueueId,
        dispatch,
        intentEmbeds,
        localKey,
        optimisticMedia,
        tokenMentions,
        updateTokenKeyFromTicker,
      ],
    );

    const {
      embeds: allEmbeds,
      embedUrls,
      processedEmbeds: allProcessedEmbeds,
      getMediaEmbedUrls,
      syncEmbedsBySource,
      removeVideoEmbed,
      removeImageEmbedByUrl,
      removeUrlEmbed: baseRemoveUrlEmbed,
      cancelActiveVideoUpload,
      uploadingStatuses,
      uploadingErrors,
      setEmbedsFromDraftCast,
    } = castComposerEmbeds;
    const embeds = allEmbeds[localKey] ?? {
      images: [],
      videos: [],
      urls: [],
    };
    const embedImageCount = embeds.images.length;
    const embedVideoCount = embeds.videos.length;
    const processedEmbeds = allProcessedEmbeds[localKey];

    const rumBaseContext = React.useMemo(
      () => ({
        castQueueId,
        localKey,
        isFirst,
        isLast,
        isOnlyCast,
        isFocused,
        textLength: text.length,
        optimisticImageCount,
        optimisticVideoCount,
        embedImageCount,
        embedVideoCount,
      }),
      [
        castQueueId,
        embedImageCount,
        embedVideoCount,
        isFirst,
        isFocused,
        isLast,
        isOnlyCast,
        localKey,
        optimisticImageCount,
        optimisticVideoCount,
        text.length,
      ],
    );

    const rumBaseContextRef = React.useRef(rumBaseContext);
    rumBaseContextRef.current = rumBaseContext;

    // `matchedUniqueURLs` is the single source of truth for "URLs currently
    // in the editor text". We deliberately do NOT fold prior canonical text
    // URLs back in — that turns each keystroke into an accumulator. The
    // remount race (NEYN-10950) is handled inside
    // `useCastComposerUrlEmbedCandidates` by gating the sync effect on
    // `scannedText === editorText`.
    const candidateUrlSources = React.useMemo(() => {
      const filtered = matchedUniqueURLs.filter(
        (embed) =>
          optimisticMedia.optimisticImages.findIndex(
            ({ src }) => src === embed,
          ) === -1 &&
          optimisticMedia.optimisticVideos.findIndex(
            ({ src }) => src === embed,
          ) === -1 &&
          optimisticMedia.removedUrls.indexOf(embed) === -1,
      );
      return [filtered];
    }, [
      matchedUniqueURLs,
      optimisticMedia.optimisticImages,
      optimisticMedia.optimisticVideos,
      optimisticMedia.removedUrls,
    ]);

    const onUrlEmbedSync = React.useCallback(
      ({ mergedCandidateUrls }: { mergedCandidateUrls: string[] }) => {
        logCreateCastRumAction('QueuedCast.url_embed_update_effect', {
          ...rumBaseContextRef.current,
          matchedUrlCount: mergedCandidateUrls.length,
        });
      },
      [],
    );

    const { dismissUrl } = useCastComposerUrlEmbedCandidates({
      castLocalKey: localKey,
      candidateUrlSources,
      editorText: text,
      scannedText: matchedUniqueURLsScannedText,
      syncEmbedsBySource,
      removeUrlEmbed: baseRemoveUrlEmbed,
      getMediaEmbedUrls,
      onSync: onUrlEmbedSync,
    });

    const { clearOptimisticImages, addOptimisticImage } =
      useComposerOptimisticImages();

    const onChangeText = React.useCallback(
      (text: string) => {
        updateText(localKey, text);
        setOpenGraphPreview({ text });
      },
      [localKey, setOpenGraphPreview, updateText],
    );

    const updatedRef = React.useRef<boolean>(false);
    const hasInitialScanFiredRef = React.useRef<boolean>(false);

    React.useEffect(
      () => {
        // Already scanned with non-empty intent text — never re-scan.
        if (updatedRef.current) {
          return;
        }

        // Fire OG scan when:
        //   a) initial scan hasn't happened yet (clears stale state on mount), OR
        //   b) text just became non-empty (intent text populated after mount, NEYN-10174).
        // After the initial empty-text scan, skip subsequent re-runs triggered
        // by setOpenGraphPreview's reference changing (via optimisticMedia updates)
        // to avoid an infinite update loop.
        if (!hasInitialScanFiredRef.current || text) {
          setOpenGraphPreview({ text });
          hasInitialScanFiredRef.current = true;
          if (text) {
            updatedRef.current = true;
          }
        }
      },
      // User typing is handled through onChangeText above; this effect only
      // primes the initial OG scan for pre-filled (intent) text.

      [text, setOpenGraphPreview],
    );

    const setSelection = React.useCallback(
      (selection: { start: number; end: number }) => {
        updateSelection(localKey, selection);
      },
      [updateSelection, localKey],
    );

    const scrollPositionRef = React.useRef<{
      y: number;
      height: number;
    }>(undefined);
    const onLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const { y, height } = event.nativeEvent.layout;
        scrollPositionRef.current = { y, height };
        logCreateCastRumAction('QueuedCast.layout', {
          ...rumBaseContext,
          y,
          height,
        });
      },
      [rumBaseContext],
    );

    const isFocusedRef = React.useRef<boolean>(isFocused);

    const onFocus = React.useCallback(() => {
      isFocusedRef.current = true;
      logCreateCastRumAction('QueuedCast.focus', {
        ...rumBaseContext,
        scrollPosition: scrollPositionRef.current,
      });
      onTextInputFocus(localKey, scrollPositionRef.current);
    }, [localKey, onTextInputFocus, rumBaseContext]);
    const onBlur = React.useCallback(() => {
      isFocusedRef.current = false;
      logCreateCastRumAction('QueuedCast.blur', { ...rumBaseContext });
    }, [rumBaseContext]);

    const uploadingStatus = uploadingStatuses[localKey];
    const uploadingError = uploadingErrors[localKey];

    const removeUrlEmbed = React.useCallback(
      ({ url }: { url: string }) => {
        logCreateCastRumAction('QueuedCast.url_embed_removed', {
          ...rumBaseContext,
          url,
        });
        trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
          castLocalKey: localKey,
          type: 'url',
        });
        dispatch({
          type: 'RemoveURL',
          castLocalKey: localKey,
          castQueueId,
          url,
        });
        dismissUrl(url);
      },
      [castQueueId, dismissUrl, dispatch, localKey, rumBaseContext, trackEvent],
    );

    const removeImageEmbed = React.useCallback(
      ({ url }: { url: string }) => {
        logCreateCastRumAction('QueuedCast.image_embed_removed', {
          ...rumBaseContext,
          url,
        });
        trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
          castLocalKey: localKey,
          type: 'image',
        });
        removeImageEmbedByUrl({
          imageUrl: url,
          castLocalKey: localKey,
        });
      },
      [localKey, removeImageEmbedByUrl, rumBaseContext, trackEvent],
    );

    const onPressDeleteCast = React.useCallback(() => {
      const embedUrlCount = embedUrls[localKey]?.length ?? 0;
      const hasText = text.trim().length > 0;

      logCreateCastRumAction('QueuedCast.delete_pressed', {
        ...rumBaseContext,
        hasText,
        embedUrlCount,
      });
      trackEvent(AnalyticsEvent.CastComposerRemoveCastPressed, {
        castLocalKey: localKey,
        hasText,
        embedUrlCount,
      });

      const removeThisCast = () => {
        logCreateCastRumAction('QueuedCast.delete_confirmed', {
          ...rumBaseContext,
          hasText,
          embedUrlCount,
        });
        removeCast(localKey);
      };
      if (!hasText && embedUrlCount === 0) {
        logCreateCastRumAction('QueuedCast.delete_auto_remove', {
          ...rumBaseContext,
        });
        removeThisCast();
        return;
      }
      logCreateCastRumAction('QueuedCast.delete_prompt_shown', {
        ...rumBaseContext,
        embedUrlCount,
      });
      Alert.alert(
        'Delete cast',
        'Deleting this cast will cause your content to be lost.\n\n' +
          'Are you sure you want to delete?',
        [
          {
            text: 'Cancel',
            onPress: () =>
              logCreateCastRumAction('QueuedCast.delete_cancelled', {
                ...rumBaseContext,
              }),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              logCreateCastRumAction('QueuedCast.delete_prompt_confirmed', {
                ...rumBaseContext,
                hasText,
                embedUrlCount,
              });
              removeThisCast();
            },
            isPreferred: true,
          },
        ],
      );
    }, [embedUrls, localKey, removeCast, rumBaseContext, text, trackEvent]);

    React.useEffect(() => {
      logCreateCastRumAction('QueuedCast.embeds_image_effect', {
        ...rumBaseContext,
        imageCount: embeds.images.length,
      });
      if (embeds.images.length === 0) {
        logCreateCastRumAction('QueuedCast.embeds_image_cleared', {
          ...rumBaseContext,
        });
        clearOptimisticImages();
        return;
      }

      for (const ie of embeds.images) {
        if (ie.version === 'v2') {
          logCreateCastRumAction('QueuedCast.optimistic_image_added', {
            ...rumBaseContext,
            imageUrl: ie.url,
          });
          addOptimisticImage({
            image: {
              imageUrl: ie.url,
              previewUrl: ie.previewUrl,
              uploadPromise: ie.uploadPromise,
              aspectRatio: ie.aspectRatio,
            },
          });
        }
      }
    }, [
      addOptimisticImage,
      clearOptimisticImages,
      embeds.images,
      rumBaseContext,
    ]);

    const shouldShowProcessedEmbeds = React.useMemo(() => {
      if (embeds.images.length > 0 || embeds.videos.length > 0) {
        return true;
      }

      if (typeof processedEmbeds === 'undefined') {
        return false;
      }

      const renderableEmbeds = getRenderableEmbeds({
        castText: '',
        embeds: processedEmbeds,
      });

      return renderableEmbeds.length !== 0;
    }, [embeds.images, embeds.videos, processedEmbeds]);

    const placeholderText = isFirst
      ? (placeholder ?? 'What’s happening?')
      : 'Add another cast';

    const avatarDimmingOpacity = t.dark ? 0.5 : 0.6;

    const textareaRef = React.useRef<TextInput>(null);

    // Re-focus this cast's input (re-opening the keyboard) when the parent
    // bumps `refocusSignal` — e.g. after the draft-save prompt is dismissed via
    // Cancel.  Only the focused cast reacts; we skip the initial mount so this
    // never fights `autoFocus`.
    const lastRefocusSignalRef = React.useRef(refocusSignal);
    React.useEffect(() => {
      if (refocusSignal === undefined) {
        return;
      }
      if (refocusSignal === lastRefocusSignalRef.current) {
        return;
      }
      lastRefocusSignalRef.current = refocusSignal;
      if (isFocused) {
        textareaRef.current?.focus();
      }
    }, [refocusSignal, isFocused]);

    const handleRefreshPress = React.useCallback(
      async (url: string) => {
        try {
          if (!developerModeEnabled) {
            logCreateCastRumAction('QueuedCast.refresh_press_ignored', {
              ...rumBaseContext,
              developerModeEnabled,
            });
            return;
          }
          logCreateCastRumAction('QueuedCast.refresh_press', {
            ...rumBaseContext,
            url,
          });
          trackEvent(AnalyticsEvent.CastComposerEmbedRefreshPressed, {
            castLocalKey: localKey,
          });
          await refreshOpenGraphMetadata({ url });
          await setEmbedsFromDraftCast({
            embeds: [url],
            castLocalKey: localKey,
            // No-op for these as its a dev-specific flow
            onDraftImages: () => {},
            onDraftVideos: () => {},
            onDraftUrls: () => {},
          });
          toast.show('Embed metadata refreshed', {
            type: 'success',
          });
          logCreateCastRumAction('QueuedCast.refresh_press_success', {
            ...rumBaseContext,
            url,
          });
          trackEvent(AnalyticsEvent.ClickRefreshCastEmbeds);
        } catch (error) {
          toast.show('Error refreshing embed metadata', {
            type: 'error',
          });
          logCreateCastRumAction('QueuedCast.refresh_press_error', {
            ...rumBaseContext,
            url,
            message: error instanceof Error ? error.message : 'unknown',
          });
          trackError(error);
        }
      },
      [
        developerModeEnabled,
        localKey,
        rumBaseContext,
        refreshOpenGraphMetadata,
        setEmbedsFromDraftCast,
        toast,
        trackEvent,
      ],
    );

    return (
      // We are omitting 5 margin because parent casts rendering now at the margin of 3 scale and we omit 4.
      // See the omitted margin at <ComposerParentCast />.
      // Instead of this margin dance there are probably better ways to handle this but going with it for now.
      <View style={[t._mX5]} onLayout={onLayout}>
        <View>
          <View style={[t.flexRow, t.pX4, isFirst ? t.pT3 : t.pT1, t.pR10]}>
            <View>
              {typeof ourParentCast !== 'undefined' && (
                <View
                  style={[
                    {
                      width: 2,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      backgroundColor: t.colors.feed.threadLine,
                      borderRadius: 16,
                      marginTop: -8,
                    },
                  ]}
                />
              )}
              <Avatar
                pfpUrl={currentUser.pfp?.url}
                diameter={createCastAvatarDiameter}
                style={
                  isFocused ? undefined : { opacity: avatarDimmingOpacity }
                }
              />
              {!isLast && (
                <View
                  style={[
                    {
                      width: 2,
                      marginLeft: 'auto',
                      marginRight: 'auto',
                      flexGrow: 1,
                      backgroundColor: t.colors.feed.threadLine,
                      borderRadius: 16,
                      marginTop: 4,
                    },
                  ]}
                />
              )}
            </View>
            <View style={[t.flexGrow, t.flexShrink, { marginTop: -1 }]}>
              {typeof ourParentCast !== 'undefined' && (
                <View
                  style={[
                    t.flexRow,
                    t.itemsCenter,
                    t.absolute,
                    t.mL2,
                    { top: -12 },
                    { gap: 4 },
                  ]}
                >
                  <Text style={[t.texts.secondary, t.textSm]}>
                    {`Replying to ${resolveUsername({
                      username: ourParentCast.author.username,
                      fid: ourParentCast.author.fid,
                    })}`}
                  </Text>
                </View>
              )}
              <View
                style={[
                  t.mL2,
                  typeof ourParentCast !== 'undefined' ? t.mY2 : t.mB2,
                ]}
              >
                <LinkifiedTextarea
                  minHeight={60}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  onChangeText={onChangeText}
                  onSelectionChange={(e) => {
                    setSelection(e.nativeEvent.selection);
                  }}
                  placeholder={placeholderText}
                  scrollEnabled={false}
                  value={text}
                  userMentions={compact(
                    userMentions.map((mention) => mention.username),
                  )}
                  channelMentions={compact(
                    channelMentions.map(({ key }) => key),
                  )}
                  onImagePaste={onImagePaste}
                  textStyle={isFocused ? [] : [t.texts.tertiary]}
                  ref={textareaRef}
                  autoFocus={true}
                />
              </View>
            </View>
            {(!isFirst || !isOnlyCast) && isFocused && (
              <TouchableOpacity
                style={[t.absolute, t.right0, t.p5]}
                onPress={onPressDeleteCast}
              >
                <Octicons name="x" size={18} style={[t.texts.secondary]} />
              </TouchableOpacity>
            )}
          </View>
          {uploadingError && (
            <Text style={[t.textSm, t.texts.danger, t.mY1, t.mL4]}>
              {uploadingError}
            </Text>
          )}
          <ScrollView
            style={[t.wFull, t.flexRow, t.mT3]}
            contentContainerStyle={[[t.pR8, t.mL4, { gap: 8 }]]}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={false}
            directionalLockEnabled={true}
            keyboardShouldPersistTaps="always"
          >
            {optimisticMedia.optimisticVideos.map((ov) => (
              <VideoEmbedCastAttachmentOptimisticPreview
                key={ov.src}
                optimisticVideo={ov}
                onCancelVideoUpload={() => {
                  logCreateCastRumAction(
                    'QueuedCast.video_upload_cancel_requested',
                    {
                      ...rumBaseContext,
                      src: ov.src,
                    },
                  );
                  trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
                    castLocalKey: localKey,
                    type: 'video',
                  });
                  cancelActiveVideoUpload();

                  dispatch({
                    type: 'RemoveVideo',
                    castQueueId,
                    castLocalKey: localKey,
                    src: ov.src,
                  });

                  const ev = embeds.videos.find(
                    (o) => o.localUriRef === ov.src,
                  );

                  if (typeof ev !== 'undefined') {
                    removeVideoEmbed({
                      videoId: ev.videoId,
                      videoUrl: ev.url,
                      castLocalKey: localKey,
                    });
                  }
                }}
                uploadingStatus={uploadingStatus}
              />
            ))}
            {optimisticMedia.optimisticImages.map((oi) => (
              <ImageEmbedCastAttachmentOptimisticPreview
                key={oi.src}
                optimisticImage={oi}
                onCancelImageUpload={() => {
                  logCreateCastRumAction(
                    'QueuedCast.image_upload_cancel_requested',
                    {
                      ...rumBaseContext,
                      src: oi.src,
                    },
                  );
                  trackEvent(AnalyticsEvent.CastComposerEmbedRemoved, {
                    castLocalKey: localKey,
                    type: 'image',
                  });
                  cancelActiveVideoUpload();

                  dispatch({
                    type: 'RemoveImage',
                    castQueueId,
                    castLocalKey: localKey,
                    src: oi.src,
                  });

                  const ei = embeds.images.find(
                    (o) => o.version === 'v2' && o.localUriRef === oi.src,
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
          </ScrollView>
          {shouldShowProcessedEmbeds && (
            <CastComposerEmbedsPreviews
              processedEmbeds={processedEmbeds}
              removeUrlEmbed={removeUrlEmbed}
              removeImageEmbed={removeImageEmbed}
              refreshable={developerModeEnabled}
              onRefreshPress={handleRefreshPress}
            />
          )}
        </View>
      </View>
    );
  },
);

export { QueuedCast };
