import { ApiUser } from 'farcaster-client-data';

import { useCurrentUser } from '~/hooks/data/useCurrentUser';

const useOtherParticipants = ({
  participants,
}: {
  participants: ApiUser[];
}) => {
  const currentUser = useCurrentUser();

  return participants.filter(
    (participant) => participant.fid !== currentUser.fid,
  );
};

export { useOtherParticipants };
