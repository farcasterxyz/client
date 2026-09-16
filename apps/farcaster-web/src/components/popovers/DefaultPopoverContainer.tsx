import { FC, memo, ReactNode, Suspense, useEffect } from 'react';

import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { useGlobalKeyPress } from '~/contexts/GlobalKeyPressProvider';

type DefaultPopoverContainerProps = {
  children: ReactNode;
  onClose: () => void;
  style: React.CSSProperties | undefined;
};

const DefaultPopoverContainer: FC<DefaultPopoverContainerProps> = memo(
  ({ children, onClose, style }) => {
    const { addKeyPressListener } = useGlobalKeyPress();

    useEffect(() => {
      const unsubscribe = addKeyPressListener((e) => {
        if (e.code === 'Escape') {
          onClose();
        }
      });

      return unsubscribe;
    }, [addKeyPressListener, onClose]);

    return (
      <Suspense fallback={<FullScreenLoadingIndicator />}>
        <div
          // z-index needed due to certain feed items with z-index. (i.e. Show more... user avatars)
          className="fixed inset-0 z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
        >
          <div className="absolute inset-0" style={style}>
            {children}
          </div>
        </div>
      </Suspense>
    );
  },
);

DefaultPopoverContainer.displayName = 'DefaultPopoverContainer';

export { DefaultPopoverContainer };
