import React, { createContext, FC, useContext } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Text, TextProps } from 'react-native';

// If you don't need press handlers, consider using the lighter-weight `~/Text` component.
// https://twitter.com/fernandotherojo/status/1707762822015267219?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://twitter.com/peterpme/status/1707983667627446497?s=46&t=upSpXM_1YfY4QIdQjFnxwg
// https://github.com/peterpme/react-native-fast-text

// In RN nested Text, the innermost span with any press handler becomes the
// responder for touches inside its bounds, so a long-press on a mention/link
// span never reaches an enclosing text's onLongPress. An enclosing component
// that needs long-press across its whole body (see LongPressCopyText)
// provides its handler here; spans without their own onLongPress forward it.
// Null everywhere else — no behavior change outside a provider.
const NestedTextLongPressContext = createContext<
  TextProps['onLongPress'] | null
>(null);

const TextWithPress: FC<TextProps> = ({
  style,
  onLongPress,
  ...otherProps
}) => {
  const nestedLongPress = useContext(NestedTextLongPressContext);

  return (
    <Text
      suppressHighlighting
      {...otherProps}
      onLongPress={onLongPress ?? nestedLongPress ?? undefined}
      style={style}
    />
  );
};

TextWithPress.displayName = 'TextWithPress';

export { NestedTextLongPressContext, TextWithPress };
