import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  // eslint-disable-next-line no-restricted-imports
  BottomSheetModal as BottomSheetModalLib,
  BottomSheetModalProps as BottomSheetModalPropsLib,
  SNAP_POINT_TYPE,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
const SIWF_DEBUG = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return (
      window.location?.search?.includes('debug-swap=1') ||
      window.localStorage?.getItem('debug-swap') === '1'
    );
  } catch {
    return false;
  }
})();
const siwfLog = (...args: unknown[]) => {
  if (!SIWF_DEBUG) return;
  // eslint-disable-next-line no-console
  console.log('[swap-debug][BottomSheetModalWrapper]', ...args);
};
import { XIcon } from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { ReduceMotion } from 'react-native-reanimated';

import { hitSlop } from '../../constants';
import { useSharedTelemetry } from '../../contexts/SharedTelemetryContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOptionalSafeAreaInsets } from '../../hooks/useOptionalSafeAreaInsets';
import { convertHexToRGBA } from '../../theme/utils';

function WebBottomSheetModalBackground() {
  const t = useTheme();
  return (
    <View
      style={[
        t.absolute,
        t.inset0,
        t._mT2,
        t._mB2,
        t.bgDefault,
        {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      ]}
    />
  );
}

const backdropOpacity = 0.3;

export type BottomSheetModalProps = Omit<
  BottomSheetModalPropsLib,
  'children'
> & {
  // We overwrite children because @gorhom/bottom-sheet version 5 introduced a
  // Promise return that depends on React Suspense, and we're not sure we're
  // ready to support that here yet. Would require an await call in
  // BottomSheetModal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactNode | ((context: { data?: any }) => React.ReactNode);
  ref?: React.Ref<BottomSheetModalLib>;

  /** Used to idenity this botttom sheet in analytics */
  name: string;
};

/**
 * Minimally enhanced BottomSheetModal component with DataDog RUM
 * event tracking.
 */
function BaseBottomSheetModal({
  children,
  onDismiss,
  onChange,
  name,
  enableDynamicSizing,
  ref,
  ...rest
}: BottomSheetModalProps) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  const { addRumAction } = useSharedTelemetry();

  const wrappedOnDismiss = useCallback(() => {
    addRumAction('bottom sheet modal dismiss', {
      name,
    });
    onDismiss?.();
  }, [name, onDismiss, addRumAction]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={1}
        disappearsOnIndex={-1}
        style={
          Platform.OS === 'web'
            ? {
                backgroundColor: convertHexToRGBA(t.colors.black, 0.3),
              }
            : undefined
        }
        opacity={backdropOpacity}
      />
    ),
    [t.colors.black],
  );

  const wrappedOnChange = useCallback(
    (index: number, position: number, type: SNAP_POINT_TYPE) => {
      if (index === -1) {
        addRumAction('bottom sheet modal close', {
          name,
        });
      } else {
        addRumAction('bottom sheet modal open', {
          name,
          index,
        });
      }

      onChange?.(index, position, type);
    },
    [name, onChange, addRumAction],
  );

  const webBackgroundComponent = useCallback(
    () => <WebBottomSheetModalBackground />,
    [],
  );

  return (
    <BottomSheetModalLib
      ref={ref}
      topInset={insets.top}
      backgroundComponent={
        Platform.OS === 'web' ? webBackgroundComponent : undefined
      }
      backdropComponent={renderBackdrop}
      backgroundStyle={[t.borderHairline, t.borderDefault]}
      enableDynamicSizing={enableDynamicSizing}
      keyboardBlurBehavior="restore"
      onDismiss={wrappedOnDismiss}
      onChange={wrappedOnChange}
      {...rest}
    >
      {children}
    </BottomSheetModalLib>
  );
}

const animationConfigs = { duration: 150 };

/**
 * Standard BottomSheetModal component with default configuration.
 */
export function BottomSheetModal({
  children,
  ref,
  ...rest
}: BottomSheetModalProps) {
  const t = useTheme();
  const insets = useOptionalSafeAreaInsets();
  siwfLog('render (about to call useBottomSheetModal)', {
    name: rest.name,
    ts: Date.now(),
  });
  const { dismissAll } = useBottomSheetModal();
  siwfLog('useBottomSheetModal OK', { name: rest.name, ts: Date.now() });

  let content = children;
  if (Platform.OS === 'web') {
    content = (
      <>
        {children}
        <Pressable
          onPress={dismissAll}
          style={[t.absolute, t.top0, t.right0, t.pR4, t.pT2]}
          hitSlop={hitSlop}
        >
          <XIcon size={20} style={t.texts.secondary} />
        </Pressable>
      </>
    );
  }

  return (
    <BaseBottomSheetModal
      ref={ref}
      topInset={insets.top}
      backgroundStyle={[t.borderHairline, t.borderDefault, t.bgDefault]}
      handleIndicatorStyle={[t.bgPromptHandle, t.w12]}
      enableDynamicSizing={true}
      keyboardBlurBehavior="restore"
      animationConfigs={animationConfigs}
      handleComponent={Platform.OS === 'web' ? null : undefined}
      enableContentPanningGesture={Platform.OS !== 'web'}
      overrideReduceMotion={ReduceMotion.Never}
      {...rest}
    >
      {content}
    </BaseBottomSheetModal>
  );
}

export const useBottomSheetModalRef = () => useRef<BottomSheetModalLib>(null);
