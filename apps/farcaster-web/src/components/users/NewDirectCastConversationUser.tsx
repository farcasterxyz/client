import { KebabHorizontalIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiUser } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import React, {
  JSXElementConstructor,
  ReactElement,
  useCallback,
  useRef,
  useState,
} from 'react';

import { Avatar } from '~/components/avatar/Avatar';
import { FarcasterProBadge } from '~/components/badges/FarcasterProBadge';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultPopoverContainer } from '~/components/popovers/DefaultPopoverContainer';
import { MenuItem } from '~/components/popovers/MenuItem';
import { Popover } from '~/components/popovers/Popover';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { trackError } from '~/utils/errorUtils';

type NewDirectCastConversationUserProps = {
  user: ApiUser;
  onUserClickCallback: (action: string) => void;

  actions?: {
    title: string;
    action: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: ReactElement<any, string | JSXElementConstructor<any>>;
  }[];
  note?: string;
  isLoading?: boolean;
  disabled?: boolean;
};

const NewDirectCastConversationUser: React.FC<NewDirectCastConversationUserProps> =
  React.memo(
    ({ user, onUserClickCallback, actions, note, disabled = false }) => {
      const [isInitializingConversation, setIsInitializingConversation] =
        useState(false);

      const triggerRef = useRef<HTMLDivElement>(null);
      const [open, setOpen] = useState<boolean>(false);

      const canDC =
        typeof user.viewerContext?.canSendDirectCasts === 'undefined' ||
        user.viewerContext?.canSendDirectCasts === true;

      const onPopoverTriggerClick = useCallback(
        (e: React.SyntheticEvent<HTMLDivElement>) => {
          if (disabled) {
            return;
          }
          e.stopPropagation();
          setOpen(true);
        },
        [disabled],
      );

      const onUserClick = useCallback(
        (action: string) => async (e: React.SyntheticEvent) => {
          e.stopPropagation();

          if (!canDC) {
            return;
          }

          setIsInitializingConversation(true);

          try {
            onUserClickCallback(action);
          } catch (error) {
            trackError(error);
          } finally {
            setIsInitializingConversation(false);
          }
        },
        [onUserClickCallback, canDC],
      );

      const isProUser = useUserLevel(user) === 'pro';

      return (
        <div
          className={cn(
            'relative flex flex-row py-2 pl-[12px]',
            !isInitializingConversation &&
              canDC &&
              'cursor-pointer hover:bg-overlay-faint',
            (!canDC || disabled) && 'pointer-events-none opacity-50',
          )}
          onClick={(e) => {
            if (!actions && !isInitializingConversation && !disabled) {
              onUserClick('default')(e);
            }
          }}
        >
          <div
            className={cn(
              'flex grow flex-col pr-2',
              (isInitializingConversation || !canDC || disabled) &&
                'opacity-50',
            )}
          >
            <div className="flex flex-row items-center">
              <Avatar user={user} className="mr-2" withDetailsPopover={true} />
              <div className="min-w-0 truncate break-words text-base font-semibold text-default">
                <span className="flex flex-row items-center gap-[2px]">
                  {resolveUsernameShort({
                    username: user.username,
                    fid: user.fid,
                  })}
                  {isProUser && (
                    <FarcasterProBadge size={20} className="mb-px" />
                  )}
                </span>
                {!canDC && ' cannot be messaged.'}
              </div>
            </div>
          </div>
          {isInitializingConversation && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <LoadingIndicator />
            </div>
          )}
          {note && (
            <span className="flex flex-col justify-center text-faint">
              {note}
            </span>
          )}
          {actions !== undefined && (
            <>
              <div className="ml-2 flex flex-col justify-center">
                <div
                  ref={triggerRef}
                  className="h-6 cursor-pointer rounded-full px-1 text-muted hover:bg-overlay-faint hover:text-action-purple"
                  onClick={onPopoverTriggerClick}
                >
                  <KebabHorizontalIcon />
                </div>
              </div>
              {open && (
                <Popover>
                  <DefaultPopoverContainer
                    onClose={() => setOpen(false)}
                    style={{
                      top: triggerRef.current?.getBoundingClientRect().bottom,
                      left: triggerRef.current?.getBoundingClientRect().right,
                    }}
                  >
                    <div
                      className={cn(
                        '-ml-48 flex w-48 flex-col rounded-md border p-1 shadow-lg bg-app border-default',
                      )}
                    >
                      {actions?.map((a) => {
                        return (
                          <div
                            key={'new-dc-user-action-' + user.fid + '-' + a}
                            className="ml-2 flex flex-col items-center justify-center"
                          >
                            <MenuItem
                              icon={a.icon ?? <></>}
                              onClick={(e) => onUserClick(a.action)(e)}
                              name={a.title}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </DefaultPopoverContainer>
                </Popover>
              )}
            </>
          )}
        </div>
      );
    },
  );

NewDirectCastConversationUser.displayName = 'NewDirectCastConversationUser';

export { NewDirectCastConversationUser };
