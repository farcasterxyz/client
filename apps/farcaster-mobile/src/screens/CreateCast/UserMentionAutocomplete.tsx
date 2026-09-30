import { ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useFlatSearchUsersData,
  useSearchUsers,
} from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { FlatList as GestureFlatList } from 'react-native-gesture-handler';

import { Avatar } from '~/components/Avatar';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Text } from '~/components/Text';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useHaptics } from '~/hooks/useHaptics';
import { useReportErrorOnDuplicateKeys } from '~/hooks/useReportErrorOnDuplicateKeys';

type UserMentionAutocompleteProps = {
  mentionText: string | undefined;
  onAutocompleteMention: (user: ApiUser) => void;
  prioritizeFids?: number[];
  prefillUsers?: ApiUser[];
  style?: StyleProp<ViewStyle>;
  inBottomSheet?: boolean;
  onVisibleChange?: (isVisible: boolean) => void;
};

const avatarDiameter = 36;
const rowHeight = avatarDiameter + sizes.s2 * 4;
const numVisibleRows = 4;
const height = rowHeight * numVisibleRows;
const animationDuration = 100;

const UserMentionAutocomplete: FC<UserMentionAutocompleteProps> = memo(
  ({
    mentionText,
    onAutocompleteMention,
    prioritizeFids,
    prefillUsers,
    style,
    inBottomSheet,
    onVisibleChange,
  }) => {
    const t = useTheme();

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(height)).current;

    const prevIsVisibleRef = useRef(false);

    const isVisible =
      (mentionText === '' && !!prefillUsers?.length) || !!mentionText;

    useEffect(() => {
      if (isVisible !== prevIsVisibleRef.current) {
        const [translateYToValue, opacityToValue] = isVisible
          ? [0, 1]
          : [height, 0];

        Animated.timing(translateY, {
          toValue: translateYToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        Animated.timing(opacity, {
          toValue: opacityToValue,
          duration: animationDuration,
          useNativeDriver: true,
        }).start();

        prevIsVisibleRef.current = isVisible;
        onVisibleChange?.(isVisible);
      }
    }, [isVisible, opacity, translateY, onVisibleChange]);

    return (
      <Animated.View
        pointerEvents={isVisible ? 'auto' : 'none'}
        style={[
          t.roundedTLg,
          isVisible ? { maxHeight: height } : { height: 0 },
          { opacity, transform: [{ translateY }] },
          style,
        ]}
      >
        <Suspense
          fallback={
            <FullScreenLoadingIndicator
              debugName="UserMentionAutocomplete"
              style={[t.bgDefault]}
            />
          }
        >
          <UserMentionAutocompleteContent
            mentionText={mentionText}
            prioritizeFids={prioritizeFids}
            prefillUsers={prefillUsers}
            onAutocompleteMention={onAutocompleteMention}
            inBottomSheet={inBottomSheet}
          />
        </Suspense>
      </Animated.View>
    );
  },
);

const keyExtractor = (result: ApiUser) => String(result.fid);

UserMentionAutocomplete.displayName = 'CreateCastUserMentionAutocomplete';

const UserMentionAutocompleteContent: FC<UserMentionAutocompleteProps> = ({
  mentionText,
  onAutocompleteMention,
  prioritizeFids,
  prefillUsers,
  inBottomSheet,
}) => {
  const t = useTheme();
  const { data, isPending, onEndReached } = useSearchUsers({
    q: mentionText || '',
    excludeSelf: true,
    prioritizeFids,
  });
  const allUsers = useFlatSearchUsersData({ data });

  const users = useMemo(() => {
    return allUsers?.length ? allUsers : prefillUsers?.slice(0, 10) || [];
  }, [allUsers, prefillUsers]);

  const extraData = useCommonFlatListExtraData();

  useReportErrorOnDuplicateKeys(
    'AutocompleteMentionContent',
    users,
    keyExtractor,
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiUser }) => (
      <AutocompleteUser
        user={item}
        onAutocompleteMention={onAutocompleteMention}
      />
    ),
    [onAutocompleteMention],
  );

  if (!users && isPending) {
    return (
      <View style={[t.hFull, t.justifyCenter]}>
        <LoadingIndicator />
      </View>
    );
  }

  const List = inBottomSheet ? GestureFlatList : FlatList;

  return (
    <List
      data={users}
      extraData={extraData}
      keyExtractor={keyExtractor}
      initialNumToRender={5}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
    />
  );
};

UserMentionAutocompleteContent.displayName = 'AutocompleteMentionContent';

type AutocompleteUserProps = {
  user: ApiUser;
  onAutocompleteMention: (user: ApiUser) => void;
};

const AutocompleteUser: FC<AutocompleteUserProps> = memo(
  ({ user, onAutocompleteMention }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    return (
      <TouchableOpacity
        onPress={() => {
          triggerImpactAsync();

          onAutocompleteMention(user);
        }}
        key={user.username}
        style={[t.p4, t.flex, t.flexRow, t.itemsCenter, { height: rowHeight }]}
        activeOpacity={0.75}
      >
        <Avatar pfpUrl={user.pfp?.url} diameter={avatarDiameter} />
        <View style={[t.mL4]}>
          {user.displayName && (
            <View style={[t.flexRow]}>
              <Text
                numberOfLines={1}
                style={[
                  t.texts.primary,
                  t.fontBold,
                  t.textBase,
                  t.flex,
                  t.flexWrap,
                ]}
              >
                {user.displayName}
              </Text>
            </View>
          )}
          <Text style={[t.texts.secondary, t.textBase, t.flex, t.flexWrap]}>
            {resolveUsername({
              username: user.username,
              fid: user.fid,
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
);

AutocompleteUser.displayName = 'AutocompleteUser';

const UserMentionAutoCompleteWithSuspense: FC<UserMentionAutocompleteProps> = (
  props,
) => (
  <Suspense fallback={null}>
    <UserMentionAutocomplete {...props} />
  </Suspense>
);

UserMentionAutoCompleteWithSuspense.displayName =
  'UserMentionAutoCompleteWithSuspense';

export { UserMentionAutoCompleteWithSuspense as UserMentionAutocomplete };
