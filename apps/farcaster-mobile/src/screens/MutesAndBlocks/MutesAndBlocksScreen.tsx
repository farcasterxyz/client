import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { MenuItemProps, SimpleMenu } from '~/screens/Debug/MenuItem';
import { CommonStackParamList } from '~/types';

type MutesAndBlocksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MutesAndBlocks'
>;

const MutesAndBlocksScreen = buildScreen<MutesAndBlocksScreenProps>(
  { name: 'MutesAndBlocks' },
  () => {
    const t = useTheme();
    const push = usePush();

    const menuItems: Omit<MenuItemProps, 'isLastItem'>[] = useMemo(() => {
      const items: Omit<MenuItemProps, 'isLastItem'>[] = [];

      items.push({
        name: 'Blocked accounts',
        icon: (
          <Octicons name="blocked" size={20} color={t.colors.text.primary} />
        ),
        onPress: () => {
          push('BlockedUsers', {});
        },
      });

      items.push({
        name: 'Muted accounts',
        icon: <Octicons name="mute" size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('MutedUsers', {});
        },
      });

      items.push({
        name: 'Muted words',
        icon: <Octicons name="mute" size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('MutedKeywords', {});
        },
      });

      return items;
    }, [push, t.colors.text.primary]);

    return (
      <View style={[t.p4]}>
        <SimpleMenu
          items={menuItems}
          analyticsEvent={AnalyticsEvent.PressSettingsItem}
        />
      </View>
    );
  },
);

MutesAndBlocksScreen.displayName = 'MutesAndBlocksScreen';

export { MutesAndBlocksScreen };
