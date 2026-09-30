import { ApiAudioRoomState } from 'farcaster-client-data';
import { useEndAudioRoom } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';

import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { toast as appToast } from '~/utils/toast';

type Props = {
  roomId: string;
  roomState: ApiAudioRoomState;
  onEnded?: () => Promise<void> | void;
  disabled?: boolean;
  stopPropagation?: boolean;
  className?: string;
};

const AdminEndSpaceButton: React.FC<Props> = React.memo(
  ({
    roomId,
    roomState,
    onEnded,
    disabled = false,
    stopPropagation = true,
    className = '',
  }) => {
    const isAdmin = useIsAdmin();
    const endAudioRoom = useEndAudioRoom();
    const [isEnding, setIsEnding] = useState(false);

    const actionLabel =
      roomState === 'scheduled' ? 'Admin Cancel' : 'Admin End';
    const actionProgressLabel =
      roomState === 'scheduled' ? 'Admin Cancelling...' : 'Admin Ending...';
    const actionVerb = roomState === 'scheduled' ? 'cancel' : 'end';
    const successMessage =
      roomState === 'scheduled' ? 'Space cancelled' : 'Space ended';
    const confirmMessage =
      roomState === 'scheduled'
        ? 'Cancel this scheduled Space?'
        : 'End this live Space for everyone?';

    const handleClick = useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
          event.stopPropagation();
        }

        if (disabled || isEnding) {
          return;
        }

        if (!window.confirm(confirmMessage)) {
          return;
        }

        setIsEnding(true);
        try {
          await endAudioRoom({ roomId });
          appToast({ message: successMessage, type: 'success' });
          try {
            await onEnded?.();
          } catch {
            // Callback failures should not override a successful end/cancel action.
          }
        } catch (err) {
          appToast({
            message:
              err instanceof Error
                ? err.message
                : `Failed to ${actionVerb} Space`,
            type: 'error',
          });
        } finally {
          setIsEnding(false);
        }
      },
      [
        actionVerb,
        confirmMessage,
        disabled,
        endAudioRoom,
        isEnding,
        onEnded,
        roomId,
        stopPropagation,
        successMessage,
      ],
    );

    if (!isAdmin || roomState === 'ended') {
      return null;
    }

    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isEnding}
        className={`inline-flex items-center justify-center rounded-full border px-3 py-1.5 text-[13px] font-semibold text-red-600 border-faint hover:bg-red-500/10 disabled:opacity-50 ${className}`}
      >
        {isEnding ? actionProgressLabel : actionLabel}
      </button>
    );
  },
);

AdminEndSpaceButton.displayName = 'AdminEndSpaceButton';

export { AdminEndSpaceButton };
