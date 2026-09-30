import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiDomainManifest, ApiFrame } from 'farcaster-client-data';
import {
  generateSignedDomainManifest,
  useDevToolsFarcasterJson,
  useDevToolsStoreTempAccountAssociation,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { hexToBytes } from 'viem';

import { AppListItem } from '~/components/Apps/AppListItem';
import { ButtonV2 } from '~/components/ButtonV2';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { CommonStackParamList } from '~/types';

type DevToolsRegisterScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DevToolsRegister'
>;

const DevToolsRegisterScreen = buildScreen<DevToolsRegisterScreenProps>(
  {
    name: 'DevToolsRegister',
    insetTop: Platform.OS === 'android',
    insetBottom: true,
  },
  ({ route: { params } }) => {
    const { domain, fid } = params;
    const t = useTheme();
    const currentUser = useCurrentUser_UNSAFE();
    const isValidDomain = !!domain && !domain.startsWith('localhost');

    if (fid && currentUser.fid !== Number(fid)) {
      return (
        <View style={[t.hFull, t.p3, { gap: sizes.s4 }]}>
          <Text2 size="lg" weight="semibold" align="center">
            Association intended for a different account
          </Text2>
          <DataCard>
            <Datum name="Domain" value={domain} />
            <Datum name="Target FID" value={fid} />
            <Datum name="Your FID" value={currentUser.fid} />
          </DataCard>
        </View>
      );
    }

    if (!isValidDomain) {
      return (
        <View style={[t.hFull, t.p3, { gap: sizes.s4 }]}>
          <Text2 size="lg" weight="semibold" align="center">
            Invalid domain
          </Text2>
          <DataCard>
            <Datum name="Domain" value={domain} />
          </DataCard>
        </View>
      );
    }

    return <DevToolsRegisterScreenContent domain={domain} />;
  },
);

const DataCard = ({ children }: { children: React.ReactNode }) => {
  const t = useTheme();
  return <View style={[t.wFull, t.bgSwap, t.roundedLg]}>{children}</View>;
};

const Datum = ({
  name,
  value,
}: {
  name: string;
  value: string | React.ReactNode;
}) => {
  const t = useTheme();
  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.pX4,
        t.pY3,
        t.borderB,
        { borderColor: t.colors.bgDefault },
      ]}
    >
      <Text2 color="secondary" size="base" weight="regular">
        {name}
      </Text2>
      <Text2
        color="primary"
        size="base"
        weight="medium"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ maxWidth: '70%' }}
      >
        {value}
      </Text2>
    </View>
  );
};

const DevToolsRegisterScreenContent = ({ domain }: { domain: string }) => {
  const { address, account } = useWallet();
  const currentUser = useCurrentUser_UNSAFE();
  const t = useTheme();
  const {
    data: farcasterJson,
    isLoading,
    isError,
  } = useDevToolsFarcasterJson({ domain }) as {
    data: ApiDomainManifest | null;
    isLoading: boolean;
    isError: boolean;
  };
  const toast = useRootToast();
  const storeTempAccountAssociation = useDevToolsStoreTempAccountAssociation();
  const [signatureSent, setSignatureSent] = useState(false);
  const [sendingSignature, setSendingSignature] = useState(false);
  const frame = useMemo(() => {
    if (!farcasterJson?.frame) {
      return {
        domain,
        name: domain,
        iconUrl: '',
        homeUrl: `https://${domain}`,
        author: currentUser,
        supportsNotifications: false,
      } as ApiFrame;
    }

    return {
      domain,
      name: farcasterJson.frame.name,
      iconUrl: farcasterJson.frame.iconUrl,
      homeUrl: farcasterJson.frame.homeUrl,
      imageUrl: farcasterJson.frame.imageUrl,
      buttonTitle: farcasterJson.frame.buttonTitle,
      splashImageUrl: farcasterJson.frame.splashImageUrl,
      splashBackgroundColor: farcasterJson.frame.splashBackgroundColor,
      author: currentUser,
      supportsNotifications: !!farcasterJson.frame.webhookUrl,
    } as ApiFrame;
  }, [farcasterJson, domain, currentUser]);

  const handleGenerateSignature = async () => {
    if (address) {
      setSendingSignature(true);
      const manifest = await generateSignedDomainManifest({
        domain,
        fid: currentUser.fid,
        address,
        type: 'custody',
        signMessage: async (message) => {
          const signed = await account!.signMessage({ message });
          return hexToBytes(signed as `0x{string}`);
        },
        includeFrameConfig: false,
      });

      try {
        await storeTempAccountAssociation({
          domain,
          accountAssociation: manifest.accountAssociation,
        });
        setSignatureSent(true);
      } catch (error) {
        toast.show('Failed to send signature', {
          type: 'danger',
          placement: 'top',
        });
      } finally {
        setSendingSignature(false);
      }
    } else {
      toast.show('No custody address', { type: 'danger', placement: 'top' });
    }
  };

  if (isLoading) {
    return <FullScreenLoadingIndicator />;
  }

  if (isError) {
    return (
      <View style={[t.hFull, t.p3, { gap: sizes.s4 }]}>
        <Text2 size="lg" weight="semibold" align="center">
          Error fetching manifest
        </Text2>
        <DataCard>
          <Datum name="Domain" value={domain} />
        </DataCard>
        <Text2 size="sm" align="center">
          Please check the domain and try again.
        </Text2>
      </View>
    );
  }

  return (
    <View style={[t.hFull, t.p3, { gap: 12 }]}>
      <DataCard>
        <Datum name="Domain" value={domain} />
        <Datum name="Username" value={currentUser.username} />
        <View style={[t.flexCol, t.pX4, t.pY3, { gap: 4 }]}>
          <Text2 color="secondary" size="base" weight="regular">
            Manifest
          </Text2>
          <ScrollView
            style={[t.bgFaint, t.roundedLg, t.pY2, { maxHeight: 200 }]}
          >
            <Text2 color="primary" size="base" weight="medium" style={[t.p2]}>
              {JSON.stringify(farcasterJson, null, 2)}
            </Text2>
          </ScrollView>
        </View>
      </DataCard>
      <View style={[t.p3, t.bgSwap, t.roundedLg, { height: 60 }]}>
        <AppListItem frame={frame} frameIconSize={36} disableTapHighlight />
      </View>
      <View style={[t.flex1]} />
      <View style={[{ height: 60 }]}>
        {!signatureSent ? (
          <ButtonV2
            title={`Sign as ${currentUser.username}`}
            onPress={handleGenerateSignature}
            loading={sendingSignature}
          />
        ) : (
          <Text2 size="lg" color="success" weight="semibold" align="center">
            Signature sent, continue on desktop.
          </Text2>
        )}
      </View>
    </View>
  );
};

export { DevToolsRegisterScreen };
