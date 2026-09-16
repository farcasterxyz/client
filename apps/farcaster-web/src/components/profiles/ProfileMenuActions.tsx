import {
  InfoIcon,
  KebabHorizontalIcon,
  NorthStarIcon,
  ReportIcon,
  ShareIcon,
} from '@primer/octicons-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ApiUser, ApiUserProfile } from 'farcaster-client-data';
import { useCallback, useState } from 'react';

import { DropdownMenuItem } from '~/components/dropdownMenu/DropdownMenuItem';
import { ReportUserModal } from '~/components/modals/ReportUserModal';
import { UserExtrasModal } from '~/components/modals/UserExtrasModal';
import { UserVisibilityActions } from '~/components/popovers/UserVisibilityActions';
import { useCachedCurrentUser } from '~/hooks/data/useCachedCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { useNavigateToAdminEngagementRingCandidates } from '~/hooks/navigation/useNavigateToAdminEngagementRingCandidates';

interface ProfileMenuActionsProps {
  user: ApiUser;
  userProfile: ApiUserProfile;
}

const ProfileMenuActions: React.FC<ProfileMenuActionsProps> = ({
  user,
  userProfile,
}) => {
  const currentUserFid = useCachedCurrentUser()?.fid;
  const isAdmin = useIsAdmin();
  const navigateToAdminEngagementRingCandidates =
    useNavigateToAdminEngagementRingCandidates();

  const [reportUserReasonModalVisible, setReportUserModalVisible] =
    useState<boolean>(false);
  const [userExtrasModalVisible, setUserExtrasModalVisible] =
    useState<boolean>();

  const copyProfileURI = useCallback(
    (e: Event) => {
      e.stopPropagation();

      const profileUri = user.username
        ? `https://farcaster.xyz/${user.username}`
        : `https://farcaster.xyz/~/profiles/${user.fid}`;

      navigator.clipboard.writeText(profileUri);
    },
    [user.fid, user.username],
  );

  const reportUserClicked = useCallback(() => {
    setReportUserModalVisible(true);
  }, []);

  const viewUserExtrasClicked = useCallback(() => {
    setUserExtrasModalVisible(true);
  }, []);

  const investigateRingClicked = useCallback(() => {
    navigateToAdminEngagementRingCandidates({ fid: user.fid });
  }, [navigateToAdminEngagementRingCandidates, user.fid]);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger onClick={(e) => e.stopPropagation()} asChild>
          <div className="flex size-[34px] cursor-pointer items-center justify-center rounded-full border-default text-default hover:bg-overlay-faint">
            <KebabHorizontalIcon size={16} className="mt-0.5" />
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={4}
          className="outline-hidden z-20 w-52 rounded-md border p-1 shadow-lg bg-app border-default"
          onClick={(e) => e.stopPropagation()}
          // On close Dropdown trigger gets a focus making it work a bit wierd, disabling it for now.
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem
            name="Copy link to profile"
            icon={<ShareIcon size={16} />}
            onSelect={copyProfileURI}
          />
          <DropdownMenuItem
            name="About"
            icon={<InfoIcon size={16} />}
            onSelect={viewUserExtrasClicked}
          />
          {isAdmin && (
            <DropdownMenuItem
              name="Investigate ring"
              icon={<NorthStarIcon size={16} />}
              onSelect={investigateRingClicked}
            />
          )}
          <UserVisibilityActions user={user} source="profile" />
          {currentUserFid !== user.fid && (
            <DropdownMenuItem
              name="Report user"
              icon={<ReportIcon size={16} />}
              onSelect={reportUserClicked}
            />
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      {reportUserReasonModalVisible && (
        <ReportUserModal
          targetUser={user}
          onClose={() => {
            setReportUserModalVisible(false);
          }}
        />
      )}
      {userExtrasModalVisible && (
        <UserExtrasModal
          userProfile={userProfile}
          onCancel={() => {
            setUserExtrasModalVisible(false);
          }}
        />
      )}
    </>
  );
};

ProfileMenuActions.displayName = 'ProfileMenuActions';

export { ProfileMenuActions };
