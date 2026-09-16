import { ArrowRightIcon } from '@primer/octicons-react';
import React from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { Logo } from '~/components/Logo';

export function GoToWarpcastHeader() {
  return (
    <div className="flex w-full flex-row items-center justify-between px-6 pt-6 md:px-20">
      <Logo size={'sm'} />
      <ExternalLink href={'https://farcaster.xyz'} title={'Go to Farcaster'}>
        <div className="flex flex-row items-center space-x-1 text-md text-muted">
          <span>Go to Farcaster</span>
          <ArrowRightIcon size={12} className="mt-1" />
        </div>
      </ExternalLink>
    </div>
  );
}
