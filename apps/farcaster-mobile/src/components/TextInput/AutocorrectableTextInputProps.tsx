import { TextInputProps } from 'react-native';

export type AutocorrectableTextInputRef = {
  getValue: () => Promise<string>;
};
export type AutocorrectableTextInputProps = TextInputProps & {
  onChangeText: (newValue: string) => void;
  value: string;
};
