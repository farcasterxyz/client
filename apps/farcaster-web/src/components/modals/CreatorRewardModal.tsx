import { GiftIcon, LinkExternalIcon, XIcon } from '@primer/octicons-react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget, useTrackEvent } from 'farcaster-client-hooks';
import React, { FC, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { ComposeCastModal } from '~/components/modals/ComposeCastModal';
import { getTransactionExplorerUrl } from '~/utils/ethereumUtils';

interface CreatorRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardCents: number;
  rewardDate: string;
  txHash: string;
  txChainId: number;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

const CreatorRewardModal: FC<CreatorRewardModalProps> = ({
  open,
  onOpenChange,
  rewardCents,
  rewardDate,
  txHash,
  txChainId,
}) => {
  const [composerVisible, setComposerVisible] = useState(false);
  const { trackEvent } = useTrackEvent();

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange} modal={true}>
        <Dialog.Trigger asChild>moo</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-10 bg-overlay" />
          <Dialog.Content className="focus:outline-hidden fixed left-1/2 top-1/2 z-20 max-h-[85vh] w-[90vw] max-w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-[6px] py-6 bg-app">
            <div className="flex flex-row items-center justify-between pl-6 pr-4">
              <Dialog.Title className="flex flex-row items-center gap-3">
                <div className="flex size-[32px] items-center justify-center rounded-full bg-[#7C65C133] dark:bg-[#7C65C14D]">
                  <GiftIcon size={18} className="text-action-purple" />
                </div>
                <div className="text-xl font-semibold">Top Creator Reward</div>
              </Dialog.Title>
              <Dialog.Close asChild>
                <div className="flex w-max cursor-pointer flex-col items-center justify-center rounded-full p-2 text-faint hover:bg-overlay-faint hover:text-default">
                  <XIcon size={20} className="text-default" />
                </div>
              </Dialog.Close>
            </div>
            <div className="mt-4 flex flex-col gap-4 px-6">
              <Dialog.Description>
                Farcaster sent you {Math.floor(rewardCents / 100)} USDC for
                being a top caster on{' '}
                {dateFormatter.format(new Date(rewardDate))}.{' '}
                <ExternalLink
                  href={getNotionLinkTarget({ to: 'creator-rewards' })}
                  title="Learn more"
                >
                  Learn more
                </ExternalLink>
              </Dialog.Description>
              <ExternalLink
                href={getTransactionExplorerUrl({
                  chainId: txChainId.toString(),
                  hash: txHash,
                })}
                onClick={() => {
                  trackEvent(AnalyticsEvent.ViewCreatorRewardInExplorer, {
                    txHash,
                    txChainId,
                    rewardDate,
                    rewardCents,
                  });
                }}
                title="View transaction"
                className="mt-1"
              >
                <DefaultButton className="outline-hidden flex w-full items-center justify-center !text-base !font-medium">
                  View transaction <LinkExternalIcon className="ml-1" />
                </DefaultButton>
              </ExternalLink>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {composerVisible && (
        <ComposeCastModal
          onClose={() => {
            setComposerVisible(false);
          }}
          intent={undefined}
        />
      )}
    </>
  );
};
CreatorRewardModal.displayName = 'CreatorRewardModal';

export { CreatorRewardModal };
