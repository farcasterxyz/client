import { CheckCircleIcon } from 'lucide-react-native';
import * as React from 'react';

import { useCopyText } from '../components/CopyIconButton';
import { useRootToast } from '../contexts';
import { useTheme } from '../contexts/ThemeContext';
import { formatAddress } from '../utils';

type UseCopyWalletAddressReturn = {
  copy: () => void;
  copied: boolean;
};
function useCopyWalletAddress(address: string): UseCopyWalletAddressReturn {
  const t = useTheme();

  const toast = useRootToast();

  const { copy, copied } = useCopyText({ text: address });

  const copyFunc = React.useCallback(() => {
    copy();

    toast.show('Address copied to clipboard!', {
      type: 'generic',
      data: {
        icon: <CheckCircleIcon color={t.colors.text.primary} size={18} />,
        mutedMessage: formatAddress(address),
      },
    });
  }, [address, copy, toast, t.colors.text.primary]);

  return { copy: copyFunc, copied };
}

export { useCopyWalletAddress };
