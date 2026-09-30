import { LocationIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import React from 'react';

import { LinkToLocationUsers } from '~/components/links/LinkToLocationUsers';
import { EditProfileModal } from '~/components/profiles/EditProfileModal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { hasProfileLocation } from '~/utils/profile';

type ProfileLocationSectionProps = {
  user: ApiUser;
};

const LocationDescriptionRegex = /^(.*?),.*?, (.*?)$/;

const ProfileLocationSection: React.FC<ProfileLocationSectionProps> = ({
  user,
}) => {
  const { fid: currentUserFid } = useCurrentUser();
  const location = user.profile?.location;
  const isValidLocation = hasProfileLocation(location);

  if (currentUserFid !== user.fid && !isValidLocation) {
    return null;
  }

  return (
    <React.Suspense fallback={<div className="h-[28px]" />}>
      {currentUserFid === user.fid ? (
        <ProfileLocationSelf user={user} />
      ) : (
        <ProfileLocation user={user} />
      )}
    </React.Suspense>
  );
};

ProfileLocationSection.displayName = 'ProfileLocationSection';

const ProfileLocationSelf: React.FC<ProfileLocationSectionProps> = ({
  user,
}) => {
  const [editProfileModalVisible, setEditProfileModalVisible] =
    React.useState(false);
  const location = user.profile?.location;
  const isValidLocation = hasProfileLocation(location);

  const formattedLocationString = React.useMemo(() => {
    if (!isValidLocation || !location) {
      return '';
    }
    return location.description.replace(LocationDescriptionRegex, '$1, $2');
  }, [location, isValidLocation]);

  const onLocationClick = React.useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setEditProfileModalVisible(true);
  }, []);

  return (
    <>
      <div
        className="flex w-max flex-row items-center space-x-1 rounded-full border px-[6px] py-[3px] text-sm text-muted bg-elevated border-default hover:cursor-pointer"
        onClick={onLocationClick}
      >
        <LocationIcon size={14} className="text-muted" />
        <div className="max-w-[150px] truncate">
          {!isValidLocation ? 'Add location' : formattedLocationString}
        </div>
      </div>
      {editProfileModalVisible && (
        <EditProfileModal
          onClose={() => setEditProfileModalVisible(false)}
          initialFocus="location"
        />
      )}
    </>
  );
};

ProfileLocationSelf.displayName = 'ProfileLocationSelf';

const ProfileLocation: React.FC<ProfileLocationSectionProps> = ({ user }) => {
  const { trackEvent } = useAnalytics();
  const location = user.profile?.location;
  const isValidLocation = hasProfileLocation(location);

  if (!isValidLocation || !location) {
    return null;
  }

  const formattedLocationString = location.description.replace(
    LocationDescriptionRegex,
    '$1, $2',
  );

  return (
    <LinkToLocationUsers
      title={`Users near ${formattedLocationString}`}
      params={{ placeId: location.placeId }}
      className="-mt-0.5 flex flex-row items-center justify-start align-middle text-muted hover:underline"
      onClick={() => {
        trackEvent(AnalyticsEvent.ClickLocation, {
          locationDescription: formattedLocationString,
        });
      }}
    >
      <LocationIcon size={14} className="text-muted" />
      <span className="ml-1 line-clamp-1 max-w-[300px] pt-0.5 text-sm text-muted">
        {formattedLocationString}
      </span>
    </LinkToLocationUsers>
  );
};

ProfileLocation.displayName = 'ProfileLocation';

export { ProfileLocationSection };
