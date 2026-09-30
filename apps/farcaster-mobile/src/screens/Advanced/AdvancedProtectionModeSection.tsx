import { useDisableTotp, useTotpEnabledQuery } from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { LoadingIndicator } from '~/components/LoadingIndicator';
import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { SecureModeBottomDisableSheet } from '~/screens/SecureMode/SecureModeDisableBottomSheet';

const AdvancedProtectionModeSection = () => {
  const t = useTheme();
  const push = usePush();
  const [enabled, setEnabled] = useState<boolean>(false);
  const { data, isPending, isError, refetch } = useTotpEnabledQuery();
  const disableTotp = useDisableTotp();
  const { account } = useWallet();
  const toast = useRootToast();
  const [showDisableSheet, setShowDisableSheet] = useState(false);

  const handleToggle = useCallback(() => {
    if (enabled) {
      setShowDisableSheet(true);
    } else {
      push('SecureModeSetup', {
        onComplete: () => {
          refetch();
        },
        source: 'advanced-protection-toggle',
      });
    }
  }, [enabled, push, refetch]);

  const handleDisable = useCallback(async () => {
    setShowDisableSheet(false);
    try {
      await disableTotp({
        account: account!,
      });
      toast.show('Advanced Protection disabled', {
        type: 'success',
      });
      refetch();
    } catch {
      toast.show('Failed to disable Advanced Protection', {
        type: 'danger',
      });
    }
  }, [disableTotp, account, toast, refetch]);

  useEffect(() => {
    if (data) {
      setEnabled(data.result.enabled);
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      toast.show('Failed to check Advanced Protection status', {
        type: 'danger',
      });
    }
  }, [isError, toast]);

  return (
    <>
      <View
        style={[
          t.pB4,
          t.mB4,
          t.borderBHairline,
          t.borderDefault,
          t.flexRow,
          t.justifyBetween,
          t.itemsCenter,
        ]}
      >
        <View style={[t.flexCol, { maxWidth: '80%' }]}>
          <Text style={[t.texts.primary, t.textBase, t.fontSemibold, t.mB2]}>
            Advanced Protection
          </Text>
          <Text style={[t.texts.secondary, t.textSm]}>
            Add an extra layer of security with stronger authentication for
            account recovery and web logins.
          </Text>
        </View>
        {isPending ? (
          <LoadingIndicator size="small" />
        ) : (
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={isError}
          />
        )}
      </View>
      {showDisableSheet && account !== undefined && (
        <SecureModeBottomDisableSheet
          onConfirm={handleDisable}
          onDismiss={() => setShowDisableSheet(false)}
        />
      )}
    </>
  );
};

export { AdvancedProtectionModeSection };
