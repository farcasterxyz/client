import { getStoredPasskeys, isPasskeysSupported } from 'farcaster-cryptography';
import { AtomsButton } from 'farcaster-expo';
import React, { FC, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';

import { Text } from '~/components/Text';
import { useFarcasterCryptographyKeyStore } from '~/contexts/FarcasterCryptographyKeyStoreProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { trackError } from '~/utils/ErrorUtils';

const AdvancedPasskeysSection: FC = () => {
  const t = useTheme();
  const push = usePush();

  const { keyStore } = useFarcasterCryptographyKeyStore();
  const [alreadyRegisteredPasskey, setAlreadyRegisteredPasskey] =
    useState<boolean>();
  const [canRegisterPasskey, setCanRegisterPasskey] = useState<boolean>();

  useEffect(() => {
    isPasskeysSupported({ keyStore })
      .then(async (supported) => {
        if (supported) {
          const keys = await getStoredPasskeys({ keyStore });
          setAlreadyRegisteredPasskey(keys.length !== 0);
          setCanRegisterPasskey(true);
        } else {
          setCanRegisterPasskey(false);
        }
      })
      .catch(trackError);
  }, [keyStore]);

  if (!canRegisterPasskey) {
    return null;
  }

  return (
    <View style={[t.pB4, t.mB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flexRow, t.mB2]}>
        <Text style={[t.texts.primary, t.textBase, t.fontSemibold]}>
          {Platform.OS === 'ios'
            ? 'Manage iCloud backup'
            : 'Manage Passkey backup'}
        </Text>
      </View>
      <Text style={[t.texts.secondary, t.textSm, t.mB4]}>
        If you are having issues logging in with your passkey, you can remove
        it.
      </Text>
      <View style={[t.mT6]}>
        <AtomsButton
          disabled={!alreadyRegisteredPasskey}
          onPress={() => {
            push('AdvancedPasskeys', {});
          }}
          hierarchy="primary"
          size="l"
        >
          Manage existing passkeys
        </AtomsButton>
      </View>
    </View>
  );
};

export { AdvancedPasskeysSection };
