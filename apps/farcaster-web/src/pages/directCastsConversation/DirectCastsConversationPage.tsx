import { ChevronDownIcon } from '@primer/octicons-react';
import cn from 'classnames';
import isSameDay from 'date-fns/isSameDay';
import { EditorState } from 'draft-js';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
  type FetchError,
} from 'farcaster-client-data';
import {
  extractDirectCastKey,
  isVerifiedSender,
  useDirectCastConversation,
  useMarkConversationRead,
  useUnseen,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { DirectCast } from '~/components/directCasts/DirectCast';
import {
  DirectCastComposer,
  DirectCastComposerInterface,
} from '~/components/directCasts/DirectCastComposer';
import { DirectCastDisabledComposer } from '~/components/directCasts/DirectCastDisabledComposer';
import { GroupInviteRequestDisclaimer } from '~/components/directCasts/GroupInviteRequestDisclaimer';
import { MessageRequestDisclaimers } from '~/components/directCasts/MessageRequestDisclaimers';
import {
  BidirectionalFlatList,
  FlatListRef,
} from '~/components/lists/BidirectionalFlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { Page } from '~/components/page/Page';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import {
  DirectCastsConversationMessagesProvider,
  useDirectCastsConversationMessages,
} from '~/contexts/DirectCastsConversationMessagesProvider';
import {
  DirectCastConversationProvider,
  useDirectCastConversationContext,
} from '~/contexts/ManageDirectCastConversationProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useParams } from '~/hooks/navigation/useParams';
import {
  directCastsAreInSameGroup,
  getConversationIdFromActiveConversationId,
  getMessageIdFromActiveConversationId,
} from '~/utils/directCastUtils';

import { DirectCastsConversationPageHeader } from './DirectCastsConversationPageHeader';

const DirectCastsConversationPage: FC = memo(() => {
  const { conversationId: activeConversationId } = useParams(
    'directCastsConversation',
  );
  const conversationId =
    getConversationIdFromActiveConversationId(activeConversationId);
  const messageId = getMessageIdFromActiveConversationId(activeConversationId);

  if (!conversationId) {
    return <></>;
  }

  return (
    <Page
      meta={{ title: 'Conversation' }}
      className="relative h-[calc(100vh-56px)] max-h-screen w-full min-w-0 grow sm:h-[calc(100vh-309px)] lg:h-screen"
    >
      <React.Suspense>
        <DirectCastsConversationPageContentWithFetch
          conversationId={conversationId}
          focusOnMessageId={messageId}
        />
      </React.Suspense>
    </Page>
  );
});

type DirectCastsConversationPageContentWithFetchProps = {
  conversationId: string;
  focusOnMessageId: string | undefined;
};

const DirectCastsConversationPageContentWithFetch: React.FC<DirectCastsConversationPageContentWithFetchProps> =
  React.memo(({ conversationId, focusOnMessageId }) => {
    const {
      data: conversation,
      error,
      isPending,
    } = useDirectCastConversation({
      conversationId,
    });

    if (isPending) {
      return <FullScreenLoadingIndicator />;
    }

    const conversationNotFound =
      (error as FetchError | undefined)?.status === 400;

    if (conversationNotFound) {
      return (
        <div className="flex size-full flex-col items-center justify-center">
          <span className="mb-4 text-2xl font-semibold">
            No conversation found.
          </span>
        </div>
      );
    }

    if (error) {
      throw error;
    }

    if (typeof conversation === 'undefined') {
      // We are still failing to find the conversation - not much we can do here
      // TODO: A better response compared to an empty fragment.
      return <></>;
    }

    return (
      <DirectCastsConversationPageContent
        conversation={conversation}
        focusOnMessageId={focusOnMessageId}
      />
    );
  });

