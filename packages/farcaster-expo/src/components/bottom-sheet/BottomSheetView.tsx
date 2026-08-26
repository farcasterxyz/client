import { BottomSheetView as BottomSheetViewLib } from '@gorhom/bottom-sheet';
import { BottomSheetViewProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetView/types';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '../../theme';

export const BOTTOM_SHEET_CONTAINER_PADDING = sizes.s4;

export function BottomSheetContentContainer(props: BottomSheetViewProps) {
  const insets = useSafeAreaInsets();
  const baseStyle = useMemo(
    () => ({
      // This is a quirk of dynamically sized bottom sheet views with flex displays
      minHeight: 120,
      paddingHorizontal: sizes.s4,
      paddingBottom: insets.bottom + sizes.s2,
      // Handle will account for 2 size units
      paddingTop: sizes.s2,
    }),
    [insets.bottom],
  );

  return (
    <BottomSheetViewLib
      {...props}
      style={StyleSheet.compose(baseStyle, props.style)}
    />
  );
}
