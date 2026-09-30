import {
  getDefaultHeaderHeight,
  useHeaderHeight,
} from '@react-navigation/elements';
import { Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On Android, React Navigation measures useHeaderHeight based on all navigators
// in the hierarchy. This works well in the unauthed scenario, where we have an
// unusually tall custom header (HeaderLeftAligned) and no complex parent
// navigators. However, when the app is authed we end up getting the height of
// the HeaderLeftAligned header, which isn't what we want. Instead we can use
// this helper that determines Android header height based on
// getDefaultHeaderHeight.
function useAuthedHeaderHeight() {
  const { top } = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  if (Platform.OS === 'android') {
    return getDefaultHeaderHeight(Dimensions.get('window'), false, top);
  }

  return headerHeight;
}

export { useAuthedHeaderHeight };