const DropOverlayImageIcon: React.FC = React.memo(() => {
  return (
    <svg width="40" height="41" viewBox="0 0 40 41" fill="none">
      <g id="file-media-24">
        <g id="Icon">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M17.4999 15.9167C17.4999 18.9083 15.0748 21.3334 12.0833 21.3334C9.09171 21.3334 6.66659 18.9083 6.66659 15.9167C6.66659 12.9252 9.09171 10.5001 12.0833 10.5001C15.0748 10.5001 17.4999 12.9252 17.4999 15.9167ZM14.9999 15.9167C14.9999 17.5276 13.6941 18.8334 12.0833 18.8334C10.4724 18.8334 9.16659 17.5276 9.16659 15.9167C9.16659 14.3059 10.4724 13.0001 12.0833 13.0001C13.6941 13.0001 14.9999 14.3059 14.9999 15.9167Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M36.2499 36.3334C37.8607 36.3334 39.1666 35.0276 39.1666 33.4167V7.58341C39.1666 5.97258 37.8607 4.66675 36.2499 4.66675H3.74992C2.13909 4.66675 0.833252 5.97258 0.833252 7.58341V33.4167C0.833252 35.0276 2.13909 36.3334 3.74992 36.3334H36.2499ZM3.74992 7.16675C3.5198 7.16675 3.33325 7.3533 3.33325 7.58341V33.4167C3.33325 33.6469 3.5198 33.8334 3.74992 33.8334H9.04663L23.3326 18.7955C24.4622 17.6065 26.3499 17.5823 27.5096 18.742L36.6666 27.899V7.58341C36.6666 7.3533 36.48 7.16675 36.2499 7.16675H3.74992ZM36.6666 33.4167V31.4345L25.7418 20.5098C25.5761 20.3441 25.3065 20.3475 25.1451 20.5174L12.4949 33.8334H36.2499C36.48 33.8334 36.6666 33.6469 36.6666 33.4167Z"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  );
});

const DirectCastsDropOverlay: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 z-20 flex size-full flex-col items-center justify-center bg-[#f4f4f4] p-2 dark:bg-[#2A2432]">
      <div className="flex size-full flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed bg-[#f3f3f3] border-default dark:bg-[#2A2432]">
        <span className="rounded-lg p-4 bg-overlay-semi-medium text-action-purple">
          <DropOverlayImageIcon />
        </span>
        <div className="text-xl font-semibold text-default">
          Drop here to upload
        </div>
      </div>
    </div>
  );
});

type DirectCastsScrollDownButtonProps = {
  onClickCallback: () => void;
};

const DirectCastsScrollDownButton: React.FC<DirectCastsScrollDownButtonProps> =
  React.memo(({ onClickCallback }) => {
    const { trackEvent } = useAnalytics();

    const onScrollDownClick = React.useCallback(() => {
      trackEvent(AnalyticsEvent.ClickScrollDownDirectCasts, {});

      onClickCallback();
    }, [onClickCallback, trackEvent]);

    return (
      <div
        className="absolute bottom-3 right-3 z-10 flex cursor-pointer flex-col rounded-full border p-2 shadow-xl bg-app border-default dark:bg-[#342942]"
        onClick={onScrollDownClick}
      >
        <ChevronDownIcon size={28} className="translate-y-px" />
      </div>
    );
  });

type DirectCastsConversationPageContentProps = {
  conversation: ApiDirectCastConversationInfoV3;
  focusOnMessageId: string | undefined;
};

const DirectCastsConversationPageContent: React.FC<DirectCastsConversationPageContentProps> =
  React.memo(({ conversation, focusOnMessageId }) => {
    return (
      <DirectCastConversationProvider
        key={conversation.conversationId}
        conversation={conversation}
      >
        <DirectCastsConversationMessagesProvider
          key={conversation.conversationId}
          conversation={conversation}
        >
          <DirectCastsConversationPageContentInner
            key={conversation.conversationId}
            focusOnMessageId={focusOnMessageId}
          />
        </DirectCastsConversationMessagesProvider>
      </DirectCastConversationProvider>
    );
  });

type DirectCastsConversationPageContentInnerProps = {
  focusOnMessageId: string | undefined;
};

