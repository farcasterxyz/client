import React from 'react';
import { View } from 'react-native';

import { useTheme } from '~/contexts/ThemeProvider';

import { PillTab } from './CollapsibleTab/PillTab';

type FilterPill = {
  id: string;
  label: string;
};

type FilterPillsProps = {
  pills: FilterPill[];
  activePillId: string;
  onActivePillChange: ({ pillId }: { pillId: string }) => void;
};

const FilterPills: React.FC<FilterPillsProps> = React.memo(
  ({ pills, activePillId, onActivePillChange }) => {
    const t = useTheme();

    return (
      <View style={[t.wFull, t.flex, t.flexRow, t.itemsCenter]}>
        {pills.map((pill, index) => {
          const isActivePill = pill.id === activePillId;

          return (
            <View
              key={pill.id}
              style={[
                { flex: 1 },
                index < pills.length - 1 && { marginRight: 8 },
              ]}
            >
              <PillTab
                name={pill.label}
                isActive={isActivePill}
                onPress={() => onActivePillChange({ pillId: pill.id })}
                noPadding={true}
              />
            </View>
          );
        })}
      </View>
    );
  },
);

FilterPills.displayName = 'FilterPills';

export { FilterPills };
