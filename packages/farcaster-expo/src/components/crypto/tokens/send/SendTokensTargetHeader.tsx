import * as Clipboard from 'expo-clipboard';
import { ApiWalletSendTarget } from 'farcaster-client-data';
import { resolveUsernameShort } from 'farcaster-client-hooks';
import { ClipboardPasteIcon, PencilLineIcon } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { useSharedTelemetry, useTheme } from '../../../../contexts';
import { useSafeFocusEffect } from '../../../../hooks/useSafeFocusEffect';
import { formatAddress } from '../../../../utils';
import { Text2, TextInput } from '../../../design-system';

export function SendTokensTargetHeader({
  selection,
  clear,
  query,
  setQuery,
}: {
  selection?: ApiWalletSendTarget;
  query: string;
  setQuery: (val: string) => void;
  clear: () => void;
}) {
  const t = useTheme();
  const toast = useToast();
  const selectionName = useMemo(() => {
    if (selection) {
      switch (selection.type) {
        case 'user': {
          return resolveUsernameShort(selection.user);
        }
        case 'address': {
          return formatAddress(selection.address);
        }
      }
    }
  }, [selection]);

  const textInputRef = React.useRef<TextInput>(null);

  useSafeFocusEffect(
    React.useCallback(() => {
      if (typeof selection === 'undefined') {
        // on web this timeout is necessary to get the focus to actually work, not sure why
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      }
    }, [selection]),
  );

  const { trackError } = useSharedTelemetry();
  const handlePaste = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      setQuery(text);
    } catch (error) {
      trackError(error);
      toast.show('Failed to paste from clipboard');
    }
  }, [setQuery, toast, trackError]);

  return (
    <Pressable onPress={selection ? clear : undefined}>
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.pX4,
          t.pY2,
          Platform.OS === 'web' ? t.bgMuted : t.bgFaint,
          {
            gap: 8,
            borderRadius: 12,
          },
        ]}
      >
        <Text2 color="secondary" weight="semibold">
          To:
        </Text2>
        <View
          style={[
            t.wFull,
            t.flex1,
            t.pY2,
            t.flexRow,
            t.justifyBetween,
            { gap: 8 },
          ]}
        >
          <TextInput
            ref={textInputRef}
            onChangeText={setQuery}
            value={selectionName ?? query}
            editable={!selection}
            placeholder="Farcaster username or address"
            placeholderTextColor={t.colors.text.tertiary}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
            style={[
              t.texts.tertiary,
              t.textBase,
              selection ? t.texts.brand : t.texts.primary,
              { lineHeight: 20 },
              t.flex1,
            ]}
            onPress={selection ? clear : undefined}
          />
          {!selection && query.length === 0 && Platform.OS !== 'web' && (
            <Pressable
              style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
              onPress={handlePaste}
            >
              <ClipboardPasteIcon size={20} color={t.colors.text.brand} />
              <Text2 color="brand" weight="semibold">
                Paste
              </Text2>
            </Pressable>
          )}
        </View>
        {selection && (
          <Pressable onPress={clear}>
            <PencilLineIcon size={20} color={t.colors.text.secondary} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}
