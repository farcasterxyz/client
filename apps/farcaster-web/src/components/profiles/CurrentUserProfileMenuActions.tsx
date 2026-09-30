import {
  InfoIcon,
  KebabHorizontalIcon,
  NorthStarIcon,
  PencilIcon,
  ShareIcon,
} from '@primer/octicons-react';
import classNames from 'classnames';
import { ApiUser, ApiUserProfile } from 'farcaster-client-data';
import { useCallback, useRef, useState } from 'react';

import { UserExtrasModal } from '~/components/modals/UserExtrasModal';
import { DefaultPopoverContainer } from '~/components/popovers/DefaultPopoverContainer';
import { Popover } from '~/components/popovers/Popover';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useNavigateToAdminEngagementRingCandidates } from '~/hooks/navigation/useNavigateToAdminEngagementRingCandidates';

import { EditProfileModal } from './EditProfileModal';

interface CurrentUserProfileMenuActionsProps {
  user: ApiUser;
  userProfile: ApiUserProfile;
}

const CurrentUserProfileMenuActions: React.FC<
  CurrentUserProfileMenuActionsProps
> = ({ user, userProfile }) => {
  const isAdmin = useIsAdmin();
  const navigateToAdminEngagementRingCandidates =
    useNavigateToAdminEngagementRingCandidates();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [userExtrasModalVisible, setUserExtrasModalVisible] =
    useState<boolean>();
  const [editProfileModalVisible, setEditProfileModalVisible] =
    useState<boolean>(false);

  const onPopoverTriggerClick = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation();
    setOpen(true);
  }, []);

  const copyProfileURI = useCallback(
    (e: React.SyntheticEvent) => {
      e.stopPropagation();

      const profileUri = user.username
        ? `https://farcaster.xyz/${user.username}`
        : `https://farcaster.xyz/~/profiles/${user.fid}`;

      navigator.clipboard.writeText(profileUri);

      setOpen(false);
    },
    [user.fid, user.username],
  );

  const viewUserExtrasClicked = useCallback(() => {
    setOpen(false);
    setUserExtrasModalVisible(true);
  }, []);

  const editProfileClicked = useCallback(() => {
    setOpen(false);
    setEditProfileModalVisible(true);
  }, []);

  const investigateRingClicked = useCallback(() => {
    setOpen(false);
    navigateToAdminEngagementRingCandidates({ fid: user.fid });
  }, [navigateToAdminEngagementRingCandidates, user.fid]);

  return (
    <div className="flex shrink-0 flex-row space-x-2">
      <div ref={triggerRef}>
        <div
          onClick={onPopoverTriggerClick}
          className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-none text-default hover:bg-overlay-faint"
        >
          <KebabHorizontalIcon size={16} className="mt-0.5" />
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
              className={classNames(
                '-ml-52 flex w-52 flex-col rounded-md border p-1 shadow-lg bg-app border-default',
              )}
            >
              <span
                className="flex w-full flex-row items-center justify-start p-2 align-middle text-sm text-muted hover:cursor-pointer hover:bg-overlay-faint"
                onClick={editProfileClicked}
              >
                <PencilIcon size="small" />
                <span className="ml-2 text-sm">Edit Profile</span>
              </span>
              <span
                className="flex w-full flex-row items-center justify-start p-2 align-middle text-sm text-muted hover:cursor-pointer hover:bg-overlay-faint"
                onClick={copyProfileURI}
              >
                <ShareIcon size="small" />
                <span className="ml-2 text-sm">Copy link to profile</span>
              </span>
              <span
                className="flex w-full flex-row items-center justify-start p-2 align-middle text-sm text-muted hover:cursor-pointer hover:bg-overlay-faint"
                onClick={viewUserExtrasClicked}
              >
                <InfoIcon size="small" />
                <span className="ml-2 text-sm">About</span>
              </span>
              {isAdmin && (
                <span
                  className="flex w-full flex-row items-center justify-start p-2 align-middle text-sm text-muted hover:cursor-pointer hover:bg-overlay-faint"
                  onClick={investigateRingClicked}
                >
                  <NorthStarIcon size="small" />
                  <span className="ml-2 text-sm">Investigate ring</span>
                </span>
              )}
            </div>
          </DefaultPopoverContainer>
        </Popover>
      )}
      {userExtrasModalVisible && (
        <UserExtrasModal
          userProfile={userProfile}
          onCancel={() => {
            setUserExtrasModalVisible(false);
          }}
        />
      )}
      {editProfileModalVisible && (
        <EditProfileModal
          onClose={() => {
            setEditProfileModalVisible(false);
          }}
        />
      )}
    </div>
  );
};

CurrentUserProfileMenuActions.displayName = 'CurrentUserProfileMenuActions';

export { CurrentUserProfileMenuActions };
