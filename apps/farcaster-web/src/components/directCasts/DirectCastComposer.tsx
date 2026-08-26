import Editor from '@draft-js-plugins/editor';
import { PaperAirplaneIcon, PlusIcon } from '@primer/octicons-react';
import cn from 'classnames';
import {
  ContentState,
  DraftHandleValue,
  EditorState,
  Modifier,
  SelectionState,
} from 'draft-js';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageMetadata,
  ApiDirectCastMessageV3,
  ApiDirectCastUrlEmbedDisplayMode,
} from 'farcaster-client-data';
import { isHandledFetchError } from 'farcaster-client-data/src/types/errors';
import {
  SendDirectCastData,
  useSendDirectCast,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { generateMessageId } from 'farcaster-cryptography';
import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EmojiComposerPicker } from '~/components/composer/pickers/EmojiComposerPicker';
import { useDirectCastsLinkifyComposerPlugin } from '~/components/composer/plugins/DirectCastsLinkifyComposerPlugin';
import { useDirectCastsMentionsComposerPlugin } from '~/components/composer/plugins/DirectCastsMentionsComposerPlugin';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FileInput } from '~/components/forms/FileInput';
import { DirectCastsImagePreviewModal } from '~/components/modals/DirectCastsImagePreviewModal';
import { MAX_DIRECT_CAST_TEXT_LENGTH } from '~/constants/casts';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useDirectCastsDrafts } from '~/contexts/DirectCastsDraftsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useUploadCloudflareImage } from '~/hooks/data/useUploadCloudflareImage';
import { useNavigateToDirectCastsInbox } from '~/hooks/navigation/useNavigateToDirectCastsInbox';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import {
  hideDirectCastUrlEmbedForViewer,
  setDirectCastUrlEmbedDisplayMode,
} from '~/utils/directCastUrlEmbedPreviewStorage';
import { trackError } from '~/utils/errorUtils';

import {
  DirectCastComposerEmbedPreviewsInterface,
  DirectCastsComposerEmbedPreviews,
} from './DirectCastComposerEmbedPreviews';
import { DirectCastLengthCounter } from './DirectCastLengthCounter';
import { RepliedDirectCast } from './RepliedDirectCast';

export type DirectCastComposerInterface = {
  handleDroppedImage: ({ image }: { image: File }) => void;
  getNormalizedText: () => string;
  focus: () => void;
};

type DirectCastFormProps = {
  conversation: ApiDirectCastConversationInfoV3;
  replyTo: ApiDirectCastMessageV3 | undefined;
  setReplyTo: (replyTo: ApiDirectCastMessageV3 | undefined) => void;
  onNewDirectCast: ({ messageId }: { messageId: string }) => void;
  composerRef: React.RefObject<DirectCastComposerInterface | null>;
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  setOptimisticMessage: (message: ApiDirectCastMessageV3 | undefined) => void;
};

