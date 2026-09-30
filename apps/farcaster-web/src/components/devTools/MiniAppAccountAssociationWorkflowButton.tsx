import cn from 'classnames';
import React, { useMemo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useGoBack } from '~/hooks/navigation/useGoBack';

import { MiniAppAccountAssociationWorkflowModal } from './MiniAppAccountAssociationWorkflowModal';

const MiniAppAccountAssociationWorkflowButton = React.memo(
  ({
    domain,
    label,
    targetFid,
    isOwnershipTransfer,
  }: {
    domain: string | undefined;
    label: string;
    targetFid?: string;
    isOwnershipTransfer?: boolean;
  }) => {
    const back = useGoBack();

    const [showModal, setShowModal] = useState(false);

    const isLocalhost = useMemo(() => {
      return domain?.startsWith('localhost');
    }, [domain]);

    const readyToRegister = useMemo(() => {
      return domain && !isLocalhost;
    }, [domain, isLocalhost]);

    const handleRegister = () => {
      if (!readyToRegister) {
        return;
      }
      setShowModal(true);
    };

    const disableReason = useMemo(() => {
      if (!domain) {
        return '';
      }
      if (isLocalhost) {
        return "The domain can't be localhost";
      }

      return undefined;
    }, [domain, isLocalhost]);

    const handleRegisterSuccess = () => {
      setShowModal(false);
      back();
    };

    return (
      <div
        className={cn('flex flex-row items-center gap-2', !domain && 'hidden')}
      >
        <div className="flex flex-col justify-start gap-2">
          <DefaultButton onClick={handleRegister} disabled={!readyToRegister}>
            {label}
          </DefaultButton>
          {disableReason && (
            <span className="text-right text-sm text-danger">
              {disableReason}
            </span>
          )}
        </div>
        {showModal && domain && (
          <MiniAppAccountAssociationWorkflowModal
            domain={domain}
            onClose={() => setShowModal(false)}
            onSuccess={handleRegisterSuccess}
            targetFid={targetFid}
            isOwnershipTransfer={isOwnershipTransfer}
          />
        )}
      </div>
    );
  },
);

export { MiniAppAccountAssociationWorkflowButton };
