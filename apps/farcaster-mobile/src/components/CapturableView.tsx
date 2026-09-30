import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, ViewProps } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { trackError } from '~/utils/ErrorUtils';

export interface CaptureOptions {
  format?: 'png' | 'jpeg';
  quality?: number;
}

export interface CapturableViewRef {
  capture: (options?: CaptureOptions) => Promise<string | null>;
}

export interface CapturableViewProps extends ViewProps {
  children: React.ReactNode;
}

export const CapturableView = forwardRef<
  CapturableViewRef,
  CapturableViewProps
>(({ children, ...viewProps }, ref) => {
  const viewRef = useRef<View | null>(null);
  useImperativeHandle(ref, () => ({
    capture: async (options: CaptureOptions = {}) => {
      const { format = 'png', quality = 1.0 } = options;

      try {
        if (!viewRef.current) {
          return null;
        }

        // captureRef snapshots the native view hierarchy (including RN text),
        // which makeImageFromView could not do on Android. Returns raw base64.
        return await captureRef(viewRef, {
          format: format === 'jpeg' ? 'jpg' : 'png',
          quality,
          result: 'base64',
        });
      } catch (error) {
        trackError(new Error('Failed to capture view', { cause: error }));
        return null;
      }
    },
  }));

  return (
    <View ref={viewRef} collapsable={false} {...viewProps}>
      {children}
    </View>
  );
});

CapturableView.displayName = 'CapturableView';
