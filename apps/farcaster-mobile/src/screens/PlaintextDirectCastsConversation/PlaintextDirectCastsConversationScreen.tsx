import { DdRum, RumActionType } from '@datadog/mobile-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiDirectCastConversationInfoV3,
  ApiDirectCastMessageV3,
  ApiUser,
  ApiUserMinimal,
  FetchError,
} from 'farcaster-client-data';
import { useDirectCastConversation } from 'farcaster-client-hooks';
import React, { memo, Suspense, useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadFailureIndicator } from '~/components/LoadFailureIndicator';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { topBarHeight } from '~/components/TopBar';
import { DirectCastsConversationMessagesProvider } from '~/contexts/DirectCastsConversationMessagesProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { PlaintextDirectCastsStackParamList } from '~/types';

import { ConversationScreenHeader } from './ConversationScreenHeader';
import { PlaintextDirectCastComposer } from './PlaintextDirectCastComposer';
import { PlaintextDirectCastDisabledComposer } from './PlaintextDirectCastDisabledComposer';
import { PlaintextDirectCastsConversation } from './PlaintextDirectCastsConversation';
import { MessagesListInterface } from './PlaintextDirectCastsConversationContent';

export type SetReplyTo = ({
  directCast,
  replyToSenderDisplayName,
}: {
  directCast: ApiDirectCastMessageV3;
  replyToSenderDisplayName: string;
}) => void;

type PlaintextDirectCastsConversationScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'PlaintextDirectCastsConversation'
>;

const PlaintextDirectCastsConversationScreen =
  buildScreen<PlaintextDirectCastsConversationScreenProps>(
    {
      name: 'PlaintextDirectCastsConversation',
      avoidKeyboard: false,
      insetTop: true,
    },
    ({ route: { params } }) => {
      const currentUser = useCurrentUser_UNSAFE();

      return (
        <Suspense
          fallback={
            <FullScreenLoadingIndicator debugName="PlaintextDirectCastsConversation" />
          }
        >
          <ConversationWrapper
            currentUserFid={currentUser.fid}
            conversationId={params.conversationId}
            intentText={params.intentText}
            create={params.create}
            counterParty={params.counterParty}
            focusOnMessageId={params.focusOnMessageId}
          />
        </Suspense>
      );
    },
  );

const ConversationWrapper = memo(
  ({
    currentUserFid,
    conversationId,
    intentText,
    create,
    counterParty,
    focusOnMessageId,
  }: {
    currentUserFid: number;
    conversationId: string;
    intentText: string | undefined;
    create: boolean | undefined;
    counterParty: ApiUserMinimal | undefined;
    focusOnMessageId: string | undefined;
  }) => {
    const {
      data: fetchedConversation,
      error,
      refetch,
    } = useDirectCastConversation({
      conversationId,
      enabled: !create,
    });
    const t = useTheme();

    // error isn't cleared when the retry button is pressed so created a separate
    // state-based error so we can clear it on button press so the failure indicator
    // doesn't render.
    const [fetchError, setFetchError] = useState<Error | null>(error);
    const is400FetchError = React.useMemo(() => {
      return (
        fetchError &&
        'status' in fetchError &&
        ((fetchError as FetchError).status ?? 0) % 400 < 100
      );
    }, [fetchError]);
    useEffect(() => {
      setFetchError(error);
    }, [error]);

    const conversation = React.useMemo(() => {
      if (typeof fetchedConversation !== 'undefined') {
        return fetchedConversation;
      }

      if (create) {
        const participants = [{ fid: currentUserFid } as ApiUserMinimal];
        if (typeof counterParty !== 'undefined') {
          participants.push(counterParty);
        }

        return {
          conversationId: conversationId,
          participants: participants as ApiUser[],
          adminFids: [],
          removedFids: [],
          muted: false,
          name: undefined,
          description: undefined,
          photoUrl: undefined,
          lastReadTime: 0,
          selfLastReadTime: 0,
          unreadCount: 0,
          hasMention: false,
          isGroup: false,
          isCollectionTokenGated: false,
          pinnedMessages: [],
          hasPinnedMessages: false,
          activeParticipantsCount: 0,
          messageTTLDays: 365,
          createdAt: Date.now(),
          viewerContext: {
            access: 'admin',
            manuallyMarkedUnread: false,
            category: 'default',
            archived: false,
            muted: false,
            pinned: false,
            unreadCount: 0,
            unreadMentionsCount: 0,
            unreadReactionMessage: undefined,
            counterParty: counterParty as ApiUser,
            tag: undefined,
            lastReadAt: 0,
          },
        } satisfies ApiDirectCastConversationInfoV3;
      }

      return undefined;
    }, [
      fetchedConversation,
      currentUserFid,
      conversationId,
      create,
      counterParty,
    ]);

    if (!create && fetchError) {
      return (
        <View style={[t.flex, t.hFull, t.wFull]}>
          <ConversationScreenHeader
            conversation={conversation}
            viewerCanInviteToGroup={false}
          />
          {is400FetchError ? (
            <Empty message="No conversation found." />
          ) : (
            <View style={[t.hFull]}>
              <LoadFailureIndicator
                style={[t.flex1, t.itemsCenter]}
                retry={() => {
                  setFetchError(null);
                  refetch();
                }}
              />
            </View>
          )}
        </View>
      );
    }

    const CoversationSuspenseFallback = (
      <View style={[t.hFull, t.justifyCenter, t.itemsCenter]}>
        <ConversationScreenHeader
          conversation={undefined}
          viewerCanInviteToGroup={false}
        />
        <FullScreenLoadingIndicator debugName="PlaintextDirectCastsConversation#SuspenseFallback" />
      </View>
    );

    if (typeof conversation === 'undefined') {
      return (
        <View style={[t.hFull, t.justifyCenter, t.itemsCenter]}>
          <ConversationScreenHeader
            conversation={undefined}
            viewerCanInviteToGroup={false}
          />
          <FullScreenLoadingIndicator debugName="PlaintextDirectCastsConversation#EmptyConvo" />
        </View>
      );
    }

    return (
      <Suspense fallback={CoversationSuspenseFallback}>
        <Conversation
          currentUserFid={currentUserFid}
          conversation={conversation}
          intentText={intentText}
          isOptimistic={!!create}
          focusOnMessageId={focusOnMessageId}
        />
      </Suspense>
    );
  },
);

