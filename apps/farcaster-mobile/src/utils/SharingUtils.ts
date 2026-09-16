// eslint-disable-next-line no-restricted-imports
import { Platform, Share } from 'react-native';

export async function shareUrl({ title, url }: { title: string; url: string }) {
  if (Platform.OS === 'ios') {
    return await Share.share({ title, url });
  } else {
    return await Share.share({ title, message: url });
  }
}
