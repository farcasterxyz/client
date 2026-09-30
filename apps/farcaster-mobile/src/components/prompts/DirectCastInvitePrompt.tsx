import { Octicons } from '@expo/vector-icons';
import {
  BottomSheetScrollView,
  useBottomSheet,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  sleep,
  useChangeMemberInPlaintextDirectCastGroup,
  useDirectCastConversation,
  useDirectCastUsers,
  usePlaintextDirectCastGroupInvite,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import uniqBy from 'lodash/uniqBy';
import React, { memo, useCallback, useMemo } from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedPressableCircle } from '~/components/Animated/AnimatedPressable';
import { Avatar } from '~/components/Avatar';
import { Button } from '~/components/Button';
import { DirectCastsSlimUser } from '~/components/DirectCasts/DirectCastsSlimUser';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { SearchInput } from '~/components/SearchInput';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { directCastInvitePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useHaptics } from '~/hooks/useHaptics';
import { useKeyboardWillShow } from '~/hooks/useKeyboardVisibility';
import { trackError } from '~/utils/ErrorUtils';
import { shareUrl } from '~/utils/SharingUtils';

import { Prompt } from './Prompt';
import { PromptScrollView } from './PromptScrollView';

type KeyboardEventsHandle = {
  shouldHandleKeyboardEvents?: {
    value: boolean;
  };
};

