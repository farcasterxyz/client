import React, { FC } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text, TextProps } from 'react-native';

// If you don't need press handlers, consider using the lighter-weight `~/Text` component.
// https://twitter.com/fernandotherojo/status/1707762822015267219?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://twitter.com/peterpme/status/1707983667627446497?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://github.com/peterpme/react-native-fast-text

const TextWithPress: FC<TextProps> = ({ style, ...otherProps }) => {
  return <Text suppressHighlighting {...otherProps} style={style} />;
};

TextWithPress.displayName = 'TextWithPress';

export { TextWithPress };
