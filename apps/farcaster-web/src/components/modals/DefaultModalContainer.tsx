import React from 'react';

import { useGlobalKeyPress } from '~/contexts/GlobalKeyPressProvider';

type DefaultModalContainerProps = {
  children: React.ReactNode;
  onClose: (e?: React.SyntheticEvent<HTMLDivElement>) => void;
  registerMouseMoveCaptures?: boolean;
  avoidRegisteringKeyPressListeners?: boolean;
  className?: string;
};

const DefaultModalContainer: React.FC<DefaultModalContainerProps> = React.memo(
  ({
    children,
    onClose,
    registerMouseMoveCaptures = false,
    avoidRegisteringKeyPressListeners = false,
    className = 'fixed inset-0 z-10 bg-overlay',
  }) => {
    const { addKeyPressListener } = useGlobalKeyPress();

    const [startCheckingMove, setStartCheckingMove] =
      React.useState<boolean>(false);
    const [skipCloseCallback, setSkipCloseCallback] =
      React.useState<boolean>(false);

    const onOverlayMouseDown = React.useCallback(() => {
      if (registerMouseMoveCaptures) {
        setStartCheckingMove(true);
        setSkipCloseCallback(false);
      }
    }, [registerMouseMoveCaptures]);

    const onOverlayMouseMove = React.useCallback(() => {
      if (registerMouseMoveCaptures && startCheckingMove) {
        setSkipCloseCallback(true);
        setStartCheckingMove(false);
      }
    }, [registerMouseMoveCaptures, startCheckingMove]);

    React.useEffect(() => {
      const unsubscribe = addKeyPressListener((e) => {
        if (!avoidRegisteringKeyPressListeners) {
          if (e.code === 'Escape') {
            onClose();
          }
        }
      });

      return () => {
        unsubscribe();

        setSkipCloseCallback(false);
        setStartCheckingMove(false);
      };
    }, [addKeyPressListener, avoidRegisteringKeyPressListeners, onClose]);

    return (
      <div
        className={className}
        onClick={(e) => {
          if (registerMouseMoveCaptures) {
            if (!skipCloseCallback) {
              e.preventDefault();
              e.stopPropagation();

              onClose(e);
            }

            setSkipCloseCallback(false);
            setStartCheckingMove(false);
          } else {
            e.preventDefault();
            e.stopPropagation();

            onClose(e);
          }
        }}
        onMouseDownCapture={onOverlayMouseDown}
        onMouseMoveCapture={onOverlayMouseMove}
      >
        <div className="absolute inset-0">{children}</div>
      </div>
    );
  },
);

DefaultModalContainer.displayName = 'DefaultModalContainer';

export { DefaultModalContainer };
