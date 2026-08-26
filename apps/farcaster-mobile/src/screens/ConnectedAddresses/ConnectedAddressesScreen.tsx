import AntDesign from '@expo/vector-icons/build/AntDesign';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiVerification,
  ApiVerificationProtocol,
} from 'farcaster-client-data';
import {
  useDeleteVerification,
  useSetPrimaryAddress,
  useVerificationsWithRefreshOnMount,
} from 'farcaster-client-hooks';
import { useEmbeddedWallet, useRootToast } from 'farcaster-expo';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Text2, TextColor } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { usePush } from '~/hooks/navigation/usePush';
import { useVerifyEmbeddedWallet } from '~/hooks/useVerifyEmbeddedWallet';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

import { Verification } from './Verification';

type ConnectedAddressesScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectedAddresses'
>;

const PROTOCOL_NAMES: Record<ApiVerificationProtocol, string> = {
  ethereum: 'Ethereum',
  solana: 'Solana',
};

const TouchableText = ({
  text,
  onPress,
  noBorder,
  color,
  icon,
}: {
  text: string;
  onPress: () => void;
  noBorder?: boolean;
  color: TextColor;
  icon: React.ReactNode;
}) => {
  const t = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        t.flex,
        t.flexRow,
        t.p4,
        t.borderFaint,
        noBorder ? null : t.borderB,
        t.itemsCenter,
        t.justifyBetween,
      ]}
    >
      <Text2 size="base" color={color} weight="medium">
        {text}
      </Text2>
      {icon}
    </TouchableOpacity>
  );
};

