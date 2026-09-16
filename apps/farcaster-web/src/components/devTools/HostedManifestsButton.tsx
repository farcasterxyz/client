import { PlusIcon } from 'lucide-react';
import React from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { useNavigate } from '~/hooks/navigation/useNavigate';

interface HostedManifestsButtonProps {
  title: string;
  domain?: string;
  manage?: boolean;
  icon?: React.ReactNode;
}

export function HostedManifestsButton({
  title,
  domain,
  manage,
  icon = <PlusIcon className="size-4" />,
}: HostedManifestsButtonProps) {
  const navigate = useNavigate();

  if (manage && domain) {
    throw new Error('Cannot have both manage and domain');
  }

  return (
    <DefaultButton
      variant="secondary"
      onClick={() => {
        navigate({
          to: 'developersHostedManifests',
          params: {},
          searchParams: {
            domain,
            manage: manage ? 'true' : undefined,
          },
        });
      }}
    >
      <div className="flex flex-row items-center gap-2">
        {icon}
        {title}
      </div>
    </DefaultButton>
  );
}
