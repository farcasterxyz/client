// eslint-disable-next-line no-restricted-imports
import BottomSheetLib, {
  BottomSheetProps as BottomSheetPropsLib,
  SNAP_POINT_TYPE,
} from '@gorhom/bottom-sheet';
import React, { useCallback } from 'react';

import { useSharedTelemetry } from '../../contexts/SharedTelemetryContext';

type BottomSheetProps = BottomSheetPropsLib & {
  /** Used to idenity this botttom sheet in analytics */
  name: string;
};

export function BottomSheet({
  children,
  name,
  onClose,
  onChange,
  ref,
  ...rest
}: BottomSheetProps & { ref?: React.Ref<BottomSheetLib> }) {
  const { addRumAction } = useSharedTelemetry();
  const wrappedOnClose = useCallback(() => {
    addRumAction('bottom sheet dismiss', {
      name,
    });
    onClose?.();
  }, [name, onClose, addRumAction]);

  const wrappedOnChange = useCallback(
    (index: number, position: number, type: SNAP_POINT_TYPE) => {
      addRumAction('bottom sheet change', {
        name,
        index,
      });
      onChange?.(index, position, type);
    },
    [name, onChange, addRumAction],
  );
  return (
    <BottomSheetLib
      ref={ref}
      onClose={wrappedOnClose}
      onChange={wrappedOnChange}
      {...rest}
    >
      {children}
    </BottomSheetLib>
  );
}
