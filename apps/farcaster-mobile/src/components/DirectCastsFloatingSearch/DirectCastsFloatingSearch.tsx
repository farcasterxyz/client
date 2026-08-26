import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiDirectCastInboxConversationInfoV3,
  ApiMessageSearchResult,
} from 'farcaster-client-data';
import {
  extractDirectCastConversationKey,
  extractDirectCastKey,
  useDebouncedState,
  useOptimisticallySwapDirectCastMessagesWithSearchResults,
  usePrefetchDirectCastConversationMessages,
  useSearchDirectCastInbox,
  useSearchDirectCastMessages,
} from 'farcaster-client-hooks';
import { AnimatedPressable, TypographyBody, useHaptics } from 'farcaster-expo';
import { Search, X } from 'lucide-react-native';
import React, { useRef } from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { DirectCastConversationAvatar } from '~/components/DirectCasts/DirectCastConversationAvatar';
import {
  PressableGradient,
  useFabIconColor,
} from '~/components/FloatingSearch/PressableGradient';
import {
  SEARCH_ICON_INPUT_SIZE,
  SEARCH_RESULTS_Z_INDEX,
} from '~/components/FloatingSearch/ZIndexLookup';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { ImagePile } from '~/components/ImagePile';
import { Text2 } from '~/components/Text';
import { feedOnEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { EmptyDirectCastsInbox } from '~/screens/PlaintextDirectCasts/EmptyDirectCastInbox';
import {
  CacheIgnoringPlaintextDirectCastConversationListItem,
  PlaintextDirectCastConversationListItem,
} from '~/screens/PlaintextDirectCasts/PlaintextDirectCastConversationListItem';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ConversationItem = {
  type: 'conversation';
  conversation: ApiDirectCastInboxConversationInfoV3;
  last?: boolean;
};
type MessageItem = {
  type: 'message';
  messageResult: ApiMessageSearchResult;
  last?: boolean;
};
type SearchListItem =
  | { type: 'header'; title: string }
  | {
      type: 'loadMoreConversations';
      conversations: ApiDirectCastInboxConversationInfoV3[];
    }
  | ConversationItem
  | MessageItem;

const convKeyPrefix = 'conv_';
const messKeyPrefix = 'mess_';

const FLOATING_SEARCH_BOTTOM_SPACING = 80;

const getItemType = (item: SearchListItem) => item.type;

const keyExtractor = (item: SearchListItem) => {
  if (item.type === 'header') {
    return item.title;
  }

  if (item.type === 'loadMoreConversations') {
    return 'loadMoreConversations';
  }

  if (item.type === 'conversation') {
    return `${convKeyPrefix}${extractDirectCastConversationKey(item.conversation)}`;
  }

  return `${messKeyPrefix}${extractDirectCastKey(item.messageResult.result)}`;
};

function DirectCastsSearchList({
  query,
  onClose,
}: {
  query: string;
  onClose: () => void;
}) {
  const { fid } = useCurrentUser_UNSAFE();
  const {
    flatData: conversationResults,
    onEndReached: onEndReachedConversations,
    hasNextPage: hasNextConversationPage,
    isPending: conversationsArePending,
  } = useSearchDirectCastInbox({
    q: query,
    category: 'default',
  });
  const {
    flatData: messageResults,
    onEndReached: onEndReachedMessages,
    isPending: messagesArePending,
  } = useSearchDirectCastMessages({
    query,
  });

  const prefetch = usePrefetchDirectCastConversationMessages();
  const swapWithSearchResults =
    useOptimisticallySwapDirectCastMessagesWithSearchResults();
  const push = usePush();
  const t = useTheme();
  const { keyboardHeight } = useKeyboardVisibility();

  const messages = React.useMemo<MessageItem[]>(
    () =>
      messageResults?.map(
        (messageResult): MessageItem => ({
          type: 'message',
          messageResult,
        }),
      ) ?? [],
    [messageResults],
  );

  const [
    conversationsToShowIfNonzeroMessageResults,
    setConversationsToShowIfNonzeroMessageResults,
  ] = React.useState(5);

  const listData = React.useMemo(() => {
    const conversations =
      conversationResults?.map(
        (conversation): ConversationItem => ({
          type: 'conversation',
          conversation,
        }),
      ) || [];

    const listItems: SearchListItem[] = [];
    if (conversations.length > 0) {
      listItems.push({
        type: 'header',
        title: 'Conversations',
      });
      const includedConversations =
        messages.length === 0
          ? conversations
          : conversations.slice(0, conversationsToShowIfNonzeroMessageResults);
      const lastItem = includedConversations.pop();
      if (lastItem) {
        listItems.push(...includedConversations);
        if (
          messages.length === 0 ||
          (conversations.length <= conversationsToShowIfNonzeroMessageResults &&
            !hasNextConversationPage)
        ) {
          listItems.push({ ...lastItem, last: true });
        } else {
          listItems.push(lastItem);
          listItems.push({
            type: 'loadMoreConversations',
            conversations: conversations
              .slice(conversationsToShowIfNonzeroMessageResults)
              .map(({ conversation }) => conversation),
          });
        }
      }
    }

    if (messages.length > 0) {
      listItems.push({
        type: 'header',
        title: 'Messages',
      });
      const lastItem = messages[messages.length - 1];
      listItems.push(...messages.slice(0, -1));
      listItems.push({ ...lastItem, last: true });
    }

    return listItems;
  }, [
    conversationResults,
    messages,
    conversationsToShowIfNonzeroMessageResults,
    hasNextConversationPage,
  ]);

  const extraData = useCommonFlatListExtraData();
  const numConversationResults = conversationResults?.length ?? 0;

  const renderItem = React.useCallback(
    ({ item }: { item: SearchListItem }) => {
      if (item.type === 'header') {
        return (
          <TypographyBody
            label="Large/Strong"
            color={'tertiary'}
            style={[t.pX3, t.pB1]}
          >
            {item.title}
          </TypographyBody>
        );
      }

      if (item.type === 'loadMoreConversations') {
        const images = item.conversations.map((conversation) => ({
          node: (
            <DirectCastConversationAvatar
              conversation={conversation}
              diameter={31}
            />
          ),
          key: conversation.conversationId,
        }));

        const onPress = () => {
          if (
            conversationsToShowIfNonzeroMessageResults < numConversationResults
          ) {
            setConversationsToShowIfNonzeroMessageResults((prev) => prev + 10);
          } else {
            onEndReachedConversations();
          }
        };
        return (
          <TouchableOpacity
            style={[t.pX4, t.pY2, t.flexRow, t.itemsCenter]}
            onPress={onPress}
          >
            <ImagePile images={images} />
            <Text2 size="sm" weight="medium" color="tertiary">
              Show more conversations
            </Text2>
          </TouchableOpacity>
        );
      }

      if (item.type === 'conversation') {
        return (
          <PlaintextDirectCastConversationListItem
            currentUserFid={fid}
            conversation={item.conversation}
            borderStyle={item.last ? 'none' : 'bottom'}
            shouldShowConversationTag={false}
            onPress={() => {
              onClose();
              push('PlaintextDirectCastsConversation', {
                conversationId: item.conversation.conversationId,
                counterParty: item.conversation.viewerContext.counterParty,
                create: false,
                intentText: undefined,
                focusOnMessageId: undefined,
              });
            }}
          />
        );
      }

      const {
        result,
        conversation,
        messagesBefore,
        messagesAfter,
        surroundingMessagesCursor,
        highlights,
      } = item.messageResult;
      const messagesAround = [...messagesAfter, result, ...messagesBefore];
      const onPress = () => {
        swapWithSearchResults({
          conversationId: conversation.conversationId,
          searchResults: messagesAround,
          cursor: surroundingMessagesCursor,
        });
        onClose();
        push('PlaintextDirectCastsConversation', {
          conversationId: conversation.conversationId,
          counterParty: conversation.viewerContext.counterParty,
          create: false,
          intentText: undefined,
          focusOnMessageId: result.messageId,
        });
      };
      const hackedConversation = {
        ...conversation,
        lastMessage: {
          ...result,
          message: highlights[0],
        },
      };
      return (
        <CacheIgnoringPlaintextDirectCastConversationListItem
          currentUserFid={fid}
          conversation={hackedConversation}
          borderStyle="bottom"
          shouldShowConversationTag={false}
          onPress={onPress}
          parseMatchedSearchTermsFromLastMessage={true}
        />
      );
    },
    [
      conversationsToShowIfNonzeroMessageResults,
      fid,
      numConversationResults,
      onClose,
      onEndReachedConversations,
      push,
      swapWithSearchResults,
      t.flexRow,
      t.itemsCenter,
      t.pB1,
      t.pX3,
      t.pX4,
      t.pY2,
    ],
  );

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      for (const { key } of viewableItems) {
        if (!key.startsWith(convKeyPrefix)) {
          continue;
        }
        const conversationId = key.slice(convKeyPrefix.length);
        prefetch({ conversationId, messageId: undefined });
      }
    },
    [prefetch],
  );

  const contentContainerStyle = React.useMemo(
    () => ({
      paddingBottom: FLOATING_SEARCH_BOTTOM_SPACING + keyboardHeight,
    }),
    [keyboardHeight],
  );

  const viewabilityConfig = React.useMemo(
    () => ({
      itemVisiblePercentThreshold: 15,
    }),
    [],
  );

  const listEmptyComponent = React.useMemo(
    () =>
      messagesArePending || conversationsArePending ? (
        <FullScreenLoadingIndicator debugName="DirectCastsFloatingSearch" />
      ) : (
        <EmptyDirectCastsInbox text={`No results for "${query}"`} />
      ),
    [messagesArePending, conversationsArePending, query],
  );

  const onEndReached = React.useCallback(() => {
    if (messages.length === 0) {
      onEndReachedConversations();
    } else {
      onEndReachedMessages();
    }
  }, [messages.length, onEndReachedMessages, onEndReachedConversations]);

  return (
    <FlashList
      data={listData}
      extraData={extraData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      onEndReached={onEndReached}
      onEndReachedThreshold={feedOnEndReachedThreshold}
      contentContainerStyle={contentContainerStyle}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      ListEmptyComponent={listEmptyComponent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="always"
      {...STANDARD_FLASHLIST_PERF_PROPS}
    />
  );
}

const DirectCastsFloatingSearchResults = ({
  searchQuery,
  rawQuery,
  debouncedQuery,
  onClose,
  onChangeText,
}: {
  searchQuery: string | null;
  rawQuery: string;
  debouncedQuery: string;
  onClose: () => void;
  onChangeText: (text: string) => void;
}) => {
  const t = useTheme();
  const inputRef = useRef<TextInput>(null);
  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value === 1 ? 'auto' : 'none',
  }));

  React.useEffect(() => {
    if (searchQuery === null) {
      opacity.set(withTiming(0, { duration: 150 }));
      return;
    }

    opacity.set(withTiming(1, { duration: 150 }));
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [opacity, searchQuery]);

  const normalizedQuery = debouncedQuery.trim();

  const insets = useSafeAreaInsets();

  const handleXPress = React.useCallback(() => {
    if (rawQuery.length > 0) {
      onChangeText('');
    } else {
      onClose();
    }
  }, [rawQuery, onChangeText, onClose]);

  return (
    <Animated.View
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.right0,
        t.bottom0,
        t.flex1,
        t.bgDefault,
        {
          zIndex: SEARCH_RESULTS_Z_INDEX,
          paddingTop: insets.top,
        },
        opacityStyle,
      ]}
    >
      {searchQuery !== null && (
        <View
          style={{
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.border,
              t.borders.secondary,
              {
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 8,
              },
            ]}
          >
            <Search
              size={SEARCH_ICON_INPUT_SIZE}
              color={t.colors.text.secondary}
            />
            <TextInput
              ref={inputRef}
              value={rawQuery}
              onChangeText={onChangeText}
              placeholder="Search conversations..."
              placeholderTextColor={t.colors.text.tertiary}
              style={[
                {
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text.primary,
                  outlineWidth: 0,
                },
              ]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedPressable onPress={handleXPress}>
              <X size={18} color={t.colors.text.secondary} />
            </AnimatedPressable>
          </View>
        </View>
      )}
      <DirectCastsSearchList query={normalizedQuery} onClose={onClose} />
    </Animated.View>
  );
};

