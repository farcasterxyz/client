import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { ApiChannelUser } from 'farcaster-client-data';
import {
  channelUsersKeyExtractor,
  useChannelBannedUsers,
} from 'farcaster-client-hooks';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Empty } from '~/components/Empty';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { ChannelUserListItem } from '~/components/users/ChannelUserListItem';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ChannelManageBannedUsersScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageBannedUsers'
>;

const ChannelManageBannedUsersScreen =
  buildScreen<ChannelManageBannedUsersScreenProps>(
    { name: 'ChannelManageBannedUsers' },
    ({
      route: {
        params: { channelKey },
      },
    }) => {
      const t = useTheme();

      const [query, setQuery] = useState('');
      const { flatData, onEndReached, isLoading, refetch } =
        useChannelBannedUsers({
          channelKey,
          query,
        });

      useRefreshOnFocus(refetch);

      const extraData = useMemo(
        () => ({
          channelKey,
        }),
        [channelKey],
      );

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

            {isLoading ? (
              <FullScreenLoadingIndicator
                debugName="ChannelManageBannedUsers"
                style={[t.mT6]}
                justify="start"
              />
            ) : !flatData || flatData.length === 0 ? (
              <Empty message="No banned users" justify="center" />
            ) : (
              <FlashList
                data={flatData ?? []}
                extraData={extraData}
                keyExtractor={channelUsersKeyExtractor}
                onEndReached={onEndReached}
                onEndReachedThreshold={onEndReachedThreshold}
                contentContainerStyle={{ ...t.pX3, ...t.pB3 }}
                keyboardShouldPersistTaps="handled"
                {...STANDARD_FLASHLIST_PERF_PROPS}
                renderItem={renderItem}
              />
            )}
          </View>
        </>
      );
    },
  );

const renderItem: ListRenderItem<ApiChannelUser> = ({ item, extraData }) => {
  return (
    <ChannelUserListItem
      channelUser={item}
      channelKey={extraData.channelKey}
      skipSeperator={false}
    />
  );
};

ChannelManageBannedUsersScreen.displayName = 'ChannelManageMembersScreen';

export { ChannelManageBannedUsersScreen };
