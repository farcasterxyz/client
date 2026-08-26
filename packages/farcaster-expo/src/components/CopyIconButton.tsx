import * as Clipboard from 'expo-clipboard';
import { CheckIcon } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';

import {
  IconButton,
  IconButtonProps,
} from './design-system/Buttons/IconButton';
import { CopyIcon } from './icons/CopyIcon';

type CopyIconButtonProps = Pick<IconButtonProps, 'size' | 'variant'> & {
  text: string;
};

export const useCopyText = ({
  text,
  onCopy,
}: {
  text: string;
  onCopy?: () => void;
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(undefined);

  const copy = useCallback(() => {
    Clipboard.setStringAsync(text);
    setCopied(true);
    onCopy?.();

    if (timeout.current) {
      clearTimeout(timeout.current);
    }

    timeout.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [text, onCopy]);

  return {
    copy,
    copied,
  };
};

export function CopyIconButton({ text, ...rest }: CopyIconButtonProps) {
  const { copy, copied } = useCopyText({ text });

  return (
    <IconButton
      haptics
      onPress={copy}
      Icon={({ size, color }) =>
        copied ? (
          <CheckIcon size={size} color={color} />
        ) : (
          <CopyIcon size={size} color={color} />
        )
      }
      {...rest}
    />
  );
}