const DirectCastsFloatingSearch: React.FC<{
  openRef?: React.MutableRefObject<(() => void) | null>;
}> = React.memo(({ openRef }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = React.useState<string | null>(null);
  const [debouncedQuery, setQuery, forceSetQuery, rawQuery] =
    useDebouncedState('');

  const handleOpen = React.useCallback(() => {
    forceSetQuery('');
    setSearchQuery('');
  }, [forceSetQuery]);

  React.useEffect(() => {
    if (openRef) {
      openRef.current = handleOpen;
    }
  }, [openRef, handleOpen]);

  const handleClose = React.useCallback(() => {
    Keyboard.dismiss();
    forceSetQuery('');
    setSearchQuery(null);
  }, [forceSetQuery]);

  const handleChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchQuery('');
        forceSetQuery('');
        return;
      }

      setSearchQuery(text);
      setQuery(text);
    },
    [forceSetQuery, setQuery],
  );

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation
        .getParent()
        // @ts-ignore
        ?.addListener('tabPress', () => {
          handleClose();
        });

      return unsubscribe;
    }, [handleClose, navigation]),
  );

  return (
    <DirectCastsFloatingSearchResults
      searchQuery={searchQuery}
      rawQuery={rawQuery}
      debouncedQuery={debouncedQuery}
      onClose={handleClose}
      onChangeText={handleChangeText}
    />
  );
});

