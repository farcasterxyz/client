import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiChannelUser, getWarpcastInviteUrl } from 'farcaster-client-data';
import {
  useChannel,
  useChannelUsersForInvite,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard, TouchableOpacity, View } from 'react-native';

import { ButtonV2 } from '~/components/ButtonV2';
import { useConfirmInviteRestrictedBottomSheetModal } from '~/components/ChannelsV3/ConfirmInviteRestrictedBottomSheet';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { Text2 } from '~/components/Text';
import { ChannelUserListItem } from '~/components/users/ChannelUserListItem';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ChannelManageInvitesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManageInvites'
>;

const ChannelManageInvitesScreen = buildScreen<ChannelManageInvitesScreenProps>(
  { name: 'ChannelManageInvites' },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const t = useTheme();
    const toast = useRootToast();
    const { trackEvent } = useTrackEvent();

    const [query, setQuery] = useState('');
    const { data: channel } = useChannel({ key: channelKey });
    const { flatData, onEndReached, isPending } = useChannelUsersForInvite({
      channelKey,
      query,
    });

    const inviteUrl = useMemo(() => {
      if (!channel?.inviteCode) {
        return null;
      }

      return getWarpcastInviteUrl({
        channelKey: channel.key,
        inviteCode: channel.inviteCode ?? '',
      });
    }, [channel?.key, channel?.inviteCode]);

    const extraData = useMemo(
      () => ({
        channelKey,
      }),
      [channelKey],
    );

    const copy = async () => {
      if (!inviteUrl) {
        toast.show('Invite link unavailable');
        return;
      }

      trackEvent(AnalyticsEvent.CopyChannelInviteLink, { channelKey });
      await Clipboard.setStringAsync(inviteUrl);
      toast.show('Link copied to clipboard');
    };

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
            {inviteUrl && query.length === 0 && (
              <View
                style={[
                  t.mT3,
                  t.border,
                  t.borderDesignSystemDefault,
                  t.roundedLg,
                ]}
              >
                <TouchableOpacity
                  style={[
                    t.flexRow,
                    t.itemsCenter,
                    t.justifyBetween,
                    t.pY2,
                    t.pX3,
                    { gap: 8 },
                  ]}
                  activeOpacity={0.5}
                  onPress={copy}
                >
                  <View style={[t.flexShrink]}>
                    <Text2 weight="medium" size="sm">
                      Share invite link
                    </Text2>
                    <Text2 color="secondary" size="xs" style={{ marginTop: 2 }}>
                      Share with people you trust. Avoid posting publicly.
                    </Text2>
                  </View>
                  <View>
                    <Octicons
                      name="copy"
                      size={17}
                      color={t.colors.text.primary}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isPending ? (
            <FullScreenLoadingIndicator
              debugName="ChannelManageMembers"
              style={[t.mT6]}
              justify="start"
            />
          ) : (
            <FlashList
              data={flatData ?? []}
              extraData={extraData}
              keyExtractor={keyExtractor}
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

function ListItem({
  channelKey,
  channelUser,
  skipSeperator,
}: {
  channelKey: string;
  channelUser: ApiChannelUser;
  skipSeperator: boolean;
}) {
  const { inviteOrOpen, Component: ConfirmInviteRestrictedBottomSheetModal } =
    useConfirmInviteRestrictedBottomSheetModal({
      channelKey,
      user: channelUser.user,
      restricted: channelUser.channelContext.restricted,
    });

  // Consider moving this to backend as criteria may change
  const canInvite = channelUser.relation !== 'none';

  const invite = useCallback(async () => {
    Keyboard.dismiss();
    return await inviteOrOpen();
  }, [inviteOrOpen]);

  const button = useMemo(() => {
    if (channelUser.relation === 'pending-member') {
      return (
        <ButtonV2
          onPress={() => {}}
          title="Invited"
          Icon={({ color }) => <Octicons name="check" color={color} />}
          variant="secondary"
          disabled
          height="xs"
        />
      );
    } else if (
      ['owner', 'member', 'moderator', 'pending-moderator'].includes(
        channelUser.relation,
      )
    ) {
      return (
        <ButtonV2
          onPress={() => {}}
          title="Member"
          variant="secondary"
          disabled
          height="xs"
        />
      );
    } else if (
      channelUser.relation === 'user-follower' ||
      channelUser.relation === 'channel-follower'
    ) {
      return <ButtonV2 onPress={invite} title="Invite" height="xs" />;
    } else {
      return null;
    }
  }, [invite, channelUser.relation]);

  return (
    <>
      <View style={{ opacity: canInvite ? 1 : 0.5 }}>
        <ChannelUserListItem
          channelUser={channelUser}
          channelKey={channelKey}
          skipSeperator={skipSeperator}
          Action={button}
        />
      </View>
      {ConfirmInviteRestrictedBottomSheetModal}
    </>
  );
}

const renderItem: ListRenderItem<ApiChannelUser> = ({
  item,
  index,
  extraData,
}) => {
  return (
    <ListItem
      channelUser={item}
      channelKey={extraData.channelKey}
      skipSeperator={index === 0}
    />
  );
};

const keyExtractor = (item: ApiChannelUser) => {
  return item.user.fid.toString();
};

ChannelManageInvitesScreen.displayName = 'ChannelManageInvitesScreen';

export { ChannelManageInvitesScreen };
