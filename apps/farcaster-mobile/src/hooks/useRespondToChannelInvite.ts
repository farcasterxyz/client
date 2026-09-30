import { ApiChannelUserInviteRole } from 'farcaster-client-data';
import {
  useRespondToChannelInvite as useRespondToChannelInviteMutation,
  useTrackEvent,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import { useCallback } from 'react';

import { trackError } from '~/utils/ErrorUtils';

type RespondParams = {
  channelKey: string;
  role: ApiChannelUserInviteRole;
  location: 'channel page' | 'invite notification';
};

export const useRespondToChannelInvite = () => {
  const toast = useRootToast();
  const { trackEvent } = useTrackEvent();
  const respondToChannelInvite = useRespondToChannelInviteMutation();

  const accept = useCallback(
    async ({ channelKey, role, location }: RespondParams) => {
      try {
        trackEvent({
          name: 'respond to channel invite',
          props: {
            accept: true,
            role,
            location,
          },
        });

        await respondToChannelInvite({
          channelKey,
          role,
          accept: true,
        });
      } catch (e) {
        trackError(new Error('Failed to accept channel invite', { cause: e }));
        toast.show('Failed, try again.', { type: 'danger' });
      }
    },
    [trackEvent, respondToChannelInvite, toast],
  );

  const decline = useCallback(
    async ({ channelKey, location, role }: RespondParams) => {
      try {
        trackEvent({
          name: 'respond to channel invite',
          props: {
            accept: false,
            role,
            location,
          },
        });

        await respondToChannelInvite({
          channelKey,
          role,
          accept: false,
        });
      } catch (e) {
        trackError(new Error('Failed to decline channel invite', { cause: e }));
        toast.show('Failed, try again.', { type: 'danger' });
      }
    },
    [trackEvent, respondToChannelInvite, toast],
  );

  return {
    accept,
    decline,
  };
};
