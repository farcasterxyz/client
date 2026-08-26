import { DdRum } from '@datadog/mobile-react-native';
import { useEffect } from 'react';

/**
 * React Navigation screens are tracked automatically. This hook is for cases
 * where a new view is displayed outside of this (e.g., error boundary
 * screens).
 */
export function useManuallyTrackView({
  key,
  name,
  context,
}: {
  key: string;
  name: string;
  /** Must be stable **/
  context?: object;
}) {
  useEffect(() => {
    DdRum.startView(key, name, context, Date.now());

    return () => {
      DdRum.stopView(key, context, Date.now());
    };
  }, [context, key, name]);
}