const DirectCastInvitePrompt = memo(() => {
  const { activePromptKey, hideGlobalPrompt, globalData } = useGlobalPrompts();
  const shouldPresent = useCallback(
    () => activePromptKey === directCastInvitePromptKey,
    [activePromptKey],
  );

  const conversationId = useMemo(() => {
    return globalData.directCastInvite?.conversationId || '';
  }, [globalData]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={598}
      storageKey={directCastInvitePromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      withExtraShadow={false}
    >
      <React.Suspense>
        <DirectCastInvitePromptContent conversationId={conversationId} />
      </React.Suspense>
    </Prompt>
  );
});

DirectCastInvitePrompt.displayName = 'DirectCastInvitePrompt';

const DirectCastInvitePromptContent = memo(
  ({ conversationId }: { conversationId?: string }) => {
    const t = useTheme();
    const { hideGlobalPrompt } = useGlobalPrompts();
    const { forceClose } = useBottomSheet();

    const { triggerImpactAsync } = useHaptics();
    const currentUser = useCurrentUser_UNSAFE();
    const currentUserFid = currentUser.fid;

    const { data: conversation } = useDirectCastConversation({
      conversationId: conversationId || '',
    });

    const [members, setMembers] = React.useState<ApiUser[]>([]);

    React.useEffect(() => {
      if (typeof conversation === 'undefined') {
        return;
      }
      const currentUserFromParticipants = conversation.participants.find(
        ({ fid }) => fid === currentUserFid,
      );

      const adminsFromParticipants = conversation.participants.filter(
        ({ fid }) =>
          fid !== currentUserFid && conversation.adminFids.indexOf(fid) !== -1,
      );

      const rest = conversation.participants.filter(
        ({ fid }) =>
          fid !== currentUserFid &&
          conversation.removedFids.indexOf(fid) === -1 &&
          conversation.adminFids.indexOf(fid) === -1,
      );

      const memberList = [...adminsFromParticipants, ...rest];
      if (currentUserFromParticipants) {
        memberList.unshift(currentUserFromParticipants);
      }
      setMembers(memberList);
    }, [conversation, currentUserFid]);

    const [searchFilter, setSearchFilter] = React.useState<string | undefined>(
      undefined,
    );
    const searchInputRef = React.useRef<TextInput>(null);

    const { shouldHandleKeyboardEvents } =
      useBottomSheetInternal() as KeyboardEventsHandle;

    const setKeyboardHandling = React.useCallback(
      (value: boolean) => {
        try {
          if (!shouldHandleKeyboardEvents) {
            return;
          }
          shouldHandleKeyboardEvents.value = value;
        } catch (error) {
          trackError(error);
        }
      },
      [shouldHandleKeyboardEvents],
    );

    React.useEffect(() => {
      return () => {
        runOnJS(setKeyboardHandling)(false);
      };
    }, [setKeyboardHandling]);

    const handleOnFocus = React.useCallback(() => {
      if (Platform.OS !== 'android') {
        runOnJS(setKeyboardHandling)(true);
      }
    }, [setKeyboardHandling]);

    const handleOnBlur = React.useCallback(() => {
      runOnJS(setKeyboardHandling)(false);
    }, [setKeyboardHandling]);

    const memberFids = members.map((member) => member.fid);

    const {
      data: searchData,
      fetchNextPage,
      isPending: isLoadingSuggestedUsers,
    } = useDirectCastUsers({
      q: searchFilter || '',
      excludeFids: memberFids,
    });

    const { data: invite, refetch } = usePlaintextDirectCastGroupInvite({
      fid: currentUserFid,
      conversationId,
    });
    React.useEffect(() => {
      refetch();
    }, [refetch]);

    const searchResults = useMemo(
      () => searchData?.pages.flatMap((page) => page.result.users) || [],
      [searchData],
    );

    const [selectedTargets, setSelectedTargets] = React.useState<ApiUser[]>([]);

    React.useEffect(() => {
      return () => {
        setSelectedTargets([]);
      };
    }, []);

    const onTargetPress = React.useCallback(
      ({ target }: { target: ApiUser }) => {
        setSelectedTargets((prev) => {
          if (prev.findIndex((o) => o.fid === target.fid) !== -1) {
            return prev.filter((o) => o.fid !== target.fid);
          }
          return [...prev, target];
        });
      },
      [],
    );

    const refineSuggestedUsers: ApiUser[] = useMemo(() => {
      const suggested = uniqBy(
        (searchResults || [])
          .filter(
            (user: ApiUser) =>
              user.username
                ?.toLowerCase()
                .startsWith((searchFilter || '').toLowerCase()) ||
              user.displayName
                ?.toLowerCase()
                .startsWith((searchFilter || '').toLowerCase()),
          )
          .concat(searchResults || [])
          .filter((user: ApiUser) => !memberFids.includes(user.fid)),
        'fid',
      );

      return suggested;
    }, [memberFids, searchFilter, searchResults]);

    const renderSearchResultUser = React.useCallback(
      ({ item: user }: { item: ApiUser }) => {
        const interested =
          selectedTargets.findIndex((o) => o.fid === user.fid) !== -1;

        return (
          <DirectCastsSlimUser
            user={user}
            onUserPressCallback={() => {
              onTargetPress({ target: user });
            }}
            lastInList={false}
            userAction={
              <View
                style={[
                  t.roundedFull,
                  interested
                    ? [t.bgWhite, { padding: 1.5 }]
                    : [
                        t.bgTransparent,
                        t.border,
                        t.borderDefault,
                        { padding: 0.5 },
                      ],
                ]}
              >
                <Octicons
                  name={'check-circle-fill'}
                  size={18}
                  style={[
                    { color: t.colors.feed.actionPurple },
                    !interested && t.opacity0,
                  ]}
                />
              </View>
            }
          />
        );
      },
      [
        onTargetPress,
        selectedTargets,
        t.bgTransparent,
        t.bgWhite,
        t.border,
        t.borderDefault,
        t.colors.feed.actionPurple,
        t.opacity0,
        t.roundedFull,
      ],
    );

    const { bottom } = useSafeAreaInsets();
    const bottomPadding = useSharedValue(bottom);

    const keyboardWillShow = useKeyboardWillShow();
    React.useEffect(() => {
      bottomPadding.value = withTiming(keyboardWillShow ? 0 : bottom, {
        duration: 300,
      });
    }, [bottomPadding, keyboardWillShow, bottom]);

    const animatedStyle = useAnimatedStyle(() => ({
      paddingBottom: bottomPadding.value,
    }));

    const { trackEvent } = useAnalytics();

    const changeMembershipInPlaintextDirectCastGroup =
      useChangeMemberInPlaintextDirectCastGroup();

    const toast = useRootToast();

    const closePrompt = React.useCallback(async () => {
      const transitionDuration = 200;

      forceClose({ duration: transitionDuration });
      hideGlobalPrompt();

      await sleep(transitionDuration);
    }, [forceClose, hideGlobalPrompt]);

    const onAddMembersPress = React.useCallback(async () => {
      if (typeof conversationId === 'undefined') {
        return;
      }

      try {
        trackEvent(AnalyticsEvent.AddMemberDirectCastsGroup, {
          new_member_count: selectedTargets.length,
          from: 'invite_prompt',
        });

        triggerImpactAsync();

        await changeMembershipInPlaintextDirectCastGroup({
          senderContext: {
            fid: currentUserFid,
            displayName: currentUser.displayName,
            username: currentUser.username,
          },
          conversationId: conversationId,
          action: 'add',
          participants: selectedTargets,
        });

        toast.show(`Users added`, { placement: 'bottom' });

        closePrompt();
      } catch (e) {
        trackError(e);

        toast.show(`Failed to add users.`, {
          placement: 'bottom',
          type: 'danger',
        });
      }
    }, [
      changeMembershipInPlaintextDirectCastGroup,
      currentUser,
      closePrompt,
      conversationId,
      currentUserFid,
      selectedTargets,
      toast,
      trackEvent,
      triggerImpactAsync,
    ]);

    const scrollViewRef = React.useRef<ScrollView>(null);

    const [copiedGroupURL, setCopiedGroupURL] = React.useState<boolean>(false);

    const inviteCode = invite?.inviteCode;
    const groupURL = React.useMemo(
      () => (inviteCode ? `https://farcaster.xyz/~/group/${inviteCode}` : ''),
      [inviteCode],
    );

    const bottomActionsBar = React.useMemo(() => {
      return selectedTargets.length !== 0 ? (
        <Animated.View
          style={[t.wFull, t.pX4, t.mY2]}
          entering={FadeIn.duration(150)}
          key="add_members"
        >
          <TouchableOpacity
            style={[
              t.bgActionFrameTx,
              t.roundedLg,
              t.flex,
              t.flexRow,
              t.justifyCenter,
              t.itemsCenter,
              t.roundedLg,
              t.borderHairline,
              t.borderDefault,
              t.fontSemibold,
              t.wFull,
              t.h12,
            ]}
            activeOpacity={0.75}
            onPress={onAddMembersPress}
          >
            <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
              Add members
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        inviteCode && (
          <Animated.View
            style={[
              t.mX6,
              t.mY2,
              t.mT4,
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.wFull,
              { gap: 48 },
            ]}
            entering={FadeIn.duration(150)}
            key="invite_link"
          >
            <View
              style={[t.itemsCenter, t.justifyCenter, t.flex, t.flexCol, t.w21]}
            >
              <AnimatedPressableCircle
                background="muted"
                onPress={() => {
                  triggerImpactAsync();

                  Clipboard.setStringAsync(groupURL);
                  setCopiedGroupURL(true);

                  setTimeout(() => {
                    setCopiedGroupURL(false);
                  }, 3000);
                }}
              >
                <Octicons
                  pointerEvents="none"
                  name={copiedGroupURL ? 'check' : 'copy'}
                  size={16}
                  style={[{ color: t.colors.text.primary }]}
                />
              </AnimatedPressableCircle>
              <Text style={[{ fontSize: 12 }, t.texts.primary, t.mT2]}>
                Copy link
              </Text>
            </View>
            <View
              style={[t.itemsCenter, t.justifyCenter, t.flex, t.flexCol, t.w21]}
            >
              <AnimatedPressableCircle
                background="muted"
                onPress={() => {
                  triggerImpactAsync();

                  shareUrl({ title: 'Invite to Group', url: groupURL }).then(
                    ({ action }) => {
                      if (action !== 'dismissedAction') {
                        hideGlobalPrompt();
                        forceClose();
                      }
                    },
                  );
                }}
              >
                <Octicons
                  pointerEvents="none"
                  name={'share'}
                  size={20}
                  style={[{ color: t.colors.text.primary }]}
                />
              </AnimatedPressableCircle>
              <Text style={[{ fontSize: 12 }, t.texts.primary, t.mT2]}>
                Share to
              </Text>
            </View>
          </Animated.View>
        )
      );
    }, [
      copiedGroupURL,
      forceClose,
      groupURL,
      hideGlobalPrompt,
      inviteCode,
      onAddMembersPress,
      selectedTargets.length,
      t.bgActionFrameTx,
      t.borderDefault,
      t.borderHairline,
      t.colors.text.primary,
      t.flex,
      t.flexCol,
      t.flexRow,
      t.fontSemibold,
      t.h12,
      t.itemsCenter,
      t.justifyCenter,
      t.mT2,
      t.mT4,
      t.mX6,
      t.mY2,
      t.pX4,
      t.roundedLg,
      t.textBase,
      t.texts.primary,
      t.texts.light,
      t.w21,
      t.wFull,
      triggerImpactAsync,
    ]);

    if (!conversationId) {
      return <ErrorFallback />;
    }

    return (
      <>
        <BottomSheetScrollView
          scrollEnabled={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={{ position: 'relative', height: '100%' }}>
            <Text
              style={[
                t.mX6,
                t.pY3,
                t.texts.primary,
                t.fontSemibold,
                { fontSize: 24, lineHeight: 32 },
              ]}
            >
              Add to group
            </Text>
            <View style={[t.mX6]}>
              <SearchInput
                ref={searchInputRef}
                onChangeText={(text) => setSearchFilter(text || undefined)}
                placeholder="Search"
                width="100%"
                autoCorrect={false}
                autoCapitalize="none"
                value={searchFilter}
                onBlur={handleOnBlur}
                onFocus={handleOnFocus}
              />
              {selectedTargets.length !== 0 && (
                <PromptScrollView
                  ref={scrollViewRef}
                  style={[
                    t.flex1,
                    t.relative,
                    t.wFull,
                    t.mT2,
                    { maxHeight: 80 },
                  ]}
                  contentContainerStyle={[
                    t.flex,
                    t.flexRow,
                    t.flexWrap,
                    t.itemsCenter,
                    t.justifyStart,
                    { gap: 4 },
                  ]}
                  onContentSizeChange={() =>
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                  }
                  keyboardShouldPersistTaps="always"
                >
                  {selectedTargets.map((st, index) => {
                    return (
                      <View
                        key={index}
                        style={[
                          t.bgDefault,
                          t.flex,
                          t.flexRow,
                          t.itemsCenter,
                          t.p2,
                          t.roundedLg,
                          { gap: 6 },
                        ]}
                      >
                        <Avatar diameter={24} pfpUrl={st.pfp?.url} />
                        <Text style={[t.texts.primary, t.textBase]}>
                          {st.displayName}
                        </Text>
                        <Octicons
                          name="x"
                          size={16}
                          style={[t.texts.primary]}
                          onPress={() => {
                            onTargetPress({ target: st });
                          }}
                        />
                      </View>
                    );
                  })}
                </PromptScrollView>
              )}
              <BottomSheetScrollView keyboardShouldPersistTaps="always">
                <View
                  style={[
                    t.mT2,
                    t.itemsCenter,
                    t.justifyCenter,
                    t.flexWrap,
                    t.flexRow,
                    { height: 574 },
                  ]}
                >
                  {isLoadingSuggestedUsers && searchFilter ? (
                    <View style={[t.justifyCenter, t.alignCenter, t.mT10]}>
                      <LoadingIndicator />
                    </View>
                  ) : (
                    <FlatList
                      data={refineSuggestedUsers}
                      renderItem={renderSearchResultUser}
                      keyExtractor={userKeyExtractor}
                      onEndReached={() => fetchNextPage}
                      onEndReachedThreshold={onEndReachedThreshold}
                      initialNumToRender={8}
                      keyboardShouldPersistTaps="always"
                    />
                  )}
                </View>
              </BottomSheetScrollView>
            </View>
          </View>
        </BottomSheetScrollView>
        <Animated.View
          style={[t.flex, t.wFull, t.bgDefault, t.itemsCenter, animatedStyle]}
        >
          {bottomActionsBar}
        </Animated.View>
      </>
    );
  },
);

const ErrorFallback = memo(() => {
  const t = useTheme();
  const { forceClose } = useBottomSheet();

  return (
    <View style={[t.hFull, t.justifyBetween, t.pL4, t.pR4, t.pT2, t.pT2]}>
      <View style={[t.hFull, t.pB10]}>
        <Text
          style={[
            t.textBase,
            t.texts.primary,
            t.textLg,
            t.fontSemibold,
            t.textCenter,
            t.mB4,
          ]}
        >
          Invite to group
        </Text>

        <Text
          style={[
            t.texts.primary,
            t.textBase,
            t.textCenter,
            t.texts.secondary,
            t.justifyCenter,
            t.selfCenter,
            t.flexGrow,
            t.pT5,
          ]}
        >
          Something went wrong. Please report this issue and try again.
        </Text>

        <Button
          title="Cancel"
          fontWeight="semibold"
          size="sm"
          style={[t.mT2, t.pY4]}
          variant="muted"
          onPress={forceClose}
        />
      </View>
    </View>
  );
});

export { DirectCastInvitePrompt };
