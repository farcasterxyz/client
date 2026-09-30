import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import React, { useLayoutEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const isFabricEnabledOnIOS = (): boolean => {
  if (Platform.OS !== 'ios') return false;
  return Boolean(
    (globalThis as unknown as { nativeFabricUIManager?: unknown })
      .nativeFabricUIManager,
  );
};

// Workaround for react-native-screens@4.25 + iOS Fabric + iOS 26 where the
// nav chrome height is injected into UIScrollView.contentInset.top below
// the JS prop layer.
//
// Both lines are required:
//   1. headerTransparent: true     → opts the screen out of the chrome
//                                    auto-inset injection.
//   2. a custom headerBackground   → some rn-screens versions still inject
//                                    the inset under headerTransparent
//                                    alone; supplying *any* custom
//                                    headerBackground View reliably
//                                    suppresses it. The View is kept
//                                    transparent (no backgroundColor)
//                                    because an opaque fill paints over
//                                    headerLeft / headerTitle on
//                                    rn-screens@4.25 (intermittently
//                                    hides the back button). The screen's
//                                    own dark background shows through.
//
// The screen then pads its scroll content by `paddingTop` to compensate
// for the now-transparent header. No-op on Android and the iOS legacy
// bridge.
const useFabricChromeInsetFix = () => {
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const apply = isFabricEnabledOnIOS();

  useLayoutEffect(() => {
    if (!apply) return;
    navigation.setOptions({
      headerTransparent: true,
      headerBackground: () => (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} />
      ),
    });
  }, [apply, navigation]);

  return useMemo(
    () => ({
      apply,
      paddingTop: apply ? headerHeight : 0,
      contentInsetTop: apply ? headerHeight : 0,
    }),
    [apply, headerHeight],
  );
};

export { isFabricEnabledOnIOS, useFabricChromeInsetFix };
