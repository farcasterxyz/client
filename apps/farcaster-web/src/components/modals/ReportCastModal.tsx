import { ArrowRightIcon, MuteIcon } from '@primer/octicons-react';
import type { ApiUser } from 'farcaster-client-data';
import {
  CastReactionType,
  type ReportCastOption,
  resolveUsername,
  useMarkInvisibleFromCast,
  useReportCast,
  useTrackCastReaction,
} from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SelectOne } from '~/components/forms/SelectOne';
import { ExternalLink } from '~/components/links/ExternalLink';
import { DefaultCloseModalButton } from '~/components/modals/DefaultCloseModalButton';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type ReportCastModalProps = {
  castHash: string;
  targetUser: ApiUser;
  onClose: () => void;
};

type ReportCastModalStep = 'select' | 'confirm' | 'mute';

const ReportCastModal = React.memo(
  ({ onClose, castHash, targetUser }: ReportCastModalProps) => {
    const [currentStep, setCurrentStep] =
      useState<ReportCastModalStep>('select');
    const title = useMemo(() => {
      switch (currentStep) {
        case 'select':
          return 'Why are you reporting this cast?';
        case 'confirm':
          return 'Cast reported';
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
    }, []);

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
                <ReportCastModalContent
                  onSuccess={onReportSuccess}
                  castHash={castHash}
                  author={targetUser}
                />
              )}
              {currentStep === 'confirm' && (
                <CastReportedModalContent
                  targetUser={targetUser}
                  onDone={onDone}
                  onMute={onMute}
                />
              )}
              {currentStep === 'mute' && (
                <MuteUserModalContent
                  castHash={castHash}
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

ReportCastModal.displayName = 'ReportCastModal';

type ReportCastModalContentProps = {
  castHash: string;
  author: ApiUser;
  onSuccess: () => void;
};

const ReportCastModalContent: React.FC<ReportCastModalContentProps> =
  React.memo(({ castHash, author, onSuccess }) => {
    const trackCastReaction = useTrackCastReaction();
    const { reportCast, reportCastOptions } = useReportCast();
    const [selectedOption, setSelectedOption] =
      useState<ReportCastOption | null>(null);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [selectOneDisabled, setSelectOneDisabled] = useState(false);

    const updateSelectedOption = (newValue: string) => {
      const option = reportCastOptions.find((option) => option.id === newValue);
      setSelectedOption(option || null);
      setButtonDisabled(option === null);
    };

    const submitReason = useCallback(async () => {
      if (selectedOption === null) {
        return;
      }
      setButtonDisabled(true);
      setSelectOneDisabled(true);

      trackCastReaction({
        castHash: castHash,
        type: CastReactionType.Report,
        undo: false,
        castFid: author.fid,
      });

      try {
        reportCast({
          castHash: castHash,
          reason: selectedOption.id,
        });
        onSuccess();
      } catch (error) {
        trackError(error);
        toast({
          message: 'Error reporting cast, please try again',
          type: 'error',
        });
      } finally {
        setSelectOneDisabled(false);
      }
    }, [
      selectedOption,
      trackCastReaction,
      reportCast,
      author,
      castHash,
      onSuccess,
    ]);

    return (
      <>
        <div className="mb-4 flex w-full flex-col gap-2">
          <SelectOne
            options={reportCastOptions.map((option) => ({
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

type CastReportedModalContentProps = {
  targetUser: ApiUser;
  onDone: () => void;
  onMute: () => void;
};

const CastReportedModalContent: React.FC<CastReportedModalContentProps> =
  React.memo(({ targetUser, onDone, onMute }) => {
    const { learnMoreUrl } = useReportCast();
    return (
      <>
        <div className="flex w-full flex-col pt-4 text-base text-muted">
          <span>
            We'll review your report and let you know if we take action on it.
          </span>
          <ExternalLink title="Learn more" href={learnMoreUrl}>
            <span className="flex flex-row items-center">
              Learn more <ArrowRightIcon size={14} />
            </span>
          </ExternalLink>
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
  castHash: string;
  targetUser: ApiUser;
  onClose: () => void;
};

const MuteUserModalContent: React.FC<MuteUserModalContentProps> = React.memo(
  ({ castHash, targetUser, onClose }) => {
    const markInvisible = useMarkInvisibleFromCast();

    const onMute = useCallback(() => {
      void markInvisible({
        castHash: castHash,
        targetFid: targetUser.fid,
        block: false,
      });
      onClose();
    }, [castHash, markInvisible, targetUser.fid, onClose]);

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

export { ReportCastModal };
