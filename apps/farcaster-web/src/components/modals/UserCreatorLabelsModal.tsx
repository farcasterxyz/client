import { Radio, RadioGroup } from '@headlessui/react';
import cn from 'classnames';
import { ApiCreatorLabel, ApiUser } from 'farcaster-client-data';
import {
  resolveUsername,
  useRemoveCreatorLabel,
  useSetCreatorLabel,
} from 'farcaster-client-hooks';
import React, { FC, useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';

type UserCreatorLabelsModalProps = {
  user: ApiUser;
  creatorLabel?: ApiCreatorLabel;
  onCancel: () => void;
};

const UserCreatorLabelsModal: React.FC<UserCreatorLabelsModalProps> =
  React.memo(({ user, creatorLabel, onCancel }) => {
    const setCreatorLabel = useSetCreatorLabel();
    const removeCreatorLabel = useRemoveCreatorLabel();

    const [selectedCreatorLabel, setSelectedCreatorLabel] = useState<
      ApiCreatorLabel | undefined
    >(creatorLabel);

    const canSubmit = useMemo(() => {
      if (!selectedCreatorLabel || selectedCreatorLabel === creatorLabel) {
        return false;
      }

      return true;
    }, [selectedCreatorLabel, creatorLabel]);

    const updateUserCreatorLabel = useCallback(async () => {
      if (selectedCreatorLabel) {
        try {
          await setCreatorLabel({
            fid: user.fid,
            creatorLabel: selectedCreatorLabel,
          });

          window.location.reload();
        } catch (error) {
          alert('Error updating creator label');
        }
      }
    }, [selectedCreatorLabel, setCreatorLabel, user.fid]);

    const removeUserCreatorLabel = useCallback(async () => {
      try {
        await removeCreatorLabel({ fid: user.fid });
        window.location.reload();
      } catch (error) {
        alert('Error removing creator label');
      }
    }, [removeCreatorLabel, user.fid]);

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
                  Creator Label
                </div>
                <div className="flex w-full flex-col">
                  <RadioGroup
                    value={selectedCreatorLabel}
                    onChange={setSelectedCreatorLabel}
                  >
                    <div className="flex max-h-96 flex-col items-stretch gap-2 overflow-y-auto py-1">
                      <CreatorLabelOption value="c-zinger" />
                      <CreatorLabelOption value="c-vf" />
                      <CreatorLabelOption value="c-vip" />
                      <CreatorLabelOption value="c-journalist" />
                      <CreatorLabelOption value="c-culture" />
                      <CreatorLabelOption value="c-reply" />
                      <CreatorLabelOption value="c-developer" />
                      <CreatorLabelOption value="c-celo" />
                      <CreatorLabelOption value="c-monad" />
                      <CreatorLabelOption value="c-solana" />
                      <CreatorLabelOption value="c-bio" />
                      <CreatorLabelOption value="c-ns" />
                      <CreatorLabelOption value="c-techcul" />
                      <CreatorLabelOption value="c-college" />
                      <CreatorLabelOption value="c-video" />
                      <CreatorLabelOption value="c-noice" />
                      <CreatorLabelOption value="c-other" />
                    </div>
                  </RadioGroup>
                  <div className="mt-4 flex items-center gap-2">
                    {creatorLabel && (
                      <DefaultButton
                        onClick={removeUserCreatorLabel}
                        variant="secondary"
                        className="flex-1"
                      >
                        Remove
                      </DefaultButton>
                    )}
                    <DefaultButton
                      disabled={!canSubmit}
                      onClick={updateUserCreatorLabel}
                      className="flex-1"
                    >
                      Update
                    </DefaultButton>
                  </div>
                </div>
              </div>
            </div>
          </DefaultModalContainer>
        </Modal>
      </>
    );
  });

UserCreatorLabelsModal.displayName = 'UserCreatorLabelsModal';

interface CreatorLabelOptionProps {
  value: ApiCreatorLabel;
}

const CreatorLabelOption: FC<CreatorLabelOptionProps> = ({ value }) => {
  return (
    <Radio value={value}>
      {({ checked }) => (
        <div
          className={cn(
            'flex cursor-pointer flex-row items-center gap-2 rounded border px-3 py-2.5 text-md',
            checked ? 'border-highlight' : 'border-default',
          )}
        >
          <div className="uppercase">{value}</div>
        </div>
      )}
    </Radio>
  );
};

export { UserCreatorLabelsModal };
