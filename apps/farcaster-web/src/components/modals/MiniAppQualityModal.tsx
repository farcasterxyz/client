import { RadioGroup } from '@headlessui/react';
import { DashIcon, StopIcon } from '@primer/octicons-react';
import cn from 'classnames';
import { ApiMiniAppQuality } from 'farcaster-client-data';
import { useSetMiniAppQuality } from 'farcaster-client-hooks';
import React, { useCallback, useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Textarea } from '~/components/forms/Textarea';
import { ConfirmationModal } from '~/components/modals/ConfirmationModal';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type MiniAppQualityModalProps = {
  domain: string;
  name?: string;
  harmful?: boolean;
  onCancel: () => void;
};

const qualityOptions: {
  value: ApiMiniAppQuality;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: 'neutral', label: 'Neutral', icon: <DashIcon /> },
  { value: 'harmful', label: 'Harmful', icon: <StopIcon /> },
];

const MiniAppQualityModal: React.FC<MiniAppQualityModalProps> = React.memo(
  ({ domain, name, harmful, onCancel }) => {
    const { mutateAsync: setMiniAppQuality, isPending } =
      useSetMiniAppQuality();
    const [showConfirmHarmful, setShowConfirmHarmful] = useState(false);
    const [reason, setReason] = useState('');
    const [selectedQuality, setSelectedQuality] = useState<ApiMiniAppQuality>(
      harmful ? 'harmful' : 'neutral',
    );

    const canSubmit = useMemo(() => {
      if (selectedQuality === 'harmful' && reason.trim().length === 0) {
        return false;
      }
      return true;
    }, [reason, selectedQuality]);

    const updateQuality = useCallback(async () => {
      try {
        await setMiniAppQuality({ domain, quality: selectedQuality, reason });
        onCancel();
      } catch (error) {
        trackError(error);
        toast({ message: 'Failed to update mini app quality', type: 'error' });
      }
    }, [setMiniAppQuality, domain, selectedQuality, reason, onCancel]);

    const handleUpdate = useCallback(() => {
      if (selectedQuality === 'harmful') {
        setShowConfirmHarmful(true);
      } else {
        updateQuality();
      }
    }, [selectedQuality, updateQuality]);

    return (
      <Modal>
        <DefaultModalContainer onClose={onCancel}>
          <div className="flex size-full flex-col items-center justify-center p-4">
            <div
              className="flex h-auto w-96 flex-col items-start justify-center rounded-lg border p-4 bg-app border-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 w-full text-center text-lg font-semibold">
                {name ?? domain} quality
              </div>
              <div className="w-full">
                <RadioGroup
                  value={selectedQuality}
                  onChange={setSelectedQuality}
                >
                  <div className="flex flex-col items-stretch gap-2">
                    {qualityOptions.map((option) => (
                      <RadioGroup.Option
                        key={option.value}
                        value={option.value}
                      >
                        {({ checked }) => (
                          <div
                            className={cn(
                              'flex cursor-pointer flex-row items-center gap-2 rounded border px-3 py-2.5 text-md',
                              checked ? 'border-highlight' : 'border-default',
                            )}
                          >
                            {option.icon}
                            <div>{option.label}</div>
                          </div>
                        )}
                      </RadioGroup.Option>
                    ))}
                  </div>
                </RadioGroup>
                <div className="mb-2 mt-4">
                  Reason
                  {selectedQuality === 'harmful' ? ' (required)' : ''}:
                </div>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                  rows={3}
                  hideResizeHandle
                />
                <DefaultButton
                  className="mt-4"
                  disabled={!canSubmit || isPending}
                  onClick={handleUpdate}
                >
                  Update
                </DefaultButton>
              </div>
            </div>
          </div>
        </DefaultModalContainer>

        {showConfirmHarmful && (
          <ConfirmationModal
            title="Mark as harmful?"
            body={`This will hide "${name ?? domain}" from all users. Casts containing this mini app will be hidden, and shared links will show "app not available".`}
            confirmText="Mark as harmful"
            confirmVariant="danger"
            onConfirm={updateQuality}
            onCancel={() => setShowConfirmHarmful(false)}
          />
        )}
      </Modal>
    );
  },
);

MiniAppQualityModal.displayName = 'MiniAppQualityModal';

export { MiniAppQualityModal };
