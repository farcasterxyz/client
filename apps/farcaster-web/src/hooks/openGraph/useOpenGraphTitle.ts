import {
  ApiOpenGraphMetadata,
  isDomainOrSubdomain,
} from 'farcaster-client-data';
import { useMemo } from 'react';

const useOpenGraphTitle = ({
  attachment,
}: {
  attachment: ApiOpenGraphMetadata;
}) => {
  return useMemo(() => {
    if (
      attachment.domain &&
      isDomainOrSubdomain(attachment.domain, 'etherscan.io')
    ) {
      return 'Etherscan';
    }

    if (
      attachment.domain &&
      isDomainOrSubdomain(attachment.domain, 'amazon.com')
    ) {
      return 'Amazon';
    }

    if (attachment.title === '- YouTube') {
      return 'YouTube';
    }

    return attachment.title || '';
  }, [attachment]);
};

export { useOpenGraphTitle };
