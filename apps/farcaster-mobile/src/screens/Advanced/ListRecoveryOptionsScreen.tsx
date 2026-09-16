import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AtomsButton, useSecondaryWalletsVisible } from 'farcaster-expo';
import React, { FC } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList, ScreenName } from '~/types';

const ExportKeySection: FC<{
  newView: ScreenName;
  title: string;
  description: string;
  buttonText: string;
}> = ({ newView, title, description, buttonText }) => {
  const t = useTheme();
  const push = usePush();
  return (
    <View style={[t.mB4, t.pB4, t.borderDefault, t.borderBHairline]}>
      <View style={[t.flex, t.flex1, t.mB3]}>
        <Text2 weight="semibold">{title}</Text2>
        <Text2 color="secondary" size="sm">
          {description}
        </Text2>
      </View>
      <AtomsButton
        hierarchy="danger"
        onPress={() => push(newView, {})}
        size="l"
      >
        {buttonText}
      </AtomsButton>
    </View>
  );
};

type ListRecoveryOptionsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ListRecoveryOptions'
>;

const ListRecoveryOptionsScreen = buildScreen<ListRecoveryOptionsScreenProps>(
  { name: 'ListRecoveryOptions' },
  () => {
    const t = useTheme();
    const insets = useSafeAreaInsets();
    const secondaryWalletsVisible = useSecondaryWalletsVisible();

    return (
      <ScrollView
        style={[t.hFull]}
        contentContainerStyle={[t.p4, { paddingBottom: insets.bottom }]}
      >
        <View style={[t.mB4, t.pB4, t.borderDefault, t.borderBHairline]}>
          <Text2 color="secondary" size="sm">
            These actions reveal sensitive secrets. Anyone with your recovery
            phrase has full control of your account. Only proceed in a private
            environment.
          </Text2>
        </View>
        <ExportKeySection
          newView="RecoverWalletAccount"
          title={
            secondaryWalletsVisible
              ? 'Show wallet recovery phrases'
              : 'Show wallet recovery phrase'
          }
          description={
            secondaryWalletsVisible
              ? 'View and export the recovery phrase and private keys for your Farcaster wallets, including secondary wallets.'
              : 'View and export the recovery phrase for your Farcaster client wallet.'
          }
          buttonText={
            secondaryWalletsVisible
              ? 'Show wallet recovery phrases'
              : 'Show wallet recovery phrase'
          }
        />
        <ExportKeySection
          newView="RecoverFarcasterAccount"
          title="Show Farcaster recovery phrase"
          description="View and export the recovery phrase for your Farcaster account."
          buttonText="Show Farcaster recovery phrase"
        />
      </ScrollView>
    );
  },
);

ListRecoveryOptionsScreen.displayName = 'ListRecoveryOptionsScreen';

export { ListRecoveryOptionsScreen };
