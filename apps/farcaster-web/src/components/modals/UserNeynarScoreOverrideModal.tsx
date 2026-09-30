import { RadioGroup } from '@headlessui/react';
import cn from 'classnames';
import { resolveUsername } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Textarea } from '~/components/forms/Textarea';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import {
  formatNeynarScore,
  type UserProfileWithNeynarScoreInfo,
} from '~/components/profiles/neynarScoreUtils';
import { useSetNeynarScoreOverride } from '~/hooks/data/useSetNeynarScoreOverride';
import { trackError } from '~/utils/errorUtils';

type UserNeynarScoreOverrideModalProps = {
  onCancel: () => void;
  userProfile: UserProfileWithNeynarScoreInfo;
};

const SCORE_OPTIONS = [
  {
    score: 0.9,
    description: 'clear value-add with original, substantive content',
  },
  {
    score: 0.7,
    description: 'authentic activity but mid quality or mini-app focus',
  },
  {
    score: 0.5,
    description: 'dormant or mixed signals',
  },
  {
    score: 0.3,
    description: 'primarily engagement farming, rings, or airdrop hunting',
  },
  {
    score: 0.1,
    description: 'inauthentic, purely extractive activity',
  },
] as const;

const UserNeynarScoreOverrideModal: React.FC<UserNeynarScoreOverrideModalProps> =
  React.memo(({ onCancel, userProfile }) => {
    const setNeynarScoreOverride = useSetNeynarScoreOverride();
    const [reason, setReason] = useState('');
    const [selectedScore, setSelectedScore] = useState<number | undefined>(
      SCORE_OPTIONS.find(
        (option) => option.score === userProfile.neynarScoreInfo?.overrideScore,
      )?.score,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
      return typeof selectedScore === 'number' && reason.trim().length > 0;
    }, [reason, selectedScore]);

    const submitOverride = useCallback(async () => {
      if (typeof selectedScore !== 'number' || reason.trim().length === 0) {
        return;
      }

      try {
        setIsSubmitting(true);
        await setNeynarScoreOverride({
          fid: userProfile.user.fid,
          username: userProfile.user.username,
          score: selectedScore,
          reason: reason.trim(),
        });
        onCancel();
      } catch (error) {
        trackError(error);
        alert('Error updating Neynar score override');
      } finally {
        setIsSubmitting(false);
      }
    }, [
      onCancel,
      reason,
      selectedScore,
      setNeynarScoreOverride,
      userProfile.user.fid,
      userProfile.user.username,
    ]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex h-auto w-[28rem] flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="mb-4 w-full text-center text-lg font-semibold">
                {resolveUsername({
                  username: userProfile.user.username,
                  fid: userProfile.user.fid,
                })}{' '}
                Neynar Score
              </div>
              <div className="flex w-full flex-col gap-4">
                <div className="rounded-lg border p-3 bg-overlay-faint border-default">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <ScoreInfoItem
                      label="Imported score"
                      value={formatNeynarScore(
                        userProfile.neynarScoreInfo?.originalScore,
                      )}
                    />
                    <ScoreInfoItem
                      label="Overridden score"
                      value={formatNeynarScore(
                        userProfile.neynarScoreInfo?.overrideScore,
                      )}
                    />
                    <ScoreInfoItem
                      label="Overridden by"
                      value={
                        typeof userProfile.neynarScoreInfo?.overriddenByFid ===
                        'number'
                          ? String(userProfile.neynarScoreInfo.overriddenByFid)
                          : 'n/a'
                      }
                    />
                    <ScoreInfoItem
                      label="Reason"
                      value={
                        userProfile.neynarScoreInfo?.overrideReason ?? 'n/a'
                      }
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-default">
                    Override score
                  </div>
                  <RadioGroup value={selectedScore} onChange={setSelectedScore}>
                    <div className="flex flex-col gap-2">
                      {SCORE_OPTIONS.map((option) => (
                        <RadioGroup.Option
                          key={option.score}
                          value={option.score}
                        >
                          {({ checked }) => (
                            <div
                              className={cn(
                                'flex cursor-pointer flex-row items-center rounded border px-3 py-2 text-sm',
                                checked ? 'border-highlight' : 'border-default',
                              )}
                            >
                              <div className="font-medium text-default">
                                {formatNeynarScore(option.score)}
                              </div>
                              <div className="ml-3 text-xs text-muted">
                                {option.description}
                              </div>
                            </div>
                          )}
                        </RadioGroup.Option>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-default">
                    Reason
                  </div>
                  <Textarea
                    rows={3}
                    value={reason}
                    hideResizeHandle
                    placeholder="Explain why this override is being applied."
                    onChange={(e) => {
                      setReason(e.target.value);
                    }}
                  />
                </div>

                <DefaultButton
                  className="w-full"
                  disabled={!canSubmit}
                  isLoading={isSubmitting}
                  onClick={() => {
                    void submitOverride();
                  }}
                >
                  Save override
                </DefaultButton>
              </div>
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  });

UserNeynarScoreOverrideModal.displayName = 'UserNeynarScoreOverrideModal';

function ScoreInfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted">{label}</div>
      <div className="truncate text-default">{value}</div>
    </div>
  );
}

export { UserNeynarScoreOverrideModal };
