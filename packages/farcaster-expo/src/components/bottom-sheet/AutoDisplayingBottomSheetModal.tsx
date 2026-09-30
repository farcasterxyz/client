import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import React, { forwardRef, useEffect, useMemo } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import {
  BottomSheetModal,
  BottomSheetModalProps,
  useBottomSheetModalRef,
} from './BottomSheetModal';
import { BottomSheetContentContainer } from './BottomSheetView';

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
  console.log('[swap-debug][AutoDisplayingBottomSheetModal]', ...args);
};

type AutoDisplayingBottomSheetModalProps = BottomSheetModalProps & {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  displayedInModalPresentationScreen?: boolean;
  disableBottomSheetContentContainer?: boolean;
  stackBehavior?: 'push';
};

const AutoDisplayingBottomSheetModal = forwardRef<
  { dismiss: () => void },
  AutoDisplayingBottomSheetModalProps
>((props, ref) => {
  const {
    children,
    contentContainerStyle,
    displayedInModalPresentationScreen,
    disableBottomSheetContentContainer,
    stackBehavior,
    ...rest
  } = props;
  const bottomSheetRef = useBottomSheetModalRef();
  siwfLog('render (about to call useBottomSheetModal)', {
    name: rest.name,
    ts: Date.now(),
  });
  const { dismissAll } = useBottomSheetModal();
  siwfLog('useBottomSheetModal OK', { name: rest.name, ts: Date.now() });

  // HACK: We have to do this to have the bottom sheet properly show above the
  // modal presentation screens (swap screen is one of those).
  const cc = React.useCallback(
    (props: React.PropsWithChildren) => (
      <FullWindowOverlay>{props.children}</FullWindowOverlay>
    ),
    [],
  );

  const containerComponent =
    displayedInModalPresentationScreen && Platform.OS === 'ios'
      ? cc
      : undefined;

  useEffect(() => {
    if (stackBehavior !== 'push') {
      dismissAll();
    }

    const bottomSheet = bottomSheetRef.current;
    bottomSheet?.present();

    // ref is optional, but if it exists, we need to set the dismiss method on it
    // so we can call it from the parent.
    if (bottomSheet && ref && 'current' in ref) {
      ref.current = {
        dismiss: () => bottomSheet.dismiss(),
      };
    }

    return () => {
      // There's an odd behavior happening when ref is set. The cleanup function
      // right after mounting so the bottom sheet is dismissed. We add this check
      // to prevent unnecessary dismissals and ensure the parent can dismiss the
      // bottom sheet.
      if (!ref) {
        bottomSheet?.dismiss();
      }
    };
  }, [dismissAll, bottomSheetRef, ref, stackBehavior]);

  const content = useMemo(() => {
    if (disableBottomSheetContentContainer) {
      return children;
    }

    return (
      <BottomSheetContentContainer style={contentContainerStyle}>
        {children}
      </BottomSheetContentContainer>
    );
  }, [disableBottomSheetContentContainer, children, contentContainerStyle]);

  return (
    <BottomSheetModal
      {...rest}
      ref={bottomSheetRef}
      enableDismissOnClose
      enableDynamicSizing={rest.enableDynamicSizing ?? true}
      {...(props.backdropComponent
        ? { backdropComponent: props.backdropComponent }
        : {})}
      containerComponent={containerComponent}
      stackBehavior={stackBehavior}
    >
      {content}
    </BottomSheetModal>
  );
});

AutoDisplayingBottomSheetModal.displayName = 'AutoDisplayingBottomSheetModal';

export { AutoDisplayingBottomSheetModal };
