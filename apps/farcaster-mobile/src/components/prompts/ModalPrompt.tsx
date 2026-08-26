import { BottomSheetProps } from '@gorhom/bottom-sheet';
import React, {
  FC,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { PromptInfo } from '~/types';
import { getPromptInfo, setPromptInfo } from '~/utils/PromptUtils';

type PromptProps = {
  children: ReactNode;
  name: string;
  height: number | string;
  storageKey: string;
  shouldPresent: (info: PromptInfo) => boolean;
  snapPoints?: BottomSheetProps['snapPoints'];
  enableTouchThrough?: boolean;
  enablePanDownToClose?: boolean;
  onBackdropPress?: () => void;
  onCloseCallback?: () => void;
  onAfterPromptCleanup?: () => void;
  withExtraShadow?: boolean;
  enableDynamicSizing?: boolean;
  disableOverDrag?: boolean;
};

const ModalPrompt: FC<PromptProps> = memo(
  ({
    children,
    name,
    height,
    shouldPresent,
    storageKey,
    enablePanDownToClose = true,
    onCloseCallback,
    onAfterPromptCleanup,
    enableDynamicSizing = false,
    disableOverDrag = false,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useBottomSheetModalRef();

    const [hasPresentedThisSession, setHasPresentedThisSession] =
      useState(false);

    const onClose = useCallback(() => {
      // FIXME: Order of this callback matters. Since this call is followed by
      // local state and ref updates, it results in re-renders and causes some odd
      // double render behavior. One option here is if its defined, never calling
      // local state updates, but going with utilizing this as a callback instead.
      // Meaning: local updates continue to occur, parent components use it as a signal.
      if (typeof onCloseCallback === 'function') {
        onCloseCallback();
      }

      setIsVisible(false);

      if (typeof onAfterPromptCleanup === 'function') {
        onAfterPromptCleanup();
      }
    }, [onCloseCallback, onAfterPromptCleanup]);

    useEffect(() => {
      getPromptInfo({ storageKey }).then(
        ({ hasOptedOut, lastPresentedAt = 0, presentedCount = 0 }) => {
          if (
            !isVisible &&
            !hasOptedOut &&
            shouldPresent({
              hasOptedOut,
              hasPresentedThisSession,
              lastPresentedAt: lastPresentedAt,
              presentedCount: presentedCount,
            })
          ) {
            setIsVisible(true);
            setHasPresentedThisSession(true);

            setPromptInfo({
              storageKey,
              info: {
                hasPresentedThisSession: true,
                lastPresentedAt: Date.now(),
                presentedCount: presentedCount + 1,
              },
            });
          }
        },
      );
    }, [
      hasPresentedThisSession,
      isVisible,
      shouldPresent,
      modalRef,
      storageKey,
    ]);

    useEffect(() => {
      if (isVisible) {
        const stableModalRef = modalRef.current;
        stableModalRef?.present();

        return () => {
          stableModalRef?.dismiss();
        };
      }
    }, [isVisible, modalRef]);

    return (
      <BottomSheetModal
        name={name}
        ref={modalRef}
        enableOverDrag={disableOverDrag ? false : true}
        snapPoints={enableDynamicSizing ? undefined : [height]}
        enableDynamicSizing={enableDynamicSizing}
        onDismiss={onClose}
        enablePanDownToClose={enablePanDownToClose}
        enableContentPanningGesture={enablePanDownToClose}
      >
        {children}
      </BottomSheetModal>
    );
  },
);

ModalPrompt.displayName = 'ModalPrompt';

export { ModalPrompt };
