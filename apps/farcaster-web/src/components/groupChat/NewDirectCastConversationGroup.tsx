import cn from 'classnames';
import type { ApiDirectCastConversationInfoV3 } from 'farcaster-client-data';
import React, { useCallback, useState } from 'react';

import { GroupConversationImage } from '~/components/directCasts/GroupConversationImage';
import { trackError } from '~/utils/errorUtils';

interface NewDirectCastConversationGroupProps {
  group: ApiDirectCastConversationInfoV3;
  onGroupClickCallback: () => void;
  disabled?: boolean;
}

const NewDirectCastConversationGroup: React.FC<NewDirectCastConversationGroupProps> =
  React.memo(({ group, onGroupClickCallback, disabled = false }) => {
    const [isInitializingConversation, setIsInitializingConversation] =
      useState(false);

    const onGroupClick = useCallback(
      (e: React.SyntheticEvent) => {
        e.stopPropagation();
        setIsInitializingConversation(true);

        try {
          onGroupClickCallback();
        } catch (error) {
          trackError(error);
        } finally {
          setIsInitializingConversation(false);
        }
      },
      [onGroupClickCallback],
    );

    return (
      <div
        className={cn(
          'relative flex cursor-pointer flex-row py-2 pl-[12px] hover:bg-overlay-faint',
          (isInitializingConversation || disabled) &&
            'pointer-events-none opacity-50',
        )}
        onClick={(e) => {
          if (!isInitializingConversation && !disabled) {
            onGroupClick(e);
          }
        }}
      >
        <div
          className={cn(
            'flex grow flex-col pr-2',
            (isInitializingConversation || disabled) && 'opacity-10',
          )}
        >
          <div className="flex flex-row">
            <GroupConversationImage
              imageURL={group.photoUrl}
              size="md"
              className="mr-2"
            />
            <div className="flex flex-col">
              <div className="flex min-w-0 flex-row items-center">
                {group.name && (
                  <span className="block min-w-0 truncate break-words text-base font-semibold text-default hover:underline">
                    {group.name}
                  </span>
                )}
              </div>
              <div className="flex flex-row items-baseline">
                <div className="mr-1 text-sm text-muted">
                  {group.activeParticipantsCount} members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

export { NewDirectCastConversationGroup };
