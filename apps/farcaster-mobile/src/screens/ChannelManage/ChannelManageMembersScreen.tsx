import { Octicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiChannelUser } from 'farcaster-client-data';
import { useChannelUsersForManagement } from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { Text2 } from '~/components/Text';
import { ChannelUserListItem } from '~/components/users/ChannelUserListItem';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ChannelManageMembersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageMembers'
>;

type ListHeader = {
  title: string;
  description: string;
};

const ChannelManageMembersScreen = buildScreen<ChannelManageMembersScreenProps>(
  { name: 'ChannelManageMembers' },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const t = useTheme();
    const push = usePush();

    const [query, setQuery] = useState('');
    const { flatData, onEndReached, isPending, refetch } =
      useChannelUsersForManagement({
        channelKey,
        query,
      });

    useRefreshOnFocus(refetch);

    const [mods, members] = useMemo(
      () =>
        (flatData ?? []).reduce(
          (acc, channelUser) => {
            acc[
              ['owner', 'moderator', 'pending-moderator'].includes(
                channelUser.relation,
              )
                ? 0
                : 1
            ].push(channelUser);

            return acc;
          },
          [[], []] as [ApiChannelUser[], ApiChannelUser[]],
        ),
      [flatData],
    );

    const firstNonModIndex = mods ? mods.length : undefined;
    const includeHeaders = !query;
    const dataWithHeaders = useMemo<Array<ApiChannelUser | ListHeader>>(() => {
      if (!flatData) {
        return [];
      }

      if (!includeHeaders) {
        return flatData;
      }

      return [
        {
          type: 'header',
          title: 'Moderators',
          description: 'Add up to 10 mods to help manage your channel.',
        },
        ...mods,
        ...(members.length > 0
          ? [
              {
                type: 'header',
                title: 'Members',
                description: 'These users can cast & reply in the channel.',
              },
              ...members,
            ]
          : []),
      ];
    }, [flatData, mods, members, includeHeaders]);

    const skipSeperatorIndices = useMemo(() => {
      if (!includeHeaders) {
        return [];
      }

      if (firstNonModIndex === undefined) {
        return [1];
      }

      // add 2 since we've inserted two headers
      return [1, firstNonModIndex + 2];
    }, [includeHeaders, firstNonModIndex]);

    const extraData = useMemo(
      () => ({
        skipSeperatorIndices,
        channelKey,
      }),
      [skipSeperatorIndices, channelKey],
    );

    const { setOptions } = useNavigation();

    useEffect(() => {
      setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() => push('ChannelManageInvites', { channelKey })}
            hitSlop={hitSlop}
            style={[t.p1]}
          >
            <Octicons
              name="person-add"
              size={24}
              color={t.colors.text.primary}
            />
          </TouchableOpacity>
        ),
      });
    }, [setOptions, push, channelKey, t.colors.text.primary, t.p1]);

    return (
      <>
        <View style={[t.hFull]}>
          <View style={[t.p3, t.borderDefault, t.borderBHairline]}>
            <SearchInput
              align="left"
              onChangeText={(text) => setQuery(text)}
              value={query}
              placeholder="Search"
              autoCorrect={false}
              width="100%"
              autoCapitalize="none"
            />
          </View>

          {isPending ? (
            <FullScreenLoadingIndicator
              debugName="ChannelManageMembers"
              style={[t.mT6]}
              justify="start"
            />
          ) : (
            <FlashList
              data={dataWithHeaders ?? []}
              renderItem={renderItem}
              getItemType={getItemType}
              extraData={extraData}
              keyExtractor={keyExtractor}
              onEndReached={onEndReached}
              onEndReachedThreshold={onEndReachedThreshold}
              contentContainerStyle={{ ...t.pX3, ...t.pB3 }}
              keyboardShouldPersistTaps="handled"
              {...STANDARD_FLASHLIST_PERF_PROPS}
            />
          )}
        </View>
      </>
    );
  },
);

function ListHeader({ header }: { header: ListHeader }) {
  const t = useTheme();

  return (
    <View style={[t.pY3]}>
      <Text2 weight="semibold">{header.title}</Text2>
      <Text2 color="secondary" size="sm" style={[t.mT1]}>
        {header.description}
      </Text2>
    </View>
  );
}

const renderItem: ListRenderItem<ApiChannelUser | ListHeader> = ({
  item,
  index,
  extraData,
}) => {
  if ('title' in item) {
    return <ListHeader header={item} />;
  } else {
    return (
      <ChannelUserListItem
        channelUser={item}
        channelKey={extraData.channelKey}
        skipSeperator={extraData.skipSeperatorIndices.includes(index)}
      />
    );
  }
};

const getItemType = (item: ApiChannelUser | ListHeader) => {
  if ('title' in item) {
    return 'header';
  } else {
    return 'channelUser';
  }
};

const keyExtractor = (item: ApiChannelUser | ListHeader) => {
  if ('title' in item) {
    return item.title;
  } else {
    return item.user.fid.toString();
  }
};

ChannelManageMembersScreen.displayName = 'ChannelManageMembersScreen';

export { ChannelManageMembersScreen };
