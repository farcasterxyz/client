import { CheckIcon, CopyIcon, SyncIcon } from '@primer/octicons-react';
import classNames from 'classnames';
import React, { useState } from 'react';

interface GroupInviteLinkProps {
  groupInviteLink: string;
  subtext?: string;
  className?: string;
  resetLink?: () => Promise<void>;
  onCopy?: () => void;
}

const GroupInviteLink: React.FC<GroupInviteLinkProps> = ({
  groupInviteLink,
  subtext,
  className,
  onCopy,
  resetLink,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = React.useCallback(() => {
    if (typeof groupInviteLink === 'undefined') {
      return;
    }

    navigator.clipboard.writeText(groupInviteLink);
    onCopy?.();

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [groupInviteLink, onCopy]);

  const [reset, setReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const handleReset = React.useCallback(async () => {
    try {
      setResetting(true);
      await resetLink!();

      setReset(true);
      setTimeout(() => {
        setReset(false);
      }, 2000);
    } finally {
      setResetting(false);
    }
  }, [resetLink]);

  return (
    <div
      className={classNames(
        'flex flex-row items-center rounded-[10px] border px-[10px] py-2 border-default',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-base font-medium">Share invite link</div>
        <div className="block w-full truncate text-xs text-faint">
          {subtext || groupInviteLink.replace(/(^\w+:|^)\/\//, '')}
        </div>
      </div>
      <div className="flex flex-none flex-row items-center gap-2">
        {}
        <button
          className="size-[32px] cursor-pointer flex-row items-center justify-center rounded-full border text-sm bg-overlay-light border-default hover:bg-overlay-medium"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon size={16} className={'text-default'} />
          ) : (
            <CopyIcon size={16} className={'text-default'} />
          )}
        </button>
        {resetLink && (
          <button
            className="size-[32px] cursor-pointer flex-row items-center justify-center rounded-full border text-sm bg-overlay-light border-default hover:bg-overlay-medium disabled:opacity-50"
            onClick={handleReset}
            disabled={resetting}
          >
            {reset ? (
              <CheckIcon size={16} className={'text-default'} />
            ) : (
              <SyncIcon size={16} className={'text-default'} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export { GroupInviteLink };
