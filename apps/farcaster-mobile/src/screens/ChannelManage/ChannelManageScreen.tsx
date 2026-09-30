import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { ButtonGroup, ButtonGroupOption } from '~/components/ButtonGroup';
import { PersonXIcon } from '~/components/icons/PersonXIcon';
import { CircleArrowIcon } from '~/components/images/CircleArrowIcon';
import { RitualsIcon } from '~/components/images/RitualsIcon';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { Well } from '~/components/Well';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { useChannelModOrOwner } from '~/hooks/useUserChannelRole';
import { CommonStackParamList } from '~/types';

type ChannelManageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ChannelManage'
>;

const ChannelManageScreen = buildScreen<ChannelManageScreenProps>(
  { name: 'ChannelManage', insetTop: false },
  ({
    route: {
      params: { channelKey },
    },
  }) => {
    const t = useTheme();
    const push = usePush();

    const channelRole = useChannelModOrOwner(channelKey);
    const isOwner = channelRole === 'owner';

    const manageDetails = useCallback(() => {
      push('ChannelManageDetails', { channelKey });
    }, [push, channelKey]);

    const manageMembers = useCallback(() => {
      push('ChannelManageMembers', { channelKey });
    }, [push, channelKey]);

    const manageBannedUsers = useCallback(() => {
      push('ChannelManageBannedUsers', { channelKey });
    }, [push, channelKey]);

    const manageInviteLink = useCallback(() => {
      push('ChannelManageInviteLink', { channelKey });
    }, [push, channelKey]);

    const manageWhoCanCast = useCallback(() => {
      push('ChannelManageWhoCanCast', { channelKey });
    }, [push, channelKey]);

    // temporary hidden until we implement on web
    const onlyOnWeb = true;

    const items: ButtonGroupOption[] = useMemo(
      () =>
        (
          [
            {
              iconLeft: ({ size }) => (
                <Octicons
                  name="typography"
                  size={size}
                  color={t.colors.text.primary}
                />
              ),
              label: 'Edit details',
              onPress: manageDetails,
            },
            {
              iconLeft: ({ size }) => (
                <Octicons
                  name="people"
                  size={size}
                  color={t.colors.text.primary}
                />
              ),
              label: 'Manage members',
              onPress: manageMembers,
            },
            {
              iconLeft: ({ size }) => (
                <PersonXIcon size={size} color={t.colors.text.primary} />
              ),
              label: 'Banned users',
              onPress: manageBannedUsers,
            },
            {
              iconLeft: ({ size }) => (
                <Octicons
                  name="link"
                  size={size}
                  color={t.colors.text.primary}
                />
              ),
              label: 'Invite link',
              onPress: manageInviteLink,
            },
            isOwner && {
              iconLeft: ({ size }) => (
                <Octicons
                  name="pencil"
                  size={size}
                  color={t.colors.text.primary}
                />
              ),
              label: 'Who can cast',
              onPress: manageWhoCanCast,
            },
            !onlyOnWeb &&
              isOwner && {
                iconLeft: ({ size }) => (
                  <RitualsIcon color={t.colors.text.primary} size={size} />
                ),
                label: 'Rituals',
                onPress: () => {},
              },
            !onlyOnWeb &&
              isOwner && {
                iconLeft: ({ size }) => (
                  <CircleArrowIcon size={size} color={t.colors.text.danger} />
                ),
                label: 'Change owner',
                destructive: true,
                onPress: () => {},
              },
          ] as Array<ButtonGroupOption | undefined>
        ).filter(Boolean) as Array<ButtonGroupOption>,
      [
        manageDetails,
        manageMembers,
        manageBannedUsers,
        manageInviteLink,
        isOwner,
        manageWhoCanCast,
        onlyOnWeb,
        t.colors.text.primary,
        t.colors.text.danger,
      ],
    );

    return (
      <ScrollView style={[t.hFull, t.p4]}>
        <ButtonGroup options={items} />

        <Well style={[t.mT4]}>
          <Text2 weight="semibold" style={[t.mB1]}>
            Available on web: Rituals & Change owner
          </Text2>
          <Text2>
            These features are only available on the web version. Please visit
            Channel Settings on the web to manage rituals or transfer channel
            ownership.
          </Text2>
        </Well>
      </ScrollView>
    );
  },
);

ChannelManageScreen.displayName = 'ChannelManageScreen';

export { ChannelManageScreen };
