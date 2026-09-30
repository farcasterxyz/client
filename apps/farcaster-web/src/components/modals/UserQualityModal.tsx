import { RadioGroup } from '@headlessui/react';
import {
  CircleIcon,
  DashIcon,
  DependabotIcon,
  StarIcon,
  StopIcon,
  ThumbsdownIcon,
  TrashIcon,
} from '@primer/octicons-react';
import cn from 'classnames';
import { ApiUser, ApiUserQuality } from 'farcaster-client-data';
import { resolveUsername, useSetUserQuality } from 'farcaster-client-hooks';
import React, {
  FC,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Textarea } from '~/components/forms/Textarea';
import { TextInput } from '~/components/forms/TextInput';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { trackError } from '~/utils/errorUtils';

type UserQualityModalProps = {
  user: ApiUser;
  quality?: ApiUserQuality;
  badness?: number;
  onCancel: () => void;
};

const UserQualityModal: React.FC<UserQualityModalProps> = React.memo(
  ({ user, quality, badness: initialBadness, onCancel }) => {
    const setUserQuality = useSetUserQuality();

    const [showConfimHarmful, setShowConfirmHarmful] = useState(false);

    const [reason, setReason] = useState('');

    const [selectedQuality, setSelectedQualityState] = useState<
      ApiUserQuality | undefined
    >(quality);

    const [badness, setBadness] = useState<number | undefined>(
      initialBadness ?? 0,
    );

    const setSelectedQuality = useCallback(
      (newQuality: ApiUserQuality | undefined) => {
        if (newQuality !== 'low') {
          setBadness(undefined);
        } else {
          setBadness(initialBadness ?? 0);
        }

        setSelectedQualityState(newQuality);
      },
      [initialBadness],
    );

    const badnessEnabled = useMemo(
      () => selectedQuality === 'low',
      [selectedQuality],
    );

    const canSubmit = useMemo(() => {
      if (!selectedQuality) {
        return false;
      }
      if (selectedQuality === 'unranked') {
        return false;
      }
      if (selectedQuality === 'harmful' && reason.trim().length === 0) {
        return false;
      }
      return true;
    }, [reason, selectedQuality]);

    const updateUserQuality = useCallback(async () => {
      if (selectedQuality) {
        if (selectedQuality === 'unranked') {
          return;
        }

        try {
          await setUserQuality({
            fid: user.fid,
            quality: selectedQuality,
            badness: badnessEnabled ? badness : undefined,
            reason,
          });

          onCancel();
        } catch (error) {
          trackError(error);
          alert('Error updating quality');
        }
      }
    }, [
      badness,
      badnessEnabled,
      onCancel,
      reason,
      selectedQuality,
      setUserQuality,
      user.fid,
    ]);

    return (
      <>
        <Modal>
          <DefaultModalContainer onClose={onCancel}>
            <div className="flex size-full flex-col items-center justify-center p-4">
              <div
                className="flex h-auto w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <div className="mb-4 w-full text-center text-lg font-semibold">
                  {resolveUsername({ username: user.username, fid: user.fid })}{' '}
                  quality
                </div>
                <div className="w-full">
                  <RadioGroup
                    value={selectedQuality}
                    onChange={setSelectedQuality}
                  >
                    <div className="flex flex-col items-stretch gap-2">
                      <UserQualityOption
                        value="high"
                        icon={<StarIcon size="small" />}
                        label="High quality"
                      />
                      <UserQualityOption
                        value="neutral"
                        icon={<DashIcon size="small" />}
                        label="Neutral quality"
                      />
                      <UserQualityOption
                        value="low"
                        icon={<ThumbsdownIcon size="small" />}
                        label="Low quality"
                      />
                      <UserQualityOption
                        value="spam"
                        icon={<TrashIcon size="small" />}
                        label="Spam"
                      />
                      <UserQualityOption
                        value="harmful"
                        icon={<StopIcon size="small" />}
                        label="Harmful"
                      />
                      <UserQualityOption
                        value="unranked"
                        icon={<CircleIcon size="small" />}
                        label="Unranked"
                      />
                      <UserQualityOption
                        value="automated"
                        icon={<DependabotIcon size="small" />}
                        label="Automated"
                      />
                    </div>
                  </RadioGroup>
                  <div
                    className={cn(
                      'mt-4',
                      'mb-2',
                      !badnessEnabled ? 'text-muted' : '',
                    )}
                  >
                    Low quality badness
                    <div className="text-sm">
                      0 to 100, 0 = visible to non-followers, 100 = invisible to
                      non-followers
                    </div>
                  </div>
                  <div>
                    <TextInput
                      value={badness}
                      className={badnessEnabled ? '' : 'text-muted'}
                      pattern="[0-9]*"
                      onChange={(e) => {
                        setBadness((v) => {
                          if (e.target.value === '') {
                            return 0;
                          } else {
                            if (e.target.validity.valid) {
                              const val = parseInt(e.target.value);
                              if (val >= 0 && val <= 100) {
                                return val;
                              }
                            }
                            return v;
                          }
                        });
                      }}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                          updateUserQuality();
                        }
                      }}
                      disabled={!badnessEnabled}
                    />
                  </div>
                  <div className="mb-2 mt-4">
                    Reason (required for Harmful):
                  </div>
                  <div>
                    <Textarea
                      rows={2}
                      value={reason}
                      hideResizeHandle
                      onChange={(e) => {
                        setReason(e.target.value);
                      }}
                    />
                  </div>
                  <DefaultButton
                    className="mt-4"
                    disabled={!canSubmit}
                    onClick={() => {
                      if (selectedQuality === 'harmful') {
                        setShowConfirmHarmful(true);
                      } else {
                        updateUserQuality();
                      }
                    }}
                  >
                    Update
                  </DefaultButton>
                </div>
              </div>
            </div>
          </DefaultModalContainer>
        </Modal>
        {showConfimHarmful && (
          <ConfirmationModal
            onCancel={() => {
              setShowConfirmHarmful(false);
            }}
            onConfirm={async () => {
              await updateUserQuality();
              setShowConfirmHarmful(false);
            }}
            title="Mark harmful"
            body={
              <>
                Are you sure you want to mark{' '}
                {resolveUsername({ username: user.username, fid: user.fid })} as
                harmful?
              </>
            }
          />
        )}
      </>
    );
  },
);

UserQualityModal.displayName = 'UserQualityModal';

interface UserQualityOptionProps {
  value: ApiUserQuality;
  icon: React.ReactNode;
  label: string;
  // selected: boolean;
}

const UserQualityOption: FC<UserQualityOptionProps> = ({
  value,
  icon,
  label,
  // selected,
}) => {
  return (
    <RadioGroup.Option value={value}>
      {({ checked }) => (
        <div
          className={cn(
            'flex cursor-pointer flex-row items-center gap-2 rounded border px-3 py-2.5 text-md',
            checked ? 'border-highlight' : 'border-default',
          )}
        >
          {icon}
          <div>{label}</div>
        </div>
      )}
    </RadioGroup.Option>
  );
};

export { UserQualityModal };
