import { Dialog } from '@headlessui/react';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  useMarkInvisible,
  useTrackEvent,
} from 'farcaster-client-hooks';
import React, { ReactNode, useCallback, useRef, useState } from 'react';

import { DialogBackdrop, DialogPanelContainer } from '~/components/Dialog';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type MuteUserParams = {
  targetFid: number;
  username: string;
  source: 'direct-cast-request' | 'cast' | 'profile';
  block?: boolean;
};

export type MuteUserContextValue = {
  muteUser: (params: MuteUserParams) => Promise<{ muted: boolean }>;
};

const MuteUserContext = React.createContext<MuteUserContextValue>({
  muteUser: async () => {
    throw new Error('Must be called in MuteUserContext provider');
  },
});

export const useMuteUser = () => React.useContext(MuteUserContext);

export function MuteUserProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<MuteUserParams | null>(null);
  const resolveRef = useRef<(value: { muted: boolean }) => void>(undefined);

  const muteUser = useCallback(async (params: MuteUserParams) => {
    setParams(params);
    return new Promise<{ muted: boolean }>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleMute = () => {
    if (resolveRef.current) {
      resolveRef.current({ muted: true });
      resolveRef.current = undefined;
    }

    setParams(null);
  };

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current({ muted: false });
      resolveRef.current = undefined;
    }

    setParams(null);
  };

  return (
    <MuteUserContext.Provider value={{ muteUser }}>
      {children}
      {params && (
        <MuteUserDialog
          {...params}
          onMute={handleMute}
          onCancel={handleCancel}
        />
      )}
    </MuteUserContext.Provider>
  );
}

function MuteUserDialog({
  targetFid,
  username,
  source,
  block,
  onMute,
  onCancel,
}: MuteUserParams & {
  onMute: () => void;
  onCancel: () => void;
}) {
  const user = useCurrentUser();
  const markInvisible = useMarkInvisible();
  const [submitting, setSubmitting] = useState(false);
  const { trackEvent } = useTrackEvent();

  const mute = async () => {
    try {
      setSubmitting(true);
      await markInvisible({
        targetFid,
        viewerFid: user.fid,
        block: block ?? false,
      });
      if (block) {
        trackEvent(AnalyticsEvent.ClickBlock, {
          source,
        });
      } else {
        trackEvent(AnalyticsEvent.ClickMute, {
          source,
        });
      }
      onMute();
      toast({
        message: `${username} ${block ? 'blocked' : 'muted'}`,
        type: 'success',
      });
    } catch (e) {
      trackError(e);
      toast({
        message: `Failed to ${block ? 'block' : 'mute'} ${username}`,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onCancel} className="relative z-50" static>
      <DialogBackdrop />
      <DialogPanelContainer>
        <Dialog.Panel className="w-full max-w-[387px] rounded-lg border p-4 bg-app border-default">
          <Dialog.Title className="mb-4 flex items-center text-xl font-medium text-default">
            {block ? 'Block' : 'Mute'} {username}?
          </Dialog.Title>
          <Dialog.Description>
            {block ? (
              <>
                They won't appear in your feed and won't be able to reply, quote
                or mention you.{' '}
                <ExternalLink
                  href={getNotionLinkTarget({ to: 'user-blocking' })}
                  title="Learn more"
                  className="outline-hidden"
                >
                  Learn more
                </ExternalLink>
                .
              </>
            ) : (
              "They won't appear in your feed."
            )}
          </Dialog.Description>
          <div className="mt-4 grid grid-cols-2 gap-[11px]">
            <DefaultButton
              onClick={onCancel}
              variant="secondary"
              disabled={submitting}
            >
              Cancel
            </DefaultButton>
            <DefaultButton
              onClick={mute}
              variant="danger"
              disabled={submitting}
            >
              {block ? 'Block' : 'Mute'}
            </DefaultButton>
          </div>
        </Dialog.Panel>
      </DialogPanelContainer>
    </Dialog>
  );
}
