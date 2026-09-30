import { ApiVerificationProtocol } from 'farcaster-client-data';
import React from 'react';

import { Image, ImageProps } from '~/components/images/Image';

import ethereumLogo from './ethereumLogoPurple.webp';
import solanaLogo from './solonaLogoMark.png';

const getProtocolProps = (protocol: ApiVerificationProtocol) => {
  switch (protocol) {
    case 'ethereum':
      return {
        src: ethereumLogo,
        alt: 'ethereum diamond logo',
      };
    case 'solana':
      return {
        src: solanaLogo,
        alt: 'solana logo',
      };
    default:
      throw new Error(`Unexpected protocol ${protocol}`);
  }
};

type VerificationProtocolImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  protocol: ApiVerificationProtocol;
};

export function VerificationProtocolImage({
  protocol,
  ...rest
}: VerificationProtocolImageProps) {
  return <Image {...getProtocolProps(protocol)} {...rest} />;
}