const Conversation = memo(
  ({
    currentUserFid,
    conversation,
    intentText,
    isOptimistic,
    focusOnMessageId,
  }: {
    currentUserFid: number;
    conversation: ApiDirectCastConversationInfoV3;
    intentText: string | undefined;
    isOptimistic: boolean;
    focusOnMessageId: string | undefined;
  }) => {
    const t = useTheme();

    const [replyTo, setReplyTo] = React.useState<
      ApiDirectCastMessageV3 | undefined
    >();
    const [replyToSenderDisplayName, setReplyToSenderDisplayName] =
      React.useState<string | undefined>();

    const conversationName = React.useMemo(() => {
      if (
        !conversation.isGroup &&
        typeof conversation.viewerContext.counterParty !== 'undefined'
      ) {
        return conversation.viewerContext.counterParty.displayName;
      }

      return conversation.name || 'Group';
    }, [
      conversation.isGroup,
      conversation.name,
      conversation.viewerContext.counterParty,
    ]);

    const handleInputBlur = useCallback(() => {
      Keyboard.dismiss();
    }, []);

    const messagesListRef = React.useRef<MessagesListInterface>(null);

    const onNewMessageLoad = React.useCallback(() => {
      messagesListRef.current?.scrollToEnd();
    }, []);

    const onBeforeNewDirectCastSend = React.useCallback(() => {
      messagesListRef.current?.prepareForNewMessage();
    }, []);

    const onAfterNewDirectCastSend = React.useCallback(() => {
      messagesListRef.current?.scrollToEnd(true);
    }, []);

    const onDirectCastComposerFocus = React.useCallback(() => {
      // Handle direct cast composer focus
    }, []);

    const viewerCanInviteToGroup = React.useMemo(() => {
      return (
        (conversation.isGroup &&
          conversation.viewerContext.access === 'admin') ||
        (typeof conversation.groupPreferences !== 'undefined' &&
          conversation.groupPreferences.membersCanInvite)
      );
    }, [
      conversation.groupPreferences,
      conversation.isGroup,
      conversation.viewerContext.access,
    ]);

    const onSetReplyTo = React.useCallback(
      ({
        directCast,
        replyToSenderDisplayName: displayName,
      }: {
        directCast: ApiDirectCastMessageV3;
        replyToSenderDisplayName: string;
      }) => {
        setReplyTo(directCast);
        setReplyToSenderDisplayName(displayName);
      },
      [],
    );

    const onDismissReplyTo = React.useCallback(() => {
      setReplyTo(undefined);
      setReplyToSenderDisplayName(undefined);
    }, []);

    useFocusEffect(
      React.useCallback(() => {
        DdRum.addAction(RumActionType.CUSTOM, 'warpcast_custom_load_convo', {
          info: '[Direct Casts] Load conversation',
          conversation_id: conversation.conversationId,
          conversation_is_group: conversation.isGroup,
          conversation_participants_count: conversation.participants.length,
          conversation_unread_count: conversation.viewerContext.unreadCount,
        });
      }, [
        conversation.conversationId,
        conversation.isGroup,
        conversation.participants.length,
        conversation.viewerContext.unreadCount,
      ]),
    );

    useFocusEffect(
      React.useCallback(() => {
        return () => {
          // Dismiss the keyboard when leaving the conversation (header back,
          // hardware/gesture back, or forward navigation). Popping the screen
          // does not blur the composer's TextInput on Android, so the IME
          // otherwise stays open over the inbox list.
          Keyboard.dismiss();
        };
      }, []),
    );

    const [reduceMotionEnabled, setReduceMotionEnabled] =
      React.useState<boolean>(false);

    useFocusEffect(() => {
      AccessibilityInfo.isReduceMotionEnabled().then(
        (isReduceMotionEnabled) => {
          setReduceMotionEnabled(isReduceMotionEnabled);
        },
      );
    });

    const KeyboardHandlerView = React.useMemo(() => {
      // Seeing issues on positioning when some users have reduce motion enabled.
      // We will swap the component out to the React Native implementation in these
      // cases instead.
      if (reduceMotionEnabled) {
        return RNKeyboardAvoidingView;
      }
      return KeyboardAvoidingView;
    }, [reduceMotionEnabled]);

    const readOnlyConversation = React.useMemo(() => {
      return conversation.viewerContext.access === 'read';
    }, [conversation.viewerContext.access]);
    const insets = useSafeAreaInsets();
    return (
      <View style={[t.flex, t.hFull, t.wFull]}>
        <KeyboardHandlerView
          behavior="padding"
          keyboardVerticalOffset={insets.top}
          contentContainerStyle={t.flex1}
          style={t.flex1}
        >
          <ConversationScreenHeader
            conversation={conversation}
            viewerCanInviteToGroup={viewerCanInviteToGroup}
          />
          <View
            style={[
              t.flex1,
              t.hFull,
              t.wFull,
              { marginTop: topBarHeight },
              t.borderTHairline,
              t.borderDefault,
            ]}
          >
            <RetryableErrorBoundary>
              <View style={[t.flex1]}>
                <DirectCastsConversationMessagesProvider
                  currentUserFid={currentUserFid}
                  conversation={conversation}
                  shouldRefetchOnFocus={!focusOnMessageId}
                >
                  <PlaintextDirectCastsConversation
                    currentUserFid={currentUserFid}
                    conversationId={conversation.conversationId}
                    setReplyTo={onSetReplyTo}
                    onNewMessageLoad={onNewMessageLoad}
                    messagesListRef={messagesListRef}
                    isOptimistic={isOptimistic}
                    focusOnMessageId={focusOnMessageId}
                  />
                </DirectCastsConversationMessagesProvider>
                <View>
                  {conversation.viewerContext.category !== 'request' ||
                  !conversation.isGroup ? (
                    readOnlyConversation ? (
                      <PlaintextDirectCastDisabledComposer
                        conversationCounterParty={
                          conversation.viewerContext.counterParty
                        }
                        conversationIsGroup={conversation.isGroup}
                      />
                    ) : (
                      <PlaintextDirectCastComposer
                        onInputFocus={onDirectCastComposerFocus}
                        onInputBlur={handleInputBlur}
                        conversationId={conversation.conversationId}
                        conversationName={conversationName}
                        conversationCategory={
                          conversation.viewerContext.category
                        }
                        conversationIsTokenGated={
                          conversation.isCollectionTokenGated
                        }
                        conversationParticipants={conversation.participants}
                        replyTo={replyTo}
                        replyToSenderDisplayName={replyToSenderDisplayName}
                        onDismissReplyTo={onDismissReplyTo}
                        onBeforeSend={onBeforeNewDirectCastSend}
                        onAfterSend={onAfterNewDirectCastSend}
                        intentText={intentText}
                      />
                    )
                  ) : null}
                </View>
              </View>
            </RetryableErrorBoundary>
          </View>
        </KeyboardHandlerView>
      </View>
    );
  },
);

PlaintextDirectCastsConversationScreen.displayName =
  'PlaintextDirectCastsConversationScreen';

export { PlaintextDirectCastsConversationScreen };
