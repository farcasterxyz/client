import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { ConversationParticipant } from '~/types';

const useDirectCastsCounterParty = ({
  participants,
}: {
  participants: ConversationParticipant[];
}) => {
  const currentUser = useCurrentUser_UNSAFE();

  return participants.find(
    (participant) => participant.fid !== currentUser.fid,
  );
};

export { useDirectCastsCounterParty };
