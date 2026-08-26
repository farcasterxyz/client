import { MuteIcon } from '@primer/octicons-react';
import type { ApiUser, ApiUserMinimal } from 'farcaster-client-data';
import {
  ReportUserOption,
  resolveUsername,
  useMarkInvisible,
  useReportUser,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SelectOne } from '~/components/forms/SelectOne';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type ReportUserModalProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onClose: () => void;
  onSubmit?: () => void;
};

type ReportUserModalStep = 'select' | 'confirm' | 'mute';

const ReportUserModal = React.memo(
  ({ onClose, targetUser, onSubmit }: ReportUserModalProps) => {
    const [currentStep, setCurrentStep] =
      useState<ReportUserModalStep>('select');
    const title = useMemo(() => {
      switch (currentStep) {
        case 'select':
          return 'Why are you reporting this user?';
        case 'confirm':
          return 'User reported';
        case 'mute':
          return `Mute ${resolveUsername({
            username: targetUser.username,
            fid: targetUser.fid,
          })}`;
        default:
          return '';
      }
    }, [currentStep, targetUser]);

    const onReportSuccess = useCallback(() => {
      setCurrentStep('confirm');
      onSubmit?.();
    }, [onSubmit]);

    const onMute = useCallback(() => {
      setCurrentStep('mute');
    }, []);

    const onDone = useCallback(() => {
      onClose();
    }, [onClose]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onClose}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="relative flex h-auto w-[500px] flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <div className="absolute right-0 top-2 flex w-full flex-row-reverse px-2">
                <DefaultCloseModalButton onClick={onClose} className="p-2" />
              </div>
              <div className="flex w-full flex-row items-center justify-between">
                <span className="text-xl font-semibold text-default">
                  {title}
                </span>
              </div>
              {currentStep === 'select' && (
                <ReportUserModalContent
                  onSuccess={onReportSuccess}
                  user={targetUser}
                />
              )}
              {currentStep === 'confirm' && (
                <UserReportedModalContent
                  targetUser={targetUser}
                  onDone={onDone}
                  onMute={onMute}
                />
              )}
              {currentStep === 'mute' && (
                <MuteUserModalContent
                  targetUser={targetUser}
                  onClose={onClose}
                />
              )}
            </div>
          </div>
        </DefaultModalContainer>
      </Modal>
    );
  },
);

ReportUserModal.displayName = 'ReportUserModal';

type ReportUserModalContentProps = {
  user: ApiUser | ApiUserMinimal;
  onSuccess: () => void;
};

const ReportUserModalContent: React.FC<ReportUserModalContentProps> =
  React.memo(({ user, onSuccess }) => {
    const { reportUserOptions, reportUser } = useReportUser();
    const [selectedOption, setSelectedOption] =
      useState<ReportUserOption | null>(null);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [selectOneDisabled, setSelectOneDisabled] = useState(false);

    const updateSelectedOption = (newValue: string) => {
      const option = reportUserOptions.find((option) => option.id === newValue);
      setSelectedOption(option || null);
      setButtonDisabled(option === null);
    };

    const submitReason = useCallback(async () => {
      if (selectedOption === null) {
        return;
      }
      setButtonDisabled(true);
      setSelectOneDisabled(true);

      try {
        await reportUser({
          reportedFid: user.fid,
          reason: selectedOption.id,
        });
        onSuccess();
      } catch (error) {
        trackError(error);
        toast({
          message: 'Error reporting user, please try again',
          type: 'error',
        });
      } finally {
        setSelectOneDisabled(false);
      }
    }, [selectedOption, reportUser, user, onSuccess]);

    return (
      <>
        <div className="mb-4 flex w-full flex-col gap-2">
          <SelectOne
            options={reportUserOptions.map((option) => ({
              value: option.id,
              title: option.label,
              subtitle: option.description,
            }))}
            value={selectedOption?.id || ''}
            onChange={updateSelectedOption}
            className="mt-6"
            bordered
            disabled={selectOneDisabled}
          />
        </div>
        <DefaultButton
          title="Next"
          variant="normal"
          className="flex w-full flex-row items-center !justify-center py-[12px]"
          onClick={submitReason}
          disabled={buttonDisabled}
        >
          Next
        </DefaultButton>
      </>
    );
  });

type UserReportedModalContentProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onDone: () => void;
  onMute: () => void;
};

const UserReportedModalContent: React.FC<UserReportedModalContentProps> =
  React.memo(({ targetUser, onDone, onMute }) => {
    return (
      <>
        <div className="flex w-full flex-col pt-4 text-base text-muted">
          <span>
            We'll review your report and let you know if we take action on it.
          </span>
        </div>
        <div className="flex w-full flex-col space-y-2 py-4">
          <div className="text-base font-semibold text-default">
            Other steps you can take
          </div>
          <div
            className="flex w-max flex-row items-center py-1 text-base text-red-600 hover:underline"
            onClick={onMute}
            role="button"
          >
            <MuteIcon size={16} className="-mt-0.5 mr-2" />
            {`Mute ${resolveUsername({
              username: targetUser.username,
              fid: targetUser.fid,
            })}`}
          </div>
        </div>
        <DefaultButton
          title="Next"
          variant="normal"
          className="mt-2 flex w-full flex-row items-center !justify-center py-[12px]"
          onClick={onDone}
        >
          Done
        </DefaultButton>
      </>
    );
  });

type MuteUserModalContentProps = {
  targetUser: ApiUser | ApiUserMinimal;
  onClose: () => void;
};

const MuteUserModalContent: React.FC<MuteUserModalContentProps> = React.memo(
  ({ targetUser, onClose }) => {
    const markInvisible = useMarkInvisible();

    const onMute = useCallback(() => {
      void markInvisible({
        targetFid: targetUser.fid,
        block: false,
      });
      onClose();
    }, [markInvisible, targetUser.fid, onClose]);

    return (
      <>
        <div className="flex w-full flex-col py-4 text-base text-muted">
          Once muted, they won't appear in your feed.
        </div>
        <div className="flex w-full flex-row items-center justify-between space-x-2">
          <DefaultButton
            title="Cancel"
            variant="muted"
            onClick={onClose}
            className="flex-1 py-[12px]"
          >
            Cancel
          </DefaultButton>
          <DefaultButton
            title="Mute"
            variant="danger"
            onClick={onMute}
            className="flex-1 py-[12px]"
          >
            Mute
          </DefaultButton>
        </div>
      </>
    );
  },
);

export { ReportUserModal };
