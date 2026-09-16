import { ApiDirectCastConversationFilter } from 'farcaster-client-data';
import React from 'react';
import { View } from 'react-native';

import { FilterPills } from '~/components/FilterPills';
import { useTheme } from '~/contexts/ThemeProvider';

export type InboxFilter = 'all' | ApiDirectCastConversationFilter;

const filters: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'group', label: 'Groups' },
  { id: '1-1', label: '1:1s' },
];

type InboxHeaderFiltersProps = {
  onFilterChange: ({ filter }: { filter: InboxFilter }) => void;
};

const InboxHeaderFilters: React.FC<InboxHeaderFiltersProps> = React.memo(
  ({ onFilterChange }) => {
    const t = useTheme();
    const [activeFilter, setActiveFilter] = React.useState<InboxFilter>('all');

    const onActiveFilterChange = React.useCallback(
      ({ pillId }: { pillId: string }) => {
        if (
          pillId !== 'all' &&
          pillId !== 'unread' &&
          pillId !== 'group' &&
          pillId !== '1-1'
        ) {
          return;
        }

        setActiveFilter(pillId);

        onFilterChange({ filter: pillId });
      },
      [onFilterChange],
    );

    return (
      <View
        style={[
          t.borderBHairline,
          t.borderDefault,
          t.pX3,
          t.pB2,
          { paddingTop: 6 },
        ]}
      >
        <FilterPills
          pills={filters}
          activePillId={activeFilter}
          onActivePillChange={onActiveFilterChange}
        />
      </View>
    );
  },
);

InboxHeaderFilters.displayName = 'InboxHeaderFilters';

export { InboxHeaderFilters };