const DirectCastsConversationPageContentInner: React.FC<DirectCastsConversationPageContentInnerProps> =
  React.memo(({ focusOnMessageId }) => {
    const { fid } = useCurrentUser();
    const conversation = useDirectCastConversationContext()
      .conversation as ApiDirectCastConversationInfoV3;
    const { conversationId } = conversation;

    const listRef = React.useRef<FlatListRef>(null);

    const composerRef = React.useRef<DirectCastComposerInterface>(null);

    const [replyTo, setReplyTo] = useState<
      ApiDirectCastMessageV3 | undefined
    >();

    const markConversationRead = useMarkConversationRead();
    const { decreaseInboxCount } = useUnseen();
    const { trackEvent } = useAnalytics();

    const isGroupInviteRequest =
      conversation.viewerContext.category === 'request' && conversation.isGroup;

    const isPendingMessageRequest =
      conversation.viewerContext.category === 'request' ||
      conversation.viewerContext.category === 'void';

    const counterParties = useMemo(() => {
      return conversation?.participants.filter((p) => p.fid !== fid);
    }, [conversation?.participants, fid]);

    const verifiedSender = React.useMemo(
      () =>
        typeof conversation.viewerContext.counterParty !== 'undefined' &&
        isVerifiedSender({
          conversationCounterPartyFid:
            conversation.viewerContext.counterParty.fid,
        }),
      [conversation],
    );

    const readOnlyConversation = React.useMemo(
      () => conversation.viewerContext.access === 'read',
      [conversation.viewerContext.access],
    );

    const lastMessageTextContentRef = React.useRef<string>(undefined);

    const {
      conversationState,
      fetchNewerMessages,
      fetchOlderMessages,
      refetchFullConversation,
      load,
      isFetchingOlderMessages,
      isFetchingNewerMessages,
      hasOlderMessages,
      hasNewerMessages,
    } = useDirectCastsConversationMessages();

    const [editorState, setEditorState] = React.useState(() =>
      EditorState.createEmpty(),
    );
    const [optimisticMessage, setOptimisticMessage] = React.useState<
      ApiDirectCastMessageV3 | undefined
    >();

    const directCasts = React.useMemo(() => {
      const baseDirectCasts = uniqBy(
        conversationState.messages,
        extractDirectCastKey,
      );
      if (!optimisticMessage) {
        return baseDirectCasts;
      }

      const directCastsWithOptimisticMessage = [];
      let optimisticMessageInserted = false;
      let optimisticMessageAlreadyInList = false;
      for (const directCast of baseDirectCasts) {
        if (directCast.messageId === optimisticMessage.messageId) {
          optimisticMessageAlreadyInList = true;
          break;
        }
        if (
          !optimisticMessageInserted &&
          optimisticMessage.serverTimestamp > directCast.serverTimestamp
        ) {
          directCastsWithOptimisticMessage.push(optimisticMessage);
          optimisticMessageInserted = true;
        }
        directCastsWithOptimisticMessage.push(directCast);
      }
      if (!optimisticMessageAlreadyInList && !optimisticMessageInserted) {
        directCastsWithOptimisticMessage.push(optimisticMessage);
      }

      return optimisticMessageAlreadyInList
        ? baseDirectCasts
        : directCastsWithOptimisticMessage;
    }, [conversationState.messages, optimisticMessage]);

    const { manuallyMarkedUnread, unreadCount } = conversation.viewerContext;
    const isUnread = unreadCount > 0 || manuallyMarkedUnread;

    const markReadThroughAPI = React.useCallback(async () => {
      await markConversationRead({
        conversationId,
        fid: fid,
      });

      if (!conversation.viewerContext.muted && isUnread) {
        decreaseInboxCount();
      }
    }, [
      conversationId,
      fid,
      markConversationRead,
      conversation.viewerContext.muted,
      decreaseInboxCount,
      isUnread,
    ]);

    const conversationIsArchived = useMemo(() => {
      return conversation.viewerContext.category === 'archived';
    }, [conversation.viewerContext.category]);

    const triggerMarkConversationRead = React.useCallback(async () => {
      if (conversationId && !isPendingMessageRequest) {
        await markReadThroughAPI();
      }
    }, [conversationId, markReadThroughAPI, isPendingMessageRequest]);

    const prevManuallyMarkedUnreadRef = React.useRef(manuallyMarkedUnread);
    const blockAutoMarkAsReadRef = React.useRef(false);
    React.useEffect(() => {
      if (manuallyMarkedUnread !== prevManuallyMarkedUnreadRef.current) {
        blockAutoMarkAsReadRef.current = manuallyMarkedUnread;
        prevManuallyMarkedUnreadRef.current = manuallyMarkedUnread;
      }
      if (!blockAutoMarkAsReadRef.current) {
        triggerMarkConversationRead();
      }
    }, [manuallyMarkedUnread, triggerMarkConversationRead]);

    const conversationIsTokenGated = React.useMemo(() => {
      return (
        typeof conversation !== 'undefined' &&
        conversation.isCollectionTokenGated
      );
    }, [conversation]);

    useEffect(() => {
      if (conversationId) {
        trackEvent(AnalyticsEvent.ViewDirectCastsConversation, {
          conversationId,
          is_token_gated: conversationIsTokenGated,
        });
      }
    }, [conversationId, conversationIsTokenGated, trackEvent]);

    useEffect(() => {
      if (
        typeof conversation !== 'undefined' &&
        typeof conversation.lastMessage !== 'undefined' &&
        lastMessageTextContentRef.current !== conversation.lastMessage.messageId
      ) {
        // Checking the value being set since we will attempt to mark convo read already
        // on layout. No need to attempt again.
        if (typeof lastMessageTextContentRef.current !== 'undefined') {
          triggerMarkConversationRead();
        }
        lastMessageTextContentRef.current = conversation.lastMessage.messageId;
      }
    }, [conversation, conversation.lastMessage, triggerMarkConversationRead]);

    useEffect(() => {
      // Clean-up any possible stale state on conversation change
      setReplyTo(undefined);
    }, [conversationId]);

    const [hasFocusedMessageId, setHasFocusedMessageId] = React.useState<
      string | undefined
    >();

    const scrollAndHighlightItem = React.useCallback(
      async ({ index }: { index: number }) => {
        // Disable auto-scroll-to-bottom while loading/fetching data
        listRef.current?.disableAutoScrollToBottom(true);

        let attempts = 0;
        const cleanup = () => {
          listRef.current?.disableAutoScrollToBottom(false);
          setHasFocusedMessageId(focusOnMessageId);
        };
        const tryScrollAndHighlight = () => {
          const el = listRef.current?.getItemRef(index);
          if (el) {
            // Element is now in the DOM. Use scrollIntoView or scrollToIndex.
            // scrollIntoView gives you a convenient way to center or smoothly scroll.
            el.scrollIntoView({ behavior: 'auto', block: 'center' });

            // Now highlight once it's visible
            setTimeout(() => {
              el.classList.remove('scroll-into-view-animated');
              void el.offsetWidth; // Force reflow
              el.classList.add('scroll-into-view-animated');
              cleanup();
            }, 300);
          } else if (attempts < 20) {
            // Try again on the next animation frame if not found yet
            attempts++;
            requestAnimationFrame(tryScrollAndHighlight);
          } else {
            // If after multiple attempts we can't find the element, give up
            cleanup();
          }
        };

        requestAnimationFrame(tryScrollAndHighlight);
        composerRef.current?.focus();
      },
      [focusOnMessageId],
    );

    const navigateToMessageInTimeline = React.useCallback(
      ({ messageId }: { messageId: string }) => {
        const alreadyLoadedMessageIndex = directCasts.findIndex(
          (o) => o.messageId === messageId,
        );

        if (alreadyLoadedMessageIndex !== -1) {
          scrollAndHighlightItem({ index: alreadyLoadedMessageIndex });
        } else {
          const { scrollToIndex } = load({ messageId });
          // If load() returns an index after fetching...
          if (scrollToIndex !== -1) {
            scrollAndHighlightItem({ index: scrollToIndex });
          }
        }
      },
      [directCasts, scrollAndHighlightItem, load],
    );

    const focusedOnMessageIdRef = React.useRef<string | undefined>(undefined);
    React.useEffect(() => {
      if (
        !focusOnMessageId ||
        focusedOnMessageIdRef.current === focusOnMessageId
      ) {
        return;
      }
      focusedOnMessageIdRef.current = focusOnMessageId;
      requestAnimationFrame(() => {
        navigateToMessageInTimeline({ messageId: focusOnMessageId });
      });
    }, [focusOnMessageId, navigateToMessageInTimeline]);

    const scrollToReply = React.useCallback(
      ({ messageId: replyMessageId }: { messageId: string }) => {
        trackEvent(AnalyticsEvent.ClickRepliedDirectCast, {});

        navigateToMessageInTimeline({ messageId: replyMessageId });
        composerRef.current?.focus();
      },
      [navigateToMessageInTimeline, trackEvent],
    );

    const renderItem = React.useCallback(
      ({ index, item }: { index: number; item: ApiDirectCastMessageV3 }) => {
        if (typeof conversation === 'undefined') {
          return <></>;
        }

        const idx = index;
        const previousDirectCast = directCasts[idx + 1];
        const nextDirectCast = directCasts[idx - 1];

        const shouldCollapseAbove =
          typeof previousDirectCast !== 'undefined' &&
          typeof item !== 'undefined' &&
          directCastsAreInSameGroup({
            previousDirectCast,
            currentDirectCast: item,
          });

        const shouldCollapseBelow =
          typeof nextDirectCast !== 'undefined' &&
          typeof item !== 'undefined' &&
          directCastsAreInSameGroup({
            previousDirectCast: item,
            currentDirectCast: nextDirectCast,
          });

        const shouldShowDateMarker =
          typeof previousDirectCast === 'undefined' ||
          !isSameDay(
            new Date(item.serverTimestamp),
            new Date(previousDirectCast.serverTimestamp),
          );

        const shouldOmitMarginBelow = index === 0;

        const shouldRenderNewMessageMarker =
          conversationState.shouldRenderUnreadMarkerMessageId ===
          item.messageId;

        return (
          <div className="mr-[2px] flex flex-col">
            <DirectCast
              key={extractDirectCastKey(item)}
              directCast={item}
              showAvatar={conversation.isGroup && item.senderFid !== fid}
              conversation={conversation}
              shouldCollapseAbove={shouldCollapseAbove}
              shouldCollapseBelow={shouldCollapseBelow}
              shouldOmitMarginBelow={shouldOmitMarginBelow}
              shouldRenderNewMessageMarker={shouldRenderNewMessageMarker}
              shouldShowDateMarker={shouldShowDateMarker}
              setReplyTo={setReplyTo}
              scrollToReply={scrollToReply}
              readOnly={readOnlyConversation || isGroupInviteRequest}
            />
          </div>
        );
      },
      [
        conversation,
        conversationState.shouldRenderUnreadMarkerMessageId,
        directCasts,
        fid,
        scrollToReply,
        isGroupInviteRequest,
        readOnlyConversation,
      ],
    );

    const onNewDirectCast = React.useCallback(
      ({ messageId: _ }: { messageId: string }) => {
        if (
          typeof listRef.current !== 'undefined' &&
          listRef.current !== null
        ) {
          listRef.current.scrollToBottom();
        }
      },
      [],
    );

    const messageRequestActions = useMemo(() => {
      const category = conversation.viewerContext.category;
      if (category === 'request' || category === 'void') {
        // implicit assumption is that requests can only be created for 1:1
        // conversations
        const requester = conversation.participants.filter(
          ({ fid: participantFid }) => participantFid !== fid,
        )[0];

        if (category === 'request' && conversation.isGroup) {
          return (
            <GroupInviteRequestDisclaimer
              inviter={conversation.viewerContext.inviter}
            />
          );
        }

        return (
          <MessageRequestDisclaimers
            requestFid={requester.fid}
            requesterUsername={requester.username ?? ''}
            category={category}
          />
        );
      }

      return undefined;
    }, [conversation, fid]);

    const onDrop = React.useCallback(
      (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (typeof conversationId === 'undefined') {
          return;
        }

        // @ts-expect-error-next-line
        const items = e.dataTransfer.items;
        if (items.length > 0) {
          const item = items[0];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const image = new File(
              [item.getAsFile()],
              'conversation-image-upload',
            );

            composerRef.current?.handleDroppedImage({ image: image });
          }
        }

        setShowDropOverlay(false);
      },
      [conversationId],
    );

    const [showDropOverlay, setShowDropOverlay] =
      React.useState<boolean>(false);

    const onDragOver = React.useCallback(
      (e: React.SyntheticEvent) => {
        e.preventDefault();

        if (typeof conversationId === 'undefined') {
          return;
        }

        // @ts-expect-error-next-line
        const items = e.dataTransfer.items;
        if (items.length > 0) {
          const item = items[0];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            setShowDropOverlay(true);
          }
        }
      },
      [conversationId],
    );

    const onDragLeave = React.useCallback(() => {
      setShowDropOverlay(false);
    }, []);

    const [
      showScrollDownButtonDueToScroll,
      setShowScrollDownButtonDueToScroll,
    ] = React.useState<boolean>(false);

    const showScrollDownButton = React.useMemo(() => {
      return hasNewerMessages || showScrollDownButtonDueToScroll;
    }, [hasNewerMessages, showScrollDownButtonDueToScroll]);

    const onScrollDownButtonClick = React.useCallback(() => {
      if (hasNewerMessages) {
        refetchFullConversation();
      }

      listRef.current?.scrollToBottom();
    }, [hasNewerMessages, refetchFullConversation]);

    const onScroll: React.UIEventHandler<HTMLDivElement> = React.useCallback(
      (e) => {
        const el = e.currentTarget;
        setShowScrollDownButtonDueToScroll(el.scrollTop < -1024);
      },
      [],
    );

    const extractKey = React.useCallback((item: ApiDirectCastMessageV3) => {
      return item.messageId;
    }, []);

    const containerRef = React.useRef<HTMLDivElement>(null);

    // Whenever a user starts typing within the conversation, we focus the composer.
    // This provides a smoother experience so users can react and type without having
    // to click on the composer.
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const activeElement = document.activeElement;

        // If we're focused on an input/textarea outside our container, ignore the event.
        // This is so clicking on the DC Search bar and other input fields doesn't focus the composer.
        if (
          !containerRef.current?.contains(activeElement) &&
          (activeElement?.tagName === 'INPUT' ||
            activeElement?.tagName === 'TEXTAREA')
        ) {
          return;
        }

        const isEditableTarget =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA';

        if (!isEditableTarget) {
          if (
            /^[a-zA-Z0-9\s.,!?@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]$/.test(e.key) &&
            !e.ctrlKey &&
            !e.altKey &&
            !e.metaKey
          ) {
            composerRef.current?.focus();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!conversation) {
      return <FullScreenLoadingIndicator />;
    }

    return (
      <div
        ref={containerRef}
        className={cn('relative flex h-full w-full flex-col')}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragExit={onDragLeave}
        onDragEnd={onDragLeave}
      >
        {showDropOverlay && <DirectCastsDropOverlay />}
        <DirectCastsConversationPageHeader
          conversationId={conversation.conversationId}
          counterParties={counterParties ?? []}
          archived={conversationIsArchived}
          verifiedSender={verifiedSender}
          onPinnedMessageClick={navigateToMessageInTimeline}
        />
        <div
          className={cn('relative flex h-full flex-col overflow-hidden pl-2')}
        >
          <BidirectionalFlatList
            ref={listRef}
            key={conversationId}
            data={directCasts}
            emptyView={<></>}
            initialScrollItemKey={
              conversationState.shouldRenderUnreadMarkerMessageId
            }
            keyExtractor={extractKey}
            renderItem={renderItem}
            isFetchingNextPage={isFetchingOlderMessages}
            isFetchingPreviousPage={isFetchingNewerMessages}
            onStartReached={hasOlderMessages ? fetchOlderMessages : undefined}
            onEndReached={hasNewerMessages ? fetchNewerMessages : undefined}
            onScroll={onScroll}
          />
          {showScrollDownButton && (
            <DirectCastsScrollDownButton
              onClickCallback={onScrollDownButtonClick}
            />
          )}
        </div>
        {messageRequestActions}
        {!isGroupInviteRequest &&
          (readOnlyConversation ? (
            <DirectCastDisabledComposer
              conversationCounterParty={conversation.viewerContext.counterParty}
              conversationIsGroup={conversation.isGroup}
            />
          ) : (
            <DirectCastComposer
              // This allows the form to be conversation specific.
              // We are going to take advantage of the React key management for performant re-writes.
              // Without proper drafts this will lose some content on change but we are okay with that.
              key={conversationId}
              conversation={conversation}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onNewDirectCast={onNewDirectCast}
              composerRef={composerRef}
              editorState={editorState}
              setEditorState={setEditorState}
              setOptimisticMessage={setOptimisticMessage}
            />
          ))}
        {hasFocusedMessageId !== focusOnMessageId && (
          <div className="absolute inset-0 items-center justify-center bg-app">
            <FullScreenLoadingIndicator />
          </div>
        )}
      </div>
    );
  });

DirectCastsConversationPage.displayName = 'DirectCastsConversationPage';

export { DirectCastsConversationPage };
