import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  buildNonGroupConversationId,
  useDebouncedValue,
  useDirectCastUsers,
  userKeyExtractor,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React, { FC, memo } from 'react';
import { Platform, Pressable, TouchableOpacity, View } from 'react-native';

import {
  DirectCastsSlimUser,
  DirectCastsSlimUserProps,
} from '~/components/DirectCasts/DirectCastsSlimUser';
import { ScreenPanel } from '~/components/DirectCasts/ScreenPanel';
import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePush } from '~/hooks/navigation/usePush';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useDisplayLimit } from '~/hooks/useDisplayLimit';
import { useHaptics } from '~/hooks/useHaptics';
import { PlaintextDirectCastsStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const LIST_BATCH_SIZE = 15;

type PlaintextDirectCastsCreateConversationScreenProps = NativeStackScreenProps<
  PlaintextDirectCastsStackParamList,
  'PlaintextDirectCastsCreateConversation'
>;

const PlaintextDirectCastsCreateConversationScreen =
  buildScreen<PlaintextDirectCastsCreateConversationScreenProps>(
    {
      name: 'PlaintextDirectCastsCreateConversation',
      keyboardVerticalOffset: Platform.select({ default: 0, android: 125 }),
      avoidKeyboard: true,
    },
    ({ route: { params } }) => {
      return (
        <PlaintextDirectCastsCreateConversationScreenContent {...params} />
      );
    },
  );

PlaintextDirectCastsCreateConversationScreen.displayName =
  'PlaintextDirectCastsCreateConversationScreen';

const PlaintextDirectCastsCreateConversationScreenContent: React.FC<
  PlaintextDirectCastsStackParamList['PlaintextDirectCastsCreateConversation']
> = () => {
  const t = useTheme();

  const [q, setQ] = React.useState<string>('');

  const debouncedQ = useDebouncedValue({ value: q });

  return (
    <View style={[t.hFull, t.p2, t.pT1]}>
      <View style={[t.flex, t.flexRow, t.pX1]}>
        <SearchInput
          align="left"
          onChangeText={(text) => setQ(text)}
          value={q}
          placeholder="Search"
          autoCorrect={false}
          width="100%"
          autoCapitalize="none"
          autoFocus={true}
        />
      </View>
      <PlaintextDirectCastUsers q={debouncedQ} />
    </View>
  );
};

const PlaintextDirectCastUsers: React.FC<{ q: string }> = ({ q }) => {
  const navigate = useNavigate();
  const t = useTheme();
  const { trackEvent } = useAnalytics();
  const { fid } = useCurrentUser_UNSAFE();
  const push = usePush();
  const { triggerImpactAsync } = useHaptics();

  const { data, fetchNextPage, isFetching, hasNextPage } = useDirectCastUsers({
    q,
  });

  const flatListRef = React.useRef<FlashListRef<ApiUser>>(null);

  const extraData = useCommonFlatListExtraData();

  const users = React.useMemo(
    () =>
      uniqBy(
        data?.pages.flatMap((page) => page.result.users) || [],
        userKeyExtractor,
      ),
    [data],
  );

  const { displayedItems: displayedUsers, handleEndReached } = useDisplayLimit({
    data: users,
    batchSize: LIST_BATCH_SIZE,
    hasNextPage,
    isFetching,
    fetchNextPage,
  });

  const onNewGroupPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressNewGroupConversation, {});

    push('PlaintextDirectCastsCreateConversationAddMembers', {
      conversationId: undefined,
    });
  }, [push, trackEvent]);

  const renderUser = React.useCallback(
    ({ item: user }: { item: ApiUser }) => {
      const viewerCanSendDirectCasts = !!user.viewerContext?.canSendDirectCasts;
      const onPressNavigate = () => {
        if (!viewerCanSendDirectCasts) {
          return;
        }

        triggerImpactAsync();

        trackEvent(AnalyticsEvent.ClickSearchDirectCastUser, {});

        const conversationId = buildNonGroupConversationId({
          participantFids: [user.fid, fid],
        });

        navigate('PlaintextDirectCastsConversation', {
          conversationId: conversationId,
          counterParty: user,
          create: true,
          intentText: undefined,
        });
      };
      return (
        <Pressable
          style={[!viewerCanSendDirectCasts && t.opacity75]}
          onPress={onPressNavigate}
        >
          <MaybeDisabledUser
            disabled={!viewerCanSendDirectCasts}
            user={user}
            onUserPressCallback={onPressNavigate}
            lastInList={false}
          />
        </Pressable>
      );
    },
    [fid, navigate, t.opacity75, trackEvent, triggerImpactAsync],
  );

  let mainContent;
  if (users.length === 0 && !isFetching && !!q) {
    mainContent = (
      <View style={[t.hFull]}>
        <Empty
          justify="start"
          message={'No users found to start a conversation.'}
        />
      </View>
    );
  } else {
    mainContent = (
      <ScreenPanel dangerouslyApplyExtraStyles={[t.hFull]} animated={false}>
        <View style={[t.hFull, t.flex1]}>
          {isFetching ? (
            <FullScreenLoadingIndicator
              debugName="DirectCastUsers"
              style={[t.mT5]}
              justify="start"
            />
          ) : (
            <View style={t.flex1}>
              <FlashList
                data={displayedUsers}
                extraData={extraData}
                keyExtractor={userKeyExtractor}
                onEndReached={handleEndReached}
                onEndReachedThreshold={onEndReachedThreshold}
                ref={flatListRef}
                keyboardShouldPersistTaps="handled"
                {...STANDARD_FLASHLIST_PERF_PROPS}
                renderItem={renderUser}
              />
            </View>
          )}
        </View>
      </ScreenPanel>
    );
  }

  return (
    <View style={[t.hFull]}>
      <View style={[t.flexRow, t.selfStart, t.mT1]}>
        <TouchableOpacity
          style={[
            t.flex1,
            t.pX2,
            t.bgDefault,
            t.flex,
            t.flexRow,
            t.itemsCenter,
            { height: 56 },
          ]}
          activeOpacity={0.75}
          onPress={onNewGroupPress}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <View
              style={[
                t.borderHairline,
                t.borderDefault,
                t.roundedFull,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                t.flexRow,
                { width: 36, height: 36 },
                t.bgPillHighlight,
              ]}
            >
              <Octicons
                name={'people'}
                size={16}
                style={[t.dark ? { color: '#ffffff' } : t.texts.brand]}
              />
            </View>
            <Text
              style={[
                t.mL2,
                t.texts.primary,
                t.textBase,
                t.fontMedium,
                t.texts.brand,
              ]}
            >
              Create a group
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {mainContent}
    </View>
  );
};

PlaintextDirectCastsCreateConversationScreenContent.displayName =
  'PlaintextDirectCastsCreateConversationScreenContent';

const MaybeDisabledUser: FC<DirectCastsSlimUserProps & { disabled: boolean }> =
  memo(({ disabled, ...props }) => {
    const t = useTheme();

    return (
      <View style={[disabled && t.opacity75]}>
        <DirectCastsSlimUser {...props} />
      </View>
    );
  });

MaybeDisabledUser.displayName = 'MaybeDisabledUser';

export { PlaintextDirectCastsCreateConversationScreen };
