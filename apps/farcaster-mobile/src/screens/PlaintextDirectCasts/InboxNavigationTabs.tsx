import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';

type InboxTab = 'inbox' | 'requests' | 'archived';

const TABS: { id: InboxTab; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'requests', label: 'Requests' },
  { id: 'archived', label: 'Archived' },
];

type InboxNavigationTabsProps = {
  activeTab?: InboxTab;
};

const InboxNavigationTabs: React.FC<InboxNavigationTabsProps> = React.memo(
  ({ activeTab = 'inbox' }) => {
    const t = useTheme();
    const push = usePush();
    const navigation = useNavigation();

    const onPress = React.useCallback(
      (tab: InboxTab) => {
        if (tab === 'requests') {
          push('DirectCastsRequests', {});
        } else if (tab === 'archived') {
          push('DirectCastsArchived', {});
        } else if (tab === 'inbox') {
          navigation.navigate('PlaintextDirectCasts' as never);
        }
      },
      [push, navigation],
    );

    return (
      <View
        style={[
          t.flexRow,
          t.pX4,
          { paddingTop: 12, paddingBottom: 4, gap: 20 },
        ]}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onPress(tab.id)}
              activeOpacity={0.7}
              disabled={isActive}
            >
              <Text
                style={[
                  { fontSize: 16 },
                  isActive
                    ? [t.fontSemibold, t.texts.primary]
                    : [t.fontNormal, t.texts.tertiary],
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  },
);

InboxNavigationTabs.displayName = 'InboxNavigationTabs';

export { InboxNavigationTabs };
