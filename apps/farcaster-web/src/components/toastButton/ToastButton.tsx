import { Icon } from '@primer/octicons-react';
import { keyframes } from 'goober';
import { FC, memo } from 'react';
import { resolveValue, Toast, Toaster } from 'react-hot-toast';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';

const keyframesIn = `
  0%   { transform: translate3d(0, -100%, 0); opacity: 0; }
  100% { transform: translate3d(0, 0,     0); opacity: 1; }
`;

const keyframesOut = `
  0%   { transform: translate3d(0, 0,     0); opacity: 1; }
  100% { transform: translate3d(0, -100%, 0); opacity: 0; }
`;

const animationIn: React.CSSProperties = {
  animation: `${keyframes(
    keyframesIn,
  )} 0.35s cubic-bezier(.06, .71, .55, 1) forwards`,
};

const animationOut: React.CSSProperties = {
  animation: `${keyframes(
    keyframesOut,
  )} 0.35s cubic-bezier(.06, .71, .55, 1) forwards`,
};

interface ToastButtonProps {
  IconComponent?: Icon;
  duration: number;
  onClick: () => void;
  topDistance?: number;
}

const ToastButton: FC<ToastButtonProps> = memo(
  ({ IconComponent, duration, onClick, topDistance = 16 }) => {
    return (
      <Toaster
        toastOptions={{ duration }}
        containerStyle={{
          // These 2 need to be styles in order to override styles already directly set
          position: 'sticky',
          top: topDistance,
          zIndex: 7, // New cast modal is 10 and this nees to be lower, but subtle-hover-z (used on embed links) is 5 and this needs to higher
        }}
      >
        {(t: Toast) => (
          <DefaultButton
            size="sm"
            // Need to make the paddings important because the button also declares them and we have no control
            // over how Tailwind orders the definitions. When developing this, py-1 was after py-2 so our declaration
            // here was overridden
            className="flex flex-row items-center gap-2 !py-2 !pl-3 !pr-4 text-xs font-normal"
            style={{ ...(t.visible ? animationIn : animationOut) }}
            onClick={() => onClick()}
          >
            {IconComponent && <IconComponent size="small" />}
            {resolveValue(t.message, t)}
          </DefaultButton>
        )}
      </Toaster>
    );
  },
);

ToastButton.displayName = 'ToastButton';

export { ToastButton };
