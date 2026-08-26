import { ApiShareCastTarget, ApiTokenLink } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  MILLIS_PER_HOUR,
  useDebouncedValue,
  useNonSuspenseSearchUsers,
  useShareViaDc,
} from 'farcaster-client-hooks';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { hitSlop } from '../../../constants';
import { useSharedNavigationContext, useTheme } from '../../../contexts';
import { useCurrentUserFid } from '../../../hooks/useCurrentUser';
import { Avatar } from '../../Avatar';
import { AutoDisplayingBottomSheetModal } from '../../bottom-sheet';
import {
  SearchInput,
  SkeletonPlaceholder,
  Text2,
  TextPlaceholder,
} from '../../design-system';

const CELL_SIZE = 48;

function isRecent(item: ApiShareCastTarget): boolean {
  if (item.content.lastMessageFromViewer === undefined) {
    return false;
  }
  const delta = Date.now() - item.content.lastMessageFromViewer;
  return delta < MILLIS_PER_HOUR * 6;
}

export function TokenShareToDirectCastBottomSheet({
  token,
  onDismiss,
}: {
  token: ApiTokenLink;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();
  const currentUserFid = useCurrentUserFid();

  const ItemSeparator = useCallback(() => <View style={[t.h3]} />, [t.h3]);
  const bottomSheetRef = useRef(null);
  const searchInputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState<string | undefined>('');
  const [userInput, setUserInput] = useState<string | undefined>('');

  const { data: searchUsers, isFetching: isLoadingSearchUsers } =
    useNonSuspenseSearchUsers({
      q: query,
      excludeSelf: false,
      includeDirectCastAbility: true,
      limit: 25,
    });

  const { data: recommendedTargets, isLoading: isLoadingRecommendedTargets } =
    useShareViaDc({
      maxTargets: 25,
    });

  const { data, isLoading } = useMemo<{
    data: ApiShareCastTarget[] | undefined;
    isLoading: boolean;
  }>(() => {
    if (query) {
      const targets = searchUsers?.pages.flatMap((page) =>
        page.result.users.map((user) => ({
          type: 'user' as const,
          content: { user },
        })),
      );
      return { data: targets, isLoading: isLoadingSearchUsers };
    }
    return {
      data: recommendedTargets?.result.targets,
      isLoading: isLoadingRecommendedTargets,
    };
  }, [
    query,
    searchUsers,
    recommendedTargets,
    isLoadingSearchUsers,
    isLoadingRecommendedTargets,
  ]);

  const debouncedQuery = useDebouncedValue({
    value: userInput,
    debounceDuration: 300,
  });

  useEffect(() => {
    setQuery(debouncedQuery);
  }, [debouncedQuery, setQuery]);

  const screenHeight = useRef(Dimensions.get('window').height);
  const height = useRef(Math.floor(screenHeight.current * 0.6));

  const handleSearchTextChange = useCallback(
    (text: string) => {
      setUserInput(text);
    },
    [setUserInput],
  );

  const handleSingleUserPress = useCallback(
    (item: ApiShareCastTarget) => {
      if (item.type === 'group-conversation') {
        const intentText = `$${token.ticker}`;
        push({
          path: 'PlaintextDirectCastsConversation',
          params: {
            conversationId: item.content.conversation.conversationId,
            create: false,
            intentText,
            tokenMentions: [token],
          },
        });
        onDismiss();
        return;
      }

      if (item.type !== 'user' || !item.content.user || !currentUserFid) {
        return;
      }
      const intentText = `$${token.ticker}`;
      const conversationId = buildNonGroupConversationId({
        participantFids: [item.content.user.fid, currentUserFid],
      });
      push({
        path: 'PlaintextDirectCastsConversation',
        params: {
          counterParty: item.content.user,
          conversationId,
          create: true,
          intentText,
          tokenMentions: [token],
        },
      });
      onDismiss();
    },
    [onDismiss, push, token, currentUserFid],
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiShareCastTarget }) => {
      return (
        <TouchableOpacity
          hitSlop={hitSlop}
          style={[t.flexRow, { gap: 10, height: CELL_SIZE }, t.itemsCenter]}
          onPress={() => handleSingleUserPress(item)}
        >
          {item.type === 'user' ? (
            <Avatar
              border={true}
              pfpUrl={item.content.user?.pfp?.url}
              diameter={CELL_SIZE}
            />
          ) : (
            <View
              style={[
                { width: CELL_SIZE, height: CELL_SIZE },
                t.roundedFull,
                t.itemsCenter,
                t.justifyCenter,
                t.bgActionPrimary,
                t.borderDefault,
                t.borderHairline,
                t.border2,
                t.borderActionSecondary,
              ]}
            >
              <Svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill={t.colors.white}
              >
                <Path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
              </Svg>
            </View>
          )}
          <View style={[t.flex1]}>
            <Text2>
              {item.type === 'user'
                ? item.content.user?.username
                : item.content.conversation.name}
            </Text2>
          </View>
          {isRecent(item) && (
            <Text2 size="xs" color="tertiary" weight="medium">
              Recent
            </Text2>
          )}
        </TouchableOpacity>
      );
    },
    [t, handleSingleUserPress],
  );

  const extractKey = useCallback((item: ApiShareCastTarget) => {
    if (item.type === 'user') {
      return `user-${item.content.user?.fid}`;
    }
    return `group-${item.content.conversation.conversationId}`;
  }, []);

  const skeletonRows = Array.from({ length: 10 }, (_, index) => (
    <View
      key={index}
      style={[t.flexRow, { gap: 10, height: CELL_SIZE }, t.itemsCenter]}
    >
      {/* Rounded avatar */}
      <SkeletonPlaceholder
        style={[{ width: CELL_SIZE, height: CELL_SIZE }, t.roundedFull]}
      />
      <TextPlaceholder width={80} size="base" />
    </View>
  ));

  const ListEmptyComponent = useMemo(() => {
    if (!isLoading) {
      return (
        <View style={[t.flex1, t.justifyCenter, t.itemsCenter]}>
          <Text2>No results found</Text2>
        </View>
      );
    }
    return <View style={[t.flexCol, { gap: 12 }]}>{skeletonRows}</View>;
  }, [
    isLoading,
    skeletonRows,
    t.flex1,
    t.justifyCenter,
    t.itemsCenter,
    t.flexCol,
  ]);

  return (
    <AutoDisplayingBottomSheetModal
      name="token-share-to-direct-cast"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <View style={[t.flexCol, { gap: 12 }]}>
        <Text2 weight="medium" size="base" color="secondary">
          Share ${token.ticker} in a chat
        </Text2>

        {/* Search text field here: */}
        <SearchInput
          align="left"
          ref={searchInputRef}
          onChangeText={handleSearchTextChange}
          placeholder="Search users"
          autoCorrect={false}
          width="100%"
          autoCapitalize="none"
          value={userInput}
        />
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={extractKey}
          style={[t.flex1, { height: height.current }]}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={ListEmptyComponent}
        />
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}
