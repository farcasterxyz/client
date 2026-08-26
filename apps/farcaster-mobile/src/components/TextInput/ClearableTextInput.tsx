import * as React from 'react';

import { waitForInteractions } from '~/utils/InteractionUtils';
import { sleep } from '~/utils/PromiseUtils';

import { ClearableTextInputProps } from './ClearableTextInputProps';
import { LinkifiedTextarea } from './LinkifiedTextarea';

function ClearableTextInput({
  pasteInputRef,
  onChangeText,
  value,
  ref,
  ...rest
}: ClearableTextInputProps) {
  const lastMessageSentRef = React.useRef<string | undefined>(undefined);
  const queuedResolveRef = React.useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

  const ourOnChangeText = React.useCallback(
    (inputText: string) => {
      let text;
      const lastMessageSent = lastMessageSentRef.current;
      if (
        lastMessageSent &&
        lastMessageSent.length < inputText.length &&
        inputText.startsWith(lastMessageSent)
      ) {
        text = inputText.substring(lastMessageSent.length);
      } else {
        text = inputText;
        lastMessageSentRef.current = undefined;
      }
      onChangeText(text);
    },
    [onChangeText],
  );

  const { onSelectionChange } = rest;
  const getValueAndReset = React.useCallback(() => {
    onChangeText('');

    // We are doing something very naughty here, which is that we are
    // constructing a fake nativeEvent. We are certainly not including all the
    // fields that the type is expected to have, which is why we need to
    // any-type it. We know this is okay because the code that uses
    // ClearableTextInput only accesses event.nativeEvent.selection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeSelectionEvent: any = {
      nativeEvent: { selection: { end: 0, start: 0 } },
    };
    onSelectionChange?.(fakeSelectionEvent);

    lastMessageSentRef.current = value;
    pasteInputRef.current?.clear();
    return new Promise<string>((resolve) => {
      queuedResolveRef.current = async () => {
        await waitForInteractions();
        await sleep(5);
        resolve(value);
      };
    });
  }, [onChangeText, onSelectionChange, pasteInputRef, value]);

  React.useImperativeHandle(ref, () => ({ getValueAndReset }), [
    getValueAndReset,
  ]);

  const hasValue = !!value;
  React.useEffect(() => {
    if (!hasValue && queuedResolveRef.current) {
      const resolve = queuedResolveRef.current;
      queuedResolveRef.current = undefined;
      resolve();
    }
  }, [hasValue]);

  return (
    <LinkifiedTextarea
      {...rest}
      onChangeText={ourOnChangeText}
      value={value}
      ref={pasteInputRef}
    />
  );
}

const MemoizedClearableTextInput = React.memo(ClearableTextInput);

export { MemoizedClearableTextInput as ClearableTextInput };