const StarIcon = () => {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path
        d="M9.60416 1.91249C9.64068 1.83871 9.6971 1.7766 9.76704 1.73318C9.83698 1.68976 9.91767 1.66675 9.99999 1.66675C10.0823 1.66675 10.163 1.68976 10.233 1.73318C10.3029 1.7766 10.3593 1.83871 10.3958 1.91249L12.3208 5.81166C12.4476 6.0683 12.6348 6.29033 12.8663 6.4587C13.0979 6.62708 13.3668 6.73675 13.65 6.77833L17.955 7.40833C18.0366 7.42015 18.1132 7.45455 18.1762 7.50766C18.2393 7.56077 18.2862 7.63045 18.3117 7.70883C18.3372 7.78721 18.3402 7.87117 18.3205 7.95119C18.3007 8.03121 18.259 8.10412 18.2 8.16166L15.0867 11.1933C14.8813 11.3934 14.7277 11.6404 14.639 11.913C14.5503 12.1856 14.5292 12.4757 14.5775 12.7583L15.3125 17.0417C15.3269 17.1232 15.3181 17.2071 15.2871 17.2839C15.2561 17.3607 15.2041 17.4272 15.1371 17.4758C15.0701 17.5245 14.9908 17.5533 14.9082 17.5591C14.8256 17.5648 14.7431 17.5472 14.67 17.5083L10.8217 15.485C10.5681 15.3518 10.286 15.2823 9.99958 15.2823C9.71318 15.2823 9.43106 15.3518 9.17749 15.485L5.32999 17.5083C5.25694 17.547 5.17449 17.5644 5.09204 17.5585C5.00958 17.5527 4.93043 17.5238 4.86357 17.4752C4.79672 17.4266 4.74485 17.3602 4.71387 17.2835C4.68289 17.2069 4.67404 17.1231 4.68833 17.0417L5.42249 12.7592C5.47099 12.4764 5.44998 12.1862 5.36128 11.9134C5.27257 11.6406 5.11883 11.3935 4.91333 11.1933L1.79999 8.16249C1.74049 8.10502 1.69832 8.03199 1.6783 7.95172C1.65827 7.87145 1.66119 7.78717 1.68673 7.70849C1.71226 7.6298 1.75938 7.55986 1.82272 7.50665C1.88607 7.45343 1.96308 7.41908 2.04499 7.40749L6.34916 6.77833C6.63271 6.73708 6.90199 6.62754 7.13381 6.45915C7.36564 6.29076 7.55308 6.06855 7.67999 5.81166L9.60416 1.91249Z"
        stroke="black"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const TrashIcon = () => {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.5 5H17.5"
        stroke="#D51338"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.8334 5V16.6667C15.8334 17.5 15 18.3333 14.1667 18.3333H5.83335C5.00002 18.3333 4.16669 17.5 4.16669 16.6667V5"
        stroke="#D51338"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.66669 5.00008V3.33341C6.66669 2.50008 7.50002 1.66675 8.33335 1.66675H11.6667C12.5 1.66675 13.3334 2.50008 13.3334 3.33341V5.00008"
        stroke="#D51338"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.33331 9.16675V14.1667"
        stroke="#D51338"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11.6667 9.16675V14.1667"
        stroke="#D51338"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export function VerificationDetailsPanel({
  verification,
  onDismiss,
  onSetAsPrimary,
  onRemove,
}: {
  verification: ApiVerification;
  onDismiss: () => void;
  onSetAsPrimary: (verification: ApiVerification) => void;
  onRemove: (verification: ApiVerification) => void;
}) {
  const t = useTheme();
  const { evmAddress } = useEmbeddedWallet();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const isPrimary = verification.isPrimary;
  const isWarplet =
    verification.address.toLowerCase() === evmAddress?.toLowerCase();
  return (
    <AutoDisplayingBottomSheetModal
      name="detailsPanelInfoBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[
          t.flex,
          t.flexCol,
          t.justifyBetween,
          t.borderFaint,
          t.border,
          t.roundedLg,
          t.wFull,
        ]}
      >
        {!isPrimary && (
          <TouchableText
            text="Set as Primary"
            onPress={() => onSetAsPrimary(verification)}
            // Do not set the border if this is the only option
            noBorder={isWarplet}
            color="primary"
            icon={<StarIcon />}
          />
        )}
        {!isWarplet && (
          <TouchableText
            text="Remove"
            onPress={() => onRemove(verification)}
            noBorder
            color="danger"
            icon={<TrashIcon />}
          />
        )}
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

export function RemoveVerificationPanel({
  verification,
  onDismiss,
  onConfirmRemoval,
}: {
  verification: ApiVerification;
  onConfirmRemoval: (verification: ApiVerification) => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  return (
    <AutoDisplayingBottomSheetModal
      name="detailsPanelInfoBottomSheet"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View
        style={[t.flexGrow, t.flex, t.flexCol, t.justifyBetween, { gap: 8 }]}
      >
        <View style={[t.flex, t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View
            style={[
              t.roundedFull,
              t.w8,
              t.h8,
              t.itemsCenter,
              t.justifyCenter,
              t.bgErrorBubble,
            ]}
          >
            <TrashIcon />
          </View>
          <Text2 weight="semibold" size="lg">
            Remove address
          </Text2>
        </View>
        <Text2 color="primary" size="base" weight="regular" style={[t.mB6]}>
          Removes the verified address from your Farcaster profile. You can add
          it back later by connecting to this wallet again.
        </Text2>
        <View style={[t.flex, t.flexRow, { gap: 12 }, t.wFull]}>
          <ButtonV2
            width="flex1"
            title="Cancel"
            onPress={() => {
              bottomSheetRef.current?.dismiss();
            }}
            variant="tertiary"
            height="normal"
            textSize="lg"
          />
          <ButtonV2
            variant="destructive"
            width="flex1"
            title="Remove"
            onPress={() => {
              onConfirmRemoval(verification);
              bottomSheetRef.current?.dismiss();
            }}
            height="normal"
            textSize="lg"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function ProtocolConnectedAddresses({
  verifications,
  protocol,
}: {
  verifications: ApiVerification[];
  protocol: ApiVerificationProtocol;
}) {
  const t = useTheme();
  const [selectedVerification, setSelectedVerification] =
    useState<ApiVerification | null>(null);
  const [selectedToRemove, setSelectedToRemove] =
    useState<ApiVerification | null>(null);

  const { fid } = useCurrentUser_UNSAFE();
  const toast = useRootToast();
  const deleteVerification = useDeleteVerification();
  const putVerification = useSetPrimaryAddress({ fid });

  useEffect(() => {
    setSelectedToRemove(null);
  }, [selectedVerification]);

  const onDeleteVerification = useCallback(
    async (verification: ApiVerification) => {
      await deleteVerification({
        fid,
        protocol,
        signerAddress: verification.address,
      });
      toast.show('Address removed', {
        type: 'normal',
        placement: 'bottom',
        normalColor: '#24292E',
        icon: <AntDesign name="check-circle" size={20} color="white" />,
        style: [{ borderRadius: 14 }],
      });
    },
    [deleteVerification, fid, protocol, toast],
  );

  const onSetAsPrimary = useCallback(
    async (verification: ApiVerification) => {
      await putVerification.mutate(verification);
      const protocolName = PROTOCOL_NAMES[verification.protocol];
      toast.show(`Primary ${protocolName} Address updated`, {
        type: 'normal',
        placement: 'bottom',
        normalColor: '#24292E',
        icon: <AntDesign name="check-circle" size={20} color="white" />,
        style: [{ borderRadius: 14 }],
      });
      setSelectedVerification(null);
    },
    [putVerification, toast],
  );

  const verificationDetailsPanel = useMemo(() => {
    if (selectedToRemove) {
      return (
        <RemoveVerificationPanel
          verification={selectedToRemove}
          onDismiss={() => setSelectedVerification(null)}
          onConfirmRemoval={onDeleteVerification}
        />
      );
    }
    if (selectedVerification) {
      return (
        <VerificationDetailsPanel
          verification={selectedVerification}
          onDismiss={() => setSelectedVerification(null)}
          onSetAsPrimary={onSetAsPrimary}
          onRemove={() => {
            setSelectedToRemove(selectedVerification);
          }}
        />
      );
    }
    return null;
  }, [
    selectedVerification,
    selectedToRemove,
    onDeleteVerification,
    onSetAsPrimary,
  ]);

  if (verifications.length === 0) {
    return null;
  }

  return (
    <View style={[t.justifyBetween, t.mT3]}>
      <Text2 size="base" color="secondary" weight="medium" style={[t.mB3]}>
        {PROTOCOL_NAMES[protocol]}
      </Text2>
      <View style={[t.borderFaint, t.border, t.roundedLg, t.wFull]}>
        {verifications.map((verification, index) => (
          <Verification
            key={verification.address}
            verification={verification}
            onClick={setSelectedVerification}
            idx={index}
            numVerifications={verifications.length}
          />
        ))}
      </View>
      {verificationDetailsPanel}
    </View>
  );
}

const ConnectedAddressesScreen = buildScreen<ConnectedAddressesScreenProps>(
  { name: 'ConnectedAddresses' },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const toast = useRootToast();
    const { fid } = useCurrentUser_UNSAFE();
    const { data } = useVerificationsWithRefreshOnMount({ fid });
    const { evmAddress, solanaAddress } = useEmbeddedWallet();
    const { verifyEvmEmbeddedWallet, verifySolanaEmbeddedWallet } =
      useVerifyEmbeddedWallet();
    const [isVerifyingEvm, setIsVerifyingEvm] = useState(false);
    const [isVerifyingSolana, setIsVerifyingSolana] = useState(false);

    const verifications = useMemo(
      () => data?.pages.flatMap((page) => page.result.verifications) || [],
      [data],
    );

    const hasUnverifiedEvmAddress: boolean = useMemo(() => {
      if (!evmAddress) {
        return false;
      }
      return !verifications.some(
        (verification) =>
          verification.protocol === 'ethereum' &&
          verification.address.toLowerCase() === evmAddress?.toLowerCase(),
      );
    }, [verifications, evmAddress]);

    const hasUnverifiedSolanaAddress: boolean = useMemo(() => {
      if (!solanaAddress) {
        return false;
      }
      return !verifications.some(
        (verification) =>
          verification.protocol === 'solana' &&
          verification.address.toLowerCase() === solanaAddress?.toLowerCase(),
      );
    }, [verifications, solanaAddress]);

    const push = usePush();

    const handleVerifyEvmEmbeddedWallet = useCallback(async () => {
      trackEvent(AnalyticsEvent.StartAddressVerification, {});
      setIsVerifyingEvm(true);

      try {
        await verifyEvmEmbeddedWallet();
        toast.show('Farcaster wallet address verified', {
          type: 'success',
          placement: 'top',
          normalColor: '#24292E',
          icon: <AntDesign name="check-circle" size={20} color="white" />,
        });
      } catch (error) {
        toast.show('Error verifying Farcaster wallet address', {
          type: 'warning',
          placement: 'top',
        });
        trackError(error);
      } finally {
        setIsVerifyingEvm(false);
      }
    }, [verifyEvmEmbeddedWallet, trackEvent, toast, setIsVerifyingEvm]);

    const handleVerifySolanaEmbeddedWallet = useCallback(async () => {
      trackEvent(AnalyticsEvent.StartAddressVerification, {});
      setIsVerifyingSolana(true);

      try {
        await verifySolanaEmbeddedWallet();
        toast.show('Farcaster wallet address verified', {
          type: 'success',
          placement: 'top',
          normalColor: '#24292E',
          icon: <AntDesign name="check-circle" size={20} color="white" />,
        });
      } catch (error) {
        toast.show('Error verifying Farcaster wallet address', {
          type: 'warning',
          placement: 'top',
        });
        trackError(error);
      } finally {
        setIsVerifyingSolana(false);
      }
    }, [verifySolanaEmbeddedWallet, trackEvent, toast, setIsVerifyingSolana]);

    const solanaVerifications = useMemo(() => {
      return verifications.filter(
        (verification) => verification.protocol === 'solana',
      );
    }, [verifications]);

    const ethVerifications = useMemo(() => {
      return verifications.filter(
        (verification) => verification.protocol === 'ethereum',
      );
    }, [verifications]);

    return (
      <SafeAreaView>
        <View style={[t.hFull, t.p4]}>
          <View style={[t.hFull, t.flex, t.flexCol, t.justifyBetween]}>
            <ScrollView
              style={[t.flex, t.flexGrow]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[t.flexGrow]}
            >
              {verifications.length === 0 ? (
                <View>
                  <Text2 style={[t.texts.primary, t.textBase]}>
                    By verifying an address, you can prove ownership of NFTs.
                  </Text2>
                </View>
              ) : (
                <View style={[t.textSm]}>
                  <Text2 size="sm" color="secondary" style={[]}>
                    Addresses you've proven ownership of on Farcaster. Set one
                    as primary to receive rewards, tips, and tokens.
                  </Text2>
                  <ProtocolConnectedAddresses
                    verifications={ethVerifications}
                    protocol="ethereum"
                  />
                  <ProtocolConnectedAddresses
                    verifications={solanaVerifications}
                    protocol="solana"
                  />
                </View>
              )}
            </ScrollView>
            <View style={[t.flex, t.flexCol, { gap: 8 }, t.mT4]}>
              {hasUnverifiedEvmAddress && (
                <ButtonV2
                  title="Verify Farcaster wallet"
                  onPress={handleVerifyEvmEmbeddedWallet}
                  loading={isVerifyingEvm}
                  disabled={isVerifyingEvm || isVerifyingSolana}
                />
              )}
              {hasUnverifiedSolanaAddress && (
                <ButtonV2
                  title="Verify Solana wallet"
                  onPress={handleVerifySolanaEmbeddedWallet}
                  loading={isVerifyingSolana}
                  disabled={isVerifyingSolana || isVerifyingEvm}
                />
              )}
              <ButtonV2
                title={
                  verifications.length === 0
                    ? 'Verify an address'
                    : 'Verify another address'
                }
                variant={
                  hasUnverifiedEvmAddress || hasUnverifiedSolanaAddress
                    ? 'secondary'
                    : 'primary'
                }
                onPress={() => {
                  trackEvent(AnalyticsEvent.StartAddressVerification, {});
                  push('ConnectAddress', {});
                }}
                disabled={isVerifyingEvm || isVerifyingSolana}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  },
);

ConnectedAddressesScreen.displayName = 'ConnectedAddressesScreen';

export { ConnectedAddressesScreen };
