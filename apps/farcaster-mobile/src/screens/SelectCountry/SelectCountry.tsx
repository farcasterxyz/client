import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { COUNTRIES } from '~/constants/Countries';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { RootNativeStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type SelectCountryScreenProps = NativeStackScreenProps<
  RootNativeStackParamList,
  'SelectCountry'
>;

const SelectCountryScreen = buildScreen<SelectCountryScreenProps>(
  {
    insetBottom: false,
    name: 'SelectCountry',
  },
  ({ route: { params } }) => {
    const t = useTheme();
    const pop = usePop();

    const handleSelect = (code: string) => {
      params.onSelect(code);
      pop();
    };

    const countries = useMemo(() => {
      if (params.allowedCountyCodes) {
        return params.allowedCountyCodes.reduce<
          Array<{
            code: string;
            name: string;
            emoji: string;
          }>
        >(
          (acc, code) =>
            COUNTRIES[code as keyof typeof COUNTRIES]
              ? [...acc, COUNTRIES[code as keyof typeof COUNTRIES]]
              : acc,
          [],
        );
      }

      return Object.values(COUNTRIES);
    }, [params.allowedCountyCodes]);

    return (
      <View style={[t.hFull, t.flex, t.bgMuted]}>
        <FlashList
          data={countries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ paddingBottom: 50 }}
          {...STANDARD_FLASHLIST_PERF_PROPS}
          renderItem={({ item, index }) => (
            <Pressable
              style={[t.pX3, t.bgDefault]}
              onPress={() => handleSelect(item.code)}
            >
              <View
                style={[
                  { height: 48 },
                  t.flex,
                  t.flexRow,
                  t.itemsCenter,
                  t.pX3,
                  t.texts.primary,
                  ...(index !== countries.length - 1
                    ? [t.borderDefault, t.borderBHairline]
                    : []),
                ]}
              >
                <Text style={[t.mR3]}>{item.emoji}</Text>
                <Text style={[t.texts.primary, t.textLg]}>{item.name}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  },
);

export { SelectCountryScreen };
