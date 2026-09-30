import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AtomsButton, CheckBox, useAttemptBiometricAuth } from 'farcaster-expo';
import {
  AlertCircleIcon,
  BookOpenIcon,
  LockIcon,
  ShieldAlertIcon,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { CommonStackParamList } from '~/types';
import { setSecureItem } from '~/utils/SecureStorageUtils';

import { ExportPrivyWalletScreen } from './ExportPrivyWalletScreen';
import { YourRecoveryPhraseScreen } from './YourRecoveryPhraseScreen';

type RecoverFarcasterAccountScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'RecoverFarcasterAccount'
>;

type RecoverWalletAccountScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'RecoverWalletAccount'
>;

const SingleRow = ({
  title,
  icon,
  weight,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  weight?: React.ComponentProps<typeof Text2>['weight'];
  color?: string;
}) => {
  const t = useTheme();
  return (
    <View
      style={[
        t.p3,
        t.flex,
        t.flexRow,
        t.borderWhite,
        { columnGap: 8 },
        t.itemsCenter,
      ]}
    >
      <View style={[t.roundedFull, t.p2, t.bgMuted, t.bgMuted]}>{icon}</View>
      <Text2
        style={[t.flex1, color ? { color } : null]}
        size="base"
        weight={weight}
      >
        {title}
      </Text2>
    </View>
  );
};

function RecoveryPhaseConfirmModal({
  onConfirmed,
  description,
}: {
  onConfirmed: () => void;
  description: string;
}) {
  const t = useTheme();
  const [isChecked, setIsChecked] = useState(false);

  const attemptBiometricAuth = useAttemptBiometricAuth();
  const goBack = useGoBack();

  const requestingModalRef = React.useRef(false);
  const requestModal = useCallback(async () => {
    if (requestingModalRef.current) {
      return;
    }
    requestingModalRef.current = true;

    const { success } = await attemptBiometricAuth();
    if (success) {
      onConfirmed();
    } else {
      goBack();
    }
  }, [attemptBiometricAuth, goBack, onConfirmed]);

  const toggleIsChecked = React.useCallback(() => {
    setIsChecked((prevIsChecked) => !prevIsChecked);
  }, []);

  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <View style={[t.flex, t.hFull, { paddingBottom: bottomInset }]}>
      <ScrollView
        style={[t.flex1]}
        contentContainerStyle={[t.flexGrow, t.pB4]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[t.mT10, t.itemsCenter, t.justifyCenter]}>
          <View
            style={[
              t.bgMuted,
              t.itemsCenter,
              t.justifyCenter,
              t.p5,
              t.roundedFull,
            ]}
          >
            <ShieldAlertIcon size={40} color={t.colors.text.secondary} />
          </View>
        </View>
        <View style={[t.mY3, t.flex, t.justifyCenter, t.textCenter]}>
          <Text2
            weight="semibold"
            style={[t.textCenter, { lineHeight: 32, fontSize: 23 }]}
          >
            Keep Your Recovery Phrase Safe
          </Text2>
        </View>
        <Text2 style={[t.texts.secondary, t.mB3]} size="sm">
          {description}
        </Text2>
        <View style={[t.wFull]}>
          <SingleRow
            title="Your recovery phrase is like a password, keep it secret."
            icon={<LockIcon size={16} style={[t.texts.secondary, t.p2]} />}
          />
          <SingleRow
            title="If you enter it in another app, it can steal your funds and Farcaster account."
            icon={<BookOpenIcon size={16} color={t.colors.text.secondary} />}
          />
          <SingleRow
            title="We do not recommend ever sharing it with any app or person."
            icon={<AlertCircleIcon size={16} color={t.colors.text.danger} />}
            weight="semibold"
            color={t.colors.text.danger}
          />
        </View>
      </ScrollView>
      <View style={[t.pT2]}>
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.pY2, t.mB2]}>
          <CheckBox isChecked={isChecked} toggleIsChecked={toggleIsChecked} />
          <Text2 style={[t.flex1, t.mL2]}>
            I understand that sharing this key could lead to loss of funds.
          </Text2>
        </View>
        <AtomsButton
          size="l"
          hierarchy="primary"
          onPress={requestModal}
          disabled={!isChecked}
        >
          Continue
        </AtomsButton>
      </View>
    </View>
  );
}

const RecoverFarcasterAccountScreen =
  buildScreen<RecoverFarcasterAccountScreenProps>(
    {
      name: 'RecoverFarcasterAccount',
      insetTop: Platform.OS === 'android',
    },
    () => {
      return <RecoverFarcasterAccountSlider />;
    },
  );

const RecoverWalletAccountScreen = buildScreen<RecoverWalletAccountScreenProps>(
  {
    name: 'RecoverWalletAccount',
    insetTop: Platform.OS === 'android',
  },
  () => {
    return <RecoverWarpcastWalletSlider />;
  },
);

function RecoverFarcasterAccountSlider() {
  const [hasConfirmedSlider, setHasConfirmedSlider] = useState(false);
  const t = useTheme();

  const content = useMemo(() => {
    if (hasConfirmedSlider) {
      return <YourRecoveryPhraseScreen />;
    }
    return (
      <RecoveryPhaseConfirmModal
        description="Do not allow anyone to see this phrase. They will be able to control your account without your consent."
        onConfirmed={() => {
          setSecureItem({ key: 'user-backed-up-mnemonic', value: true });

          setHasConfirmedSlider(true);
        }}
      />
    );
  }, [hasConfirmedSlider]);

  return <View style={[t.mX3]}>{content}</View>;
}

function RecoverWarpcastWalletSlider() {
  const [hasConfirmedSlider, setHasConfirmedSlider] = useState(false);
  const t = useTheme();

  const content = useMemo(() => {
    if (hasConfirmedSlider) {
      return <ExportPrivyWalletScreen />;
    }
    return (
      <RecoveryPhaseConfirmModal
        description="Your wallet key controls access to your funds. Anyone with it can move assets without permission."
        onConfirmed={() => setHasConfirmedSlider(true)}
      />
    );
  }, [hasConfirmedSlider]);

  return <View style={[t.m3]}>{content}</View>;
}

RecoverFarcasterAccountScreen.displayName = 'RecoverFarcasterAccountScreen';
RecoverWalletAccountScreen.displayName = 'RecoverWalletAccountScreen';

export { RecoverFarcasterAccountScreen, RecoverWalletAccountScreen };