function DirectCastsFloatingCreate() {
  const t = useTheme();
  const iconColor = useFabIconColor();
  const { trackEvent } = useAnalytics();

  const { triggerImpactAsync } = useHaptics();

  const push = usePush();

  return (
    <View style={[t.absolute, t.bottom0, t.right0, t.mR4, t.mB10]}>
      <AnimatedPressable
        style={[
          t.border,
          t.borders.secondary,
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: 100, width: 56, height: 56 },
          Platform.OS === 'android'
            ? {
                backgroundColor: t.colors.background.secondary,
                overflow: 'hidden',
              }
            : undefined,
        ]}
        disableAnimation={Platform.OS === 'android'}
        onPress={() => {
          triggerImpactAsync();

          trackEvent(AnalyticsEvent.ClickCreateDirectCast, {});

          push('PlaintextDirectCastsCreateConversation', {});
        }}
      >
        <PressableGradient />
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M21.0078 16.3417C20.8608 16.7126 20.828 17.119 20.9138 17.5087L21.9788 20.7987C22.0131 20.9655 22.0043 21.1384 21.953 21.3008C21.9018 21.4633 21.81 21.61 21.6862 21.727C21.5623 21.844 21.4107 21.9274 21.2456 21.9693C21.0805 22.0113 20.9075 22.0104 20.7428 21.9667L17.3298 20.9687C16.9621 20.8958 16.5813 20.9276 16.2308 21.0607C14.0954 22.0579 11.6765 22.2689 9.40067 21.6564C7.12489 21.0439 5.13855 19.6473 3.79212 17.7131C2.44569 15.7788 1.8257 13.4311 2.04152 11.0842C2.25735 8.73738 3.29512 6.54216 4.97175 4.88589C6.64838 3.22962 8.85612 2.21873 11.2054 2.03159C13.5548 1.84445 15.8947 2.49308 17.8124 3.86303C19.7301 5.23299 21.1023 7.23624 21.6869 9.51933C22.2716 11.8024 22.0311 14.2186 21.0078 16.3417Z"
            stroke={iconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <Path
            d="M16 12H8"
            stroke={iconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <Path
            d="M12 8V16"
            stroke={iconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </Svg>
      </AnimatedPressable>
    </View>
  );
}

export { DirectCastsFloatingCreate, DirectCastsFloatingSearch };
