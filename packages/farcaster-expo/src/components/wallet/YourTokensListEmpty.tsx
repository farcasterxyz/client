import { Check, Coins, Copy } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../contexts';
import { useCopyText } from '../CopyIconButton';
import { ButtonV2, Text2 } from '../design-system';

export function YourTokensListEmpty({ address }: { address: string }) {
  const t = useTheme();
  const { copy, copied } = useCopyText({ text: address });

  return (
    <View style={[t.mY10, t.itemsCenter, { gap: 24 }, t.pX3]}>
      <Coins size={64} color={t.colors.text.tertiary} />
      <Text2 color="secondary" align="center">
        No tokens yet. Copy your address and send tokens from another wallet or
        exchange to get started.
      </Text2>
      <ButtonV2
        variant="secondary"
        title={copied ? 'Address copied' : 'Copy address'}
        onPress={copy}
        Icon={(props) =>
          copied ? (
            <Copy size={16} {...props} />
          ) : (
            <Check size={16} {...props} />
          )
        }
      />
    </View>
  );
}
