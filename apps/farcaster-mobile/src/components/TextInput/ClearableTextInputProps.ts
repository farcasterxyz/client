import { PasteInputRef } from '@mattermost/react-native-paste-input';
import * as React from 'react';

import { TextareaProps } from './LinkifiedTextarea';

export type ClearableTextInputRef = {
  getValueAndReset: () => Promise<string>;
};
export type ClearableTextInputProps = Omit<TextareaProps, 'ref'> & {
  onChangeText: (newValue: string) => void;
  value: string;
  pasteInputRef: React.RefObject<null | PasteInputRef>;
  ref: React.Ref<ClearableTextInputRef>;
};
