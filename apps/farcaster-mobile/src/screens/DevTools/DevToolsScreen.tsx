import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { MenuItems, SimpleMenu } from '~/screens/Debug/MenuItem';
import { CommonStackParamList } from '~/types';

type DevToolsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DevTools'
>;

// We don't link to this page from within the app but are leaving it
// to support the deep link.
const DevToolsScreen = buildScreen<DevToolsScreenProps>(
  { name: 'DevTools' },
  () => {
    const t = useTheme();
    const push = usePush();
    const { data: userPreferences } = useUserPreferences();
    const setUserPreferences = useSetUserPreferences();
    const doOnce = useRef(false);

    const menuItems = useMemo(() => {
      const items: MenuItems = [];

      items.push({
        name: 'Preview Tool',
        icon: <Octicons name="tools" size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('DevToolsPreviewMiniAppUrl', {});
        },
      });

      items.push({
        name: 'Domains',
        icon: <Octicons name="tools" size={20} color={t.colors.text.primary} />,
        onPress: () => {
          push('DevToolsDomains', {});
        },
      });

      return items;
    }, [push, t.colors.text.primary]);

    useEffect(() => {
      if (
        !userPreferences?.result.preferences.enableDeveloperMode &&
        !doOnce.current
      ) {
        doOnce.current = true;
        setUserPreferences({
          preferences: {
            enableDeveloperMode: true,
          },
        });
      }
    }, [userPreferences, setUserPreferences]);

    return (
      <View style={[t.hFull, t.p4]}>
        <SimpleMenu items={menuItems} />
      </View>
    );
  },
);

DevToolsScreen.displayName = 'DevToolsScreen';

export { DevToolsScreen };
