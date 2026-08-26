import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

export async function copyText(text: string) {
  if (Platform.OS === 'web') {
    navigator.clipboard.writeText(text);
  } else {
    await Clipboard.setStringAsync(text);
  }
}