const DirectCastComposer: FC<DirectCastFormProps> = memo(
  ({
    conversation,
    replyTo,
    setReplyTo,
    onNewDirectCast,
    composerRef,
    editorState,
    setEditorState,
    setOptimisticMessage,
  }) => {
    const { text: intentText } = useSearchParams('directCastsConversation');

    const {
      plugin: linkifyComposerPlugin,
      debouncedSetOpenGraphLink,
      shouldCheckMetadata,
    } = useDirectCastsLinkifyComposerPlugin();

    const currentUser = useCurrentUser();
    const { trackEvent } = useAnalytics();
    const { trackEvent: eventingTrackEvent } = useTrackEvent();

    const [initialized, setInitialized] = React.useState<boolean>(false);
    const { getExistingDraft, discardDraft, saveDraft } =
      useDirectCastsDrafts();

    const navigateToInbox = useNavigateToDirectCastsInbox();

    const {
      isOpen: mentionsSuggestionsOpen,
      plugin: mentionComposerPlugin,
      renderPlugin: renderMentionComposerPlugin,
    } = useDirectCastsMentionsComposerPlugin({
      prioritizedUsers: conversation.participants.filter(
        (p) => p.fid !== currentUser.fid,
      ),
    });

    const [selectedImage, setSelectedImage] = useState<string | undefined>(
      undefined,
    );
    const [selectedFile, setSelectedFile] = useState<File | undefined>(
      undefined,
    );

    const editorRef = useRef<Editor>(null);
    const embedPreviewsRef =
      React.useRef<DirectCastComposerEmbedPreviewsInterface>(null);

    const [resolvedComposerMetadata, setResolvedComposerMetadata] =
      React.useState<ApiDirectCastMessageMetadata | undefined>(undefined);

    const urlPreviewAppliesToComposer = React.useMemo(() => {
      const m = resolvedComposerMetadata;
      if (typeof m === 'undefined') {
        return false;
      }
      if (typeof m.casts !== 'undefined' && m.casts.length !== 0) {
        return false;
      }
      if (
        typeof m.groupInvites !== 'undefined' &&
        m.groupInvites.length !== 0
      ) {
        return false;
      }
      return typeof m.urls !== 'undefined' && m.urls.length !== 0;
    }, [resolvedComposerMetadata]);

    const [omitUrlPreview, setOmitUrlPreview] = React.useState(false);
    const [urlEmbedDisplayMode, setUrlEmbedDisplayMode] =
      React.useState<ApiDirectCastUrlEmbedDisplayMode>('compact');

    React.useEffect(() => {
      if (!urlPreviewAppliesToComposer) {
        setOmitUrlPreview(false);
        setUrlEmbedDisplayMode('compact');
      }
    }, [urlPreviewAppliesToComposer]);

    const [alreadyManuallyFocused, setAlreadyManuallyFocused] =
      React.useState<boolean>(false);
    const [alertDirectCastLength, setAlertDirectCastLength] =
      React.useState<boolean>(false);

    const sendDirectCast = useSendDirectCast();
    const uploadImageToCloudflare = useUploadCloudflareImage();

    // Helper to check if another input/editable element currently has focus
    const isNonComposerTextInputFocused = React.useCallback(() => {
      const activeElement = document.activeElement;
      const activeHTMLElement =
        activeElement instanceof HTMLElement ? activeElement : null;

      return (
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        (activeHTMLElement !== null &&
          (activeHTMLElement as HTMLElement).isContentEditable &&
          !activeHTMLElement.closest('.DraftEditor-root'))
      );
    }, []);

    const normalizedText = useMemo(() => {
      return editorState.getCurrentContent().getPlainText().trimEnd();
    }, [editorState]);

    useEffect(() => {
      let height = 0;
      if (editorRef.current) {
        const rect = editorRef.current
          .getEditorRef()
          .editor.getBoundingClientRect();
        height = rect?.height ?? 0;
      }
      if (embedPreviewsRef.current) {
        const rect = embedPreviewsRef.current.getBoundingClientRect();
        if (rect) {
          height += rect.height + 10;
        }
      }
      if (height > 0) {
        document.documentElement.style.setProperty(
          '--dc-editor-height',
          `${height}px`,
        );
      }
    }, [editorState]);

    const updateDraft = React.useCallback(
      ({ text }: { text: string }) => {
        saveDraft({
          conversationId: conversation.conversationId,
          text: text,
        });
      },
      [conversation.conversationId, saveDraft],
    );

    const onEditorChange = useCallback(
      (nes: EditorState) => {
        if (typeof selectedImage !== 'undefined') {
          return;
        }

        const directCastText = nes.getCurrentContent().getPlainText();

        const length = directCastText.length;

        setEditorState(nes);

        if (length <= MAX_DIRECT_CAST_TEXT_LENGTH) {
          setAlertDirectCastLength(false);

          debouncedSetOpenGraphLink(nes);
        } else {
          setAlertDirectCastLength(true);
        }
      },
      [debouncedSetOpenGraphLink, setEditorState, selectedImage],
    );

    const handlePastedFiles = React.useCallback(
      (files: File[]): DraftHandleValue => {
        const fileReader = new FileReader();

        fileReader.onloadend = async () => {
          const base64ImageData = fileReader.result?.toString();
          setSelectedImage(base64ImageData);
          setSelectedFile(files[0]);
        };

        fileReader.readAsDataURL(files[0]);

        return 'handled';
      },
      [],
    );

    const handleDroppedImage = React.useCallback(
      ({ image }: { image: File }) => {
        const fileReader = new FileReader();

        fileReader.onloadend = async () => {
          const base64ImageData = fileReader.result?.toString();
          setSelectedImage(base64ImageData);
          setSelectedFile(image);
        };

        fileReader.readAsDataURL(image);
      },
      [],
    );

    const handleDroppedFiles = React.useCallback(
      (_: SelectionState | undefined, files: Blob[]): DraftHandleValue => {
        const images = files.filter((o) => o.type.indexOf('image/') === 0);

        if (images.length === 0) {
          return 'handled';
        }

        const image = images[0];
        const file = new File([image], 'conversation-image-upload');

        handleDroppedImage({ image: file });

        return 'handled';
      },
      [handleDroppedImage],
    );

    const onAddImageClick = useCallback(() => {
      const input = document.getElementById('dc-img-input');
      if (input) {
        input.click();
      }
    }, []);

    const [existingImageUploadPromise, setExistingImageUploadPromise] =
      React.useState<
        | Promise<
            | {
                imageUrl: string;
              }
            | undefined
          >
        | undefined
      >(undefined);

    const optimisticallyUploadImageToCloudflare =
      React.useCallback(async () => {
        if (typeof selectedFile === 'undefined') {
          return;
        }

        if (typeof existingImageUploadPromise !== 'undefined') {
          return;
        }

        const uploadPromise = uploadImageToCloudflare({
          file: selectedFile,
        });

        setExistingImageUploadPromise(uploadPromise);
      }, [existingImageUploadPromise, selectedFile, uploadImageToCloudflare]);

    React.useEffect(() => {
      if (typeof selectedFile !== 'undefined') {
        optimisticallyUploadImageToCloudflare();
      } else {
        setExistingImageUploadPromise(undefined);
      }
    }, [optimisticallyUploadImageToCloudflare, selectedFile]);

    const sendDirectCastMessage = useCallback(
      async ({
        directCastMessageText,
        directCastMetadata,
        urlPreviewIntent,
      }: {
        directCastMessageText: string;
        directCastMetadata: ApiDirectCastMessageMetadata | undefined;
        urlPreviewIntent?:
          | { kind: 'hidden' }
          | { kind: 'mode'; mode: ApiDirectCastUrlEmbedDisplayMode };
      }) => {
        if (
          alertDirectCastLength ||
          directCastMessageText.length > MAX_DIRECT_CAST_TEXT_LENGTH
        ) {
          return;
        }

        const tmpReplyTo = replyTo;
        const tmpEditorState = editorState;

        const messageId = generateMessageId();

        // The server re-parses URLs from the message text and may rebuild
        // `metadata.urls` without echoing `urlEmbedDisplayMode`. Persist the
        // sender's chosen display mode (or hidden intent) locally so the
        // renderer can honor it regardless of what the server echoes back.
        if (urlPreviewIntent?.kind === 'hidden') {
          hideDirectCastUrlEmbedForViewer(messageId);
        } else if (urlPreviewIntent?.kind === 'mode') {
          setDirectCastUrlEmbedDisplayMode(messageId, urlPreviewIntent.mode);
        }

        const messageSenderContext = {
          displayName: currentUser.displayName,
          fid: currentUser.fid,
          pfp: currentUser.pfp,
          username: currentUser.username,
        };

        const data: SendDirectCastData = {
          fid: currentUser.fid,
          messageId: messageId,
          recipientFids: conversation.participants
            .map((p) => p.fid)
            .filter((p) => p !== currentUser.fid),
          conversationId: conversation.conversationId,
          conversationCategory: conversation.viewerContext.category,
          type: 'text',
          message: directCastMessageText,
          optimisticInReplyTo: tmpReplyTo,
          optimisticMetadata: directCastMetadata,
          senderContext: messageSenderContext,
        };
        try {
          const onSuccess = () => {
            discardDraft({ conversationId: conversation.conversationId });
            if (conversation.viewerContext.category === 'request') {
              eventingTrackEvent({
                name: 'accept direct cast request',
                props: {
                  conversationId: conversation.conversationId,
                },
              });
            }
          };

          const onError = () => {
            setReplyTo(tmpReplyTo);
            setEditorState(tmpEditorState);
          };

          const { error } = await sendDirectCast({
            data,
            onOptimisticUpdate: (message: ApiDirectCastMessageV3) => {
              setReplyTo(undefined);
              setEditorState(EditorState.createEmpty());
              setOptimisticMessage(message);
              // Reset editor without remount - DraftJS supports this safely
              setTimeout(() => editorRef.current?.focus(), 50);
            },
            onSuccess,
            onError,
          });

          if (isHandledFetchError(error) && error.status === 403) {
            navigateToInbox();
          }
        } catch (error) {
          trackEvent(AnalyticsEvent.DirectCastFailedToSend, {});
          trackError(error);
        } finally {
          onNewDirectCast({ messageId });
          setOptimisticMessage(undefined);
        }
      },
      [
        alertDirectCastLength,
        conversation.conversationId,
        conversation.participants,
        conversation.viewerContext.category,
        currentUser.displayName,
        currentUser.fid,
        currentUser.pfp,
        currentUser.username,
        discardDraft,
        eventingTrackEvent,
        onNewDirectCast,
        replyTo,
        sendDirectCast,
        setReplyTo,
        trackEvent,
        navigateToInbox,
        editorState,
        setEditorState,
        setOptimisticMessage,
      ],
    );

    const optimisticallyFetchImageMetadata = useCallback(
      ({
        imageUrl,
      }: {
        imageUrl: string;
      }): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new Image();

          img.src = imageUrl;

          img.onload = function () {
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            resolve({ width, height });
          };
        });
      },
      [],
    );

    const onSendImageClick = useCallback(
      async ({ message }: { message: string | undefined }) => {
        if (
          typeof selectedImage === 'undefined' ||
          typeof selectedFile === 'undefined'
        ) {
          return;
        }

        try {
          const result =
            typeof existingImageUploadPromise !== 'undefined'
              ? await existingImageUploadPromise
              : await uploadImageToCloudflare({
                  file: selectedFile,
                });

          if (typeof result === 'undefined' || !result.imageUrl) {
            throw 'Failed to upload image';
          }

          const metadata = await optimisticallyFetchImageMetadata({
            imageUrl: result.imageUrl,
          });

          const imageMetadata: ApiDirectCastMessageMetadata = {
            medias: [
              {
                staticRaster: result.imageUrl,
                height: metadata.height,
                width: metadata.width,
                version: '2',
              },
            ],
          };

          const directCastMessageText =
            typeof message !== 'undefined'
              ? `${result.imageUrl} ${message}`
              : result.imageUrl;

          sendDirectCastMessage({
            directCastMessageText: directCastMessageText,
            directCastMetadata: imageMetadata,
          });

          trackEvent(AnalyticsEvent.SendDirectCastWithImage, {
            participant_count: conversation.participants.length,
          });
        } catch (e) {
          alert('Failed to upload image');

          trackError(e);
        } finally {
          setSelectedImage(undefined);
          setSelectedFile(undefined);
        }
      },
      [
        conversation.participants.length,
        existingImageUploadPromise,
        optimisticallyFetchImageMetadata,
        selectedFile,
        selectedImage,
        sendDirectCastMessage,
        trackEvent,
        uploadImageToCloudflare,
      ],
    );

    const repliedSender = React.useMemo(() => {
      return conversation.participants.find(
        ({ fid }) => fid === replyTo?.senderFid,
      );
    }, [conversation.participants, replyTo?.senderFid]);

    const submit = useCallback(() => {
      if (normalizedText === '') {
        return;
      }

      const directCastMetadata =
        typeof embedPreviewsRef.current !== 'undefined' &&
        embedPreviewsRef.current !== null
          ? embedPreviewsRef.current.getCurrentMessageMetadata()
          : undefined;

      const composerHasUrlEmbed =
        typeof resolvedComposerMetadata?.urls !== 'undefined' &&
        resolvedComposerMetadata.urls.length !== 0;

      sendDirectCastMessage({
        directCastMessageText: normalizedText,
        directCastMetadata: directCastMetadata,
        urlPreviewIntent: composerHasUrlEmbed
          ? omitUrlPreview
            ? { kind: 'hidden' }
            : { kind: 'mode', mode: urlEmbedDisplayMode }
          : undefined,
      });

      trackEvent(AnalyticsEvent.CreateDirectCast, {
        participant_count: conversation.participants.length,
        is_token_gated: conversation.isCollectionTokenGated,
      });
    }, [
      conversation.isCollectionTokenGated,
      conversation.participants.length,
      normalizedText,
      omitUrlPreview,
      resolvedComposerMetadata,
      sendDirectCastMessage,
      trackEvent,
      urlEmbedDisplayMode,
    ]);

    // Editor will receive a auto-focus by using the ref.
    // Otherwise click on the text area will also bring in the focus as expected.
    React.useEffect(() => {
      // Apperantly, setting focus on the editor right away brakes plugins. (mentions & emojis)
      // Wrapping it with a timout of 50ms fixes it.
      // Doesn't seem like there is a desire to fix it upstream so we will keep this hack for now. (goksu)
      // https://github.com/draft-js-plugins/draft-js-plugins/issues/800

      const timeout = setTimeout(() => {
        // Only auto-focus if no other input is focused
        if (
          editorRef.current &&
          !alreadyManuallyFocused &&
          !isNonComposerTextInputFocused()
        ) {
          editorRef.current.focus();
          setAlreadyManuallyFocused(true);
        }
      }, 50);
      return () => clearTimeout(timeout);
    }, [alreadyManuallyFocused, isNonComposerTextInputFocused]);

    React.useEffect(() => {
      const timeout = setTimeout(() => {
        // Only auto-focus if no other input is focused
        if (
          editorRef.current &&
          typeof replyTo !== 'undefined' &&
          !isNonComposerTextInputFocused()
        ) {
          editorRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timeout);
    }, [replyTo, isNonComposerTextInputFocused]);

    const onEditorBlur = React.useCallback(() => {
      // Don't reset alreadyManuallyFocused here - we don't want to re-enable auto-focus
      // just because user clicked away. Only reset when switching conversations.
      updateDraft({ text: normalizedText });
      // Don't call blur() here - we're already in a blur handler!
    }, [normalizedText, updateDraft]);

    const prevConversationIdRef = useRef<string | undefined>(null);

    React.useEffect(() => {
      if (prevConversationIdRef.current !== conversation.conversationId) {
        prevConversationIdRef.current = conversation.conversationId;
        setInitialized(false);
        setAlreadyManuallyFocused(false); // Reset auto-focus for new conversation
      }
    }, [conversation.conversationId]);

    const insertTextAndMoveCursorToEnd = React.useCallback(
      ({ text }: { text: string }) => {
        const newTextContentState = ContentState.createFromText(text);
        const es = EditorState.createWithContent(newTextContentState);

        const blockMap = newTextContentState.getBlockMap();
        const key = blockMap.last().getKey();
        const length = blockMap.last().getLength();

        const ss = SelectionState.createEmpty(key).merge({
          anchorOffset: length,
          focusOffset: length,
        });

        const editorStateWithSelection = EditorState.forceSelection(es, ss);

        setEditorState(editorStateWithSelection);
      },
      [setEditorState],
    );

    React.useLayoutEffect(() => {
      const existingDraft = getExistingDraft({
        conversationId: conversation.conversationId,
      });

      if (!initialized) {
        if (typeof intentText !== 'undefined') {
          insertTextAndMoveCursorToEnd({ text: intentText });
        } else if (typeof existingDraft !== 'undefined') {
          insertTextAndMoveCursorToEnd({ text: existingDraft });
        }
        setInitialized(true);
      }
    }, [
      conversation.conversationId,
      getExistingDraft,
      initialized,
      insertTextAndMoveCursorToEnd,
      intentText,
    ]);

    const onEmojiPick = React.useCallback(
      ({ emoji }: { emoji: string }) => {
        const currentContent = editorState.getCurrentContent();
        const currentSelection = editorState.getSelection();
        // We are inserting an empty space between the emoji and the cursor for smooth
        // typing flow. (goksu)
        const newContent = Modifier.replaceText(
          currentContent,
          currentSelection,
          `${emoji} `,
        );
        const newEditorState = EditorState.push(
          editorState,
          newContent,
          'insert-characters',
        );

        setEditorState(newEditorState);
      },
      [editorState, setEditorState],
    );

    React.useImperativeHandle(composerRef, () => {
      return {
        handleDroppedImage: ({ image }: { image: File }) => {
          handleDroppedImage({ image });
        },
        getNormalizedText: () => {
          return normalizedText;
        },
        focus: () => {
          const activeElement = document.activeElement as HTMLElement | null;
          if (activeElement) {
            const tagName = activeElement.tagName;
            const isTextInput =
              tagName === 'INPUT' ||
              tagName === 'TEXTAREA' ||
              activeElement.isContentEditable;

            if (isTextInput) {
              return;
            }
          }

          editorRef.current?.focus();
        },
      };
    });

    return (
      <>
        <div className="bg-default relative flex flex-col space-y-3 border-t p-3 border-default">
          {shouldCheckMetadata && (
            <>
              <DirectCastsComposerEmbedPreviews
                message={normalizedText}
                embedPreviewsRef={embedPreviewsRef}
                omitUrlPreview={omitUrlPreview}
                urlEmbedDisplayMode={urlEmbedDisplayMode}
                onResolvedMetadata={setResolvedComposerMetadata}
              />
              {urlPreviewAppliesToComposer && (
                <div className="flex w-full flex-wrap items-center gap-2 px-1 text-xs text-muted">
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      !omitUrlPreview && urlEmbedDisplayMode === 'compact'
                        ? 'bg-overlay-medium text-default'
                        : 'hover:bg-overlay-faint',
                    )}
                    onClick={() => {
                      setOmitUrlPreview(false);
                      setUrlEmbedDisplayMode('compact');
                    }}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      !omitUrlPreview && urlEmbedDisplayMode === 'large'
                        ? 'bg-overlay-medium text-default'
                        : 'hover:bg-overlay-faint',
                    )}
                    onClick={() => {
                      setOmitUrlPreview(false);
                      setUrlEmbedDisplayMode('large');
                    }}
                  >
                    Large
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-full px-2 py-0.5',
                      omitUrlPreview
                        ? 'bg-overlay-medium text-default'
                        : 'hover:bg-overlay-faint',
                    )}
                    onClick={() => setOmitUrlPreview((o) => !o)}
                  >
                    Text only
                  </button>
                </div>
              )}
            </>
          )}
          <div className="flex w-full flex-row justify-between ">
            <FileInput
              id={'dc-img-input'}
              className="hidden"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];

                if (!file) {
                  return;
                }

                handleDroppedImage({ image: file });
              }}
            />
            <EmojiComposerPicker
              className="!mb-px flex size-10 min-w-10 items-center justify-center self-end !rounded-full !bg-transparent !p-0 hover:!bg-overlay-faint disabled:hover:!bg-transparent"
              iconClassName="text-action-purple"
              onEmojiPick={onEmojiPick}
            />
            <DefaultButton
              className="!mb-px flex size-10 min-w-10 items-center justify-center self-end !bg-transparent !p-0 hover:!bg-overlay-faint disabled:hover:!bg-transparent"
              type="button"
              onClick={onAddImageClick}
            >
              <PlusIcon size={24} className="text-action-purple" />
            </DefaultButton>
            <div
              className={cn(
                'relative',
                'scrollbar-vert mx-1 max-h-[600px] min-h-10 w-[332pt] overflow-hidden overflow-y-auto break-words rounded border p-2 px-3 text-sm bg-dc-input text-default',
                alertDirectCastLength ? 'border-danger' : 'border-default',
              )}
            >
              {replyTo && repliedSender && (
                <RepliedDirectCast
                  composerMode={true}
                  directCast={replyTo}
                  directCastSender={repliedSender}
                  dismissReply={() => {
                    setReplyTo(undefined);
                  }}
                  scrollToReply={undefined}
                  parentIsSelfDirectCast={true}
                  renderingInMessage={false}
                />
              )}
              <Editor
                ref={editorRef}
                editorState={editorState}
                readOnly={typeof selectedImage !== 'undefined'}
                placeholder={'Write a message'}
                plugins={[mentionComposerPlugin, linkifyComposerPlugin]}
                onChange={onEditorChange}
                spellCheck
                stripPastedStyles
                handleReturn={(e) => {
                  if (
                    !e.shiftKey &&
                    !alertDirectCastLength &&
                    !mentionsSuggestionsOpen
                  ) {
                    submit();
                    return 'handled';
                  }

                  return 'not-handled';
                }}
                handlePastedFiles={handlePastedFiles}
                handleDroppedFiles={handleDroppedFiles}
                onBlur={onEditorBlur}
              />
            </div>
            {alertDirectCastLength ? (
              <div className="mb-px flex size-10 min-w-10 items-center justify-center self-end">
                <DirectCastLengthCounter
                  directCastLength={normalizedText.length}
                />
              </div>
            ) : (
              <DefaultButton
                disabled={!normalizedText || alertDirectCastLength}
                onClick={submit}
                className="!mb-px flex size-10 min-w-10 items-center justify-center self-end !p-0 bg-action !text-action-purple disabled:!bg-overlay-medium"
              >
                <PaperAirplaneIcon size={24} className="pl-1 text-light" />
              </DefaultButton>
            )}
            {renderMentionComposerPlugin()}
          </div>
          {typeof selectedImage !== 'undefined' && (
            <DirectCastsImagePreviewModal
              existingNormalizedText={normalizedText}
              selectedImage={selectedImage}
              onClose={() => {
                setSelectedImage(undefined);
                setSelectedFile(undefined);
              }}
              onSendImage={onSendImageClick}
            />
          )}
        </div>
      </>
    );
  },
);

DirectCastComposer.displayName = 'DirectCastComposer';

export { DirectCastComposer };
