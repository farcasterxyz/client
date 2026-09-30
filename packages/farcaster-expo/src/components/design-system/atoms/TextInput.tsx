import * as React from 'react';
import { TextInput as RNTextInput, TextInputProps } from 'react-native';

export type { TextInputProps };

export type TextInput = RNTextInput;

export const TextInput = ({
  style,
  ...props
}: TextInputProps & { ref?: React.Ref<RNTextInput> }) => (
  <RNTextInput
    style={[
      {
        // @ts-expect-error web only style
        outline: 'none',
      },
      style,
    ]}
    {...props}
  />
);
