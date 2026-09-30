import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { RootNativeStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type SelectCastActionScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'SelectCastAction'
>;

const SelectCastActionScreen = buildScreen<SelectCastActionScreenProps>(
  {
    insetBottom: false,
    name: 'SelectCastAction',
  },
  ({ route: { params } }) => {
    const { castActions, onSelect } = params;

    const t = useTheme();
    const pop = usePop();

    const handleSelect = (id: string) => {
      onSelect(id);
      pop();
    };

    return (
      <View style={[t.hFull, t.flex, t.bgDefault]}>
        <FlashList
          data={castActions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ ...t.pB4 } as ViewStyle}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={({ item }) => (
            <Pressable
              style={[t.bgDefault]}
              onPress={() => handleSelect(item.id)}
            >
              <View
                style={[
                  { height: 60 },
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.pX5,
                  t.texts.primary,
                  t.borderDefault,
                  t.borderBHairline,
                ]}
              >
                <Text style={[t.mR3]}>
                  <Octicons
                    name={item.octicon as 'info'}
                    size={18}
                    style={t.texts.primary}
                  />
                </Text>
                <Text style={[t.texts.primary, t.textLg]}>{item.name}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  },
);

export { SelectCastActionScreen };
