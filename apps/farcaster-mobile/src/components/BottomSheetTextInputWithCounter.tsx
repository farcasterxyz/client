import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import React, { FC, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';

import { Text } from '~/components/Text';
import { TextInputProps } from '~/components/TextInput/TextInput';
import { useTheme } from '~/contexts/ThemeProvider';

type BottomSheetTextInputWithCounterProps = TextInputProps & {
  quickSelectMemos: string[];
  onQuickMemoSelect: ({ memo }: { memo: string }) => void;
};

const BottomSheetTextInputWithCounter: FC<
  BottomSheetTextInputWithCounterProps
> = ({ quickSelectMemos, onQuickMemoSelect, ...props }) => {
  const t = useTheme();
  const [length, setLength] = useState(props.value?.length);
  const [focused, setFocused] = useState(props.autoFocus);

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color: t.colors.bgTransparent,
      },
      1: {
        color: t.colors.bgDefault,
      },
    },
  });

  const inputRef = React.useRef(null);

  useEffect(() => {
    setLength(props.value?.length);
  }, [props.value]);

  return (
    <View style={[t.flex, t.flexCol, t.wFull]}>
      <BottomSheetTextInput
        {...props}
        ref={inputRef}
        onFocus={(e) => {
          setFocused(true);

          if (typeof props.onFocus !== 'undefined') {
            props.onFocus(e);
          }
        }}
        onBlur={(e) => {
          setFocused(false);

          if (typeof props.onBlur !== 'undefined') {
            props.onBlur(e);
          }
        }}
        style={[
          focused ? t.borderTabViewActive : t.borderDefault,
          t.texts.primary,
          t.borderHairline,
          t.rounded,
          t.textSm,
          t.h10,
          t.pY1,
          t.pX2,
        ]}
      />
      <View
        style={[
          t.wFull,
          t.flex,
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.mT1,
          t.h8,
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          horizontal={true}
          showsHorizontalScrollIndicator={false}
        >
          {quickSelectMemos.map((memo) => (
            <TouchableOpacity
              key={memo}
              style={[
                t.borderDefault,
                t.borderHairline,
                t.flex,
                t.flexRow,
                t.rounded,
                t.pX2,
                t.h8,
                t.itemsCenter,
                t.selfStart,
                t.mR1,
              ]}
              activeOpacity={0.5}
              onPress={() => {
                onQuickMemoSelect({ memo });
              }}
            >
              <Text style={[t.texts.primary, t.textSm]}>{memo}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <LinearGradient
          colors={colors as unknown as [string, string, ...string[]]}
          locations={locations as unknown as [number, number, ...number[]]}
          style={[t.absolute, t.hFull, t.w4, { right: 32 }]}
          pointerEvents="none"
        />
        <Text style={[t.mL2, t.justifyEnd, t.texts.tertiary]}>
          {length}/{props.maxLength}
        </Text>
      </View>
    </View>
  );
};

BottomSheetTextInputWithCounter.displayName = 'BottomSheetTextInputWithCounter';

export { BottomSheetTextInputWithCounter };
