import * as React from 'react';
import { TextInput } from 'react-native';

import {
  AutocorrectableTextInputProps,
  AutocorrectableTextInputRef,
} from './AutocorrectableTextInputProps';

const AutocorrectableTextInput = React.forwardRef(
  function AutocorrectableTextInput(
    props: AutocorrectableTextInputProps,
    ref: React.Ref<AutocorrectableTextInputRef>,
  ) {
    const textRef = React.useRef(props.value);

    const baseOnChangeText = props.onChangeText;
    const onChangeText = React.useCallback(
      (text: string) => {
        textRef.current = text;
        baseOnChangeText(text);
      },
      [baseOnChangeText],
    );

    const getValue = React.useCallback(
      () => Promise.resolve(textRef.current),
      [],
    );

    React.useImperativeHandle(ref, () => ({ getValue }), [getValue]);

    return <TextInput {...props} onChangeText={onChangeText} />;
  },
);

const MemoizedAutocorrectableTextInput = React.memo(AutocorrectableTextInput);

export { MemoizedAutocorrectableTextInput as AutocorrectableTextInput };
