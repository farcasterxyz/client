import { Check, Coins, Copy } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { useCopyText } from '../../../CopyIconButton';
import { ButtonV2, Text2 } from '../../../design-system';

export function SwapTokensSelectNoTokensFound({
  address,
}: {
  address: string;
}) {
  const t = useTheme();

  const { copy, copied } = useCopyText({ text: address });

  return (
    <View style={[t.flexCol, t.itemsCenter, t.justifyCenter, t.pX3, t.pY10]}>
      <Coins color={t.colors.text.tertiary} size={64} strokeWidth={1.5} />
      <View style={[t.pX2, t.pY6]}>
        <Text2 color="tertiary" align="center">
          No tokens yet. Copy your address and send funds from another wallet or
          exchange to get started.
        </Text2>
      </View>
      <ButtonV2
        title={copied ? 'Address copied' : 'Copy address'}
        Icon={(props) =>
          copied ? (
            <Check size={16} {...props} />
          ) : (
            <Copy size={16} {...props} />
          )
        }
        onPress={copy}
        height="sm"
        variant="secondary"
      />
    </View>
  );
}
