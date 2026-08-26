import React, { FC, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Text } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';

import { TextInput, TextInputProps } from './TextInput';

const TextInputWithCounter: FC<TextInputProps> = (props) => {
  const { inputStyle, paddingLeft, containerStyle, ...otherProps } = props;
  const t = useTheme();
  const [length, setLength] = useState(props.value?.length);

  useEffect(() => {
    setLength(props.value?.length);
  }, [props.value]);

  return (
    <View style={[t.flexCol, containerStyle]}>
      <TextInput
        {...otherProps}
        inputStyle={[
          t.border,
          t.borderTabViewActive,
          t.roundedLg,
          // For some reason t.pY doesn't work when multiline is true
          t.pB3,
          t.pT3,
          t.pX3,
          inputStyle,
        ]}
        paddingLeft={paddingLeft ?? sizes.s3}
      />
      <Text style={[t.selfEnd, t.texts.tertiary, { paddingTop: 6 }]}>
        {length}/{props.maxLength}
      </Text>
    </View>
  );
};

TextInputWithCounter.displayName = 'TextInputWithCounter';

export { TextInputWithCounter };
