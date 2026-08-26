import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { ApiDomainManifestState } from 'farcaster-client-data';
import {
  generateSignedDomainManifest,
  useGetDomainManifestState,
  useRefreshDomainManifestState,
} from 'farcaster-client-hooks';
import { CheckBox, useRootToast } from 'farcaster-expo';
import React, { FC, useCallback, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { hexToBytes } from 'viem';

import { ButtonV2 } from '~/components/ButtonV2';
import { OrderedListItem } from '~/components/OrderedListItem';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { TextWithPress } from '~/components/TextWithPress';
import { hitSlop } from '~/constants/Pressable';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { CommonStackParamList } from '~/types';
import { getStorage } from '~/utils/FastStorageUtils';

type DevToolsDomainsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DevToolsDomains'
>;

const DevToolsDomainsScreen = buildScreen<DevToolsDomainsScreenProps>(
  { name: 'DevToolsDomains', avoidKeyboard: true },
  ({ route: { params } }) => {
    const t = useTheme();

    return (
      <ScrollView contentContainerStyle={[t.p3]}>
        <DomainAssociation domain={params.domain} />
      </ScrollView>
    );
  },
);

const DOMAIN_VALIDATION_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

function DomainAssociation({ domain: initDomain }: { domain?: string }) {
  const t = useTheme();
  const { address, account } = useWallet();
  const currentUser = useCurrentUser_UNSAFE();
  const toast = useRootToast();
  const getDomainManifestState = useGetDomainManifestState();
  const refreshDomainManifestState = useRefreshDomainManifestState();

  const [domain, setDomain] = useState(
    () => initDomain ?? getStorage().getString('debug_app_frame.domain') ?? '',
  );
  const [includeFrameConfig, setIncludeFrameConfig] = useState(true);
  const [stringManifest, setStringManifest] = useState('');

  const [domainManifestState, setDomainManifestState] = useState<
    ApiDomainManifestState | undefined
  >(undefined);
  const [stringManifestState, setStringManifestState] = useState<
    ApiDomainManifestState | undefined
  >(undefined);

  const validateDomain = useCallback(
    (validateDomain: string) => {
      const useDomain = validateDomain.startsWith('https://')
        ? validateDomain.slice(8)
        : validateDomain;

      if (!DOMAIN_VALIDATION_REGEX.test(useDomain)) {
        toast.show('Invalid domain', {
          type: 'danger',
          placement: 'top',
        });
        return undefined;
      }

      return useDomain;
    },
    [toast],
  );

  const doGenerateDomainManifest = useCallback(
    async (generateDomain: string) => {
      const useDomain = validateDomain(generateDomain);
      if (!useDomain) {
        return;
      }

      if (address) {
        const manifest = await generateSignedDomainManifest({
          domain: useDomain,
          fid: currentUser.fid,
          address,
          type: 'custody',
          signMessage: async (message) => {
            const signed = await account!.signMessage({ message });
            return hexToBytes(signed as `0x{string}`);
          },
          includeFrameConfig,
        });

        await Clipboard.setStringAsync(JSON.stringify(manifest, null, 2));
        toast.show('Manifest copied', { placement: 'top' });
      } else {
        toast.show('No custody address', { type: 'danger', placement: 'top' });
      }
    },
    [
      validateDomain,
      address,
      currentUser.fid,
      includeFrameConfig,
      toast,
      account,
    ],
  );

  const verifyStringManifest = useCallback(async () => {
    setStringManifestState(undefined);
    try {
      const state = await getDomainManifestState({ manifest: stringManifest });
      setStringManifestState(state);
    } catch (e) {
      toast.show('Failed to fetch state, please notify the team', {
        type: 'danger',
        placement: 'top',
      });
    }
  }, [getDomainManifestState, stringManifest, toast]);

  const refreshManifest = useCallback(async () => {
    setDomainManifestState(undefined);

    const useDomain = validateDomain(domain);
    if (!useDomain) {
      return;
    }

    try {
      const state = await refreshDomainManifestState({ domain: useDomain });
      setDomainManifestState(state);
    } catch (e) {
      toast.show('Failed to fetch state, please notify the team', {
        type: 'danger',
        placement: 'top',
      });
    }
  }, [domain, refreshDomainManifestState, toast, validateDomain]);

  return (
    <>
      <View style={{ gap: 12 }}>
        <View>
          <Text2 style={[t.mT1]}>
            <Text2 weight="semibold">Domain Manifest</Text2>{' '}
            <TextWithPress
              style={[t.texts.brand, t.textXs]}
              onPress={() => {
                Linking.openURL(
                  'https://github.com/farcasterxyz/protocol/discussions/205#domain-account-association',
                );
              }}
            >
              view docs
            </TextWithPress>
          </Text2>
        </View>
        <View>
          <Text2 weight="medium" size="xs" color="tertiary" style={[t.mB1]}>
            Instructions
          </Text2>
          <OrderedListItem
            text="Use the tool below to generate a domain manifest with a signed domain association to your account (+ an optional example frame config)"
            textStyle={[t.textSm, t.pB2]}
            index={0}
          />
          <OrderedListItem
            text="Host it on the exact domain you entered at /.well-known/farcaster.json (fill out the frame config if you included it)"
            textStyle={[t.textSm, t.pB2]}
            index={1}
          />
          <OrderedListItem
            text="Return here and to check that status of your verification"
            textStyle={[t.textSm, t.pB2]}
            index={2}
          />
        </View>
        <View>
          <View>
            <Text2 weight="medium" size="xs" color="secondary">
              Domain without protocol (ex: farcaster.xyz)
            </Text2>
            <TextInput
              onChangeText={(value) => setDomain(value.trim().toLowerCase())}
              value={domain}
              numberOfLines={2}
              multiline
              inputStyle={[t.textSm]}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        </View>
        <Pressable
          style={[t.flexRow, t.itemsCenter, t.mT2, { gap: 8 }]}
          onPress={() => {
            setIncludeFrameConfig((value) => !value);
          }}
        >
          <CheckBox
            isChecked={includeFrameConfig}
            toggleIsChecked={() => {
              setIncludeFrameConfig((value) => !value);
            }}
          />
          <Text2 weight="medium" size="xs" color="secondary">
            Include example frame definition
          </Text2>
        </Pressable>
        {domainManifestState && (
          <DomainManifestState
            manifestState={domainManifestState}
            verifiedOnBackend={true}
            checkDomain={domain}
            doGenerateDomainManifest={doGenerateDomainManifest}
          />
        )}
        <View style={[t.flexRow, t.wFull]}>
          <ButtonV2
            title="Generate domain manifest"
            onPress={() => doGenerateDomainManifest(domain)}
            disabled={!domain}
            width="flex1"
          />
        </View>
        <View style={[{ gap: 8 }, t.flexRow, t.wFull]}>
          <ButtonV2
            title="Check domain status"
            variant="secondary"
            onPress={refreshManifest}
            disabled={!domain}
            width="flex1"
          />
        </View>
        <View style={[t.mT2]}>
          <Text2 weight="semibold">Verify Domain Manifest</Text2>
        </View>
        <View>
          <Text2 weight="medium" size="xs" color="tertiary" style={[t.mB1]}>
            Instructions
          </Text2>
          <Text2 size="sm" style={[t.pB2]}>
            Paste your domain manifest JSON into this tool to validate the
            format and verify the signed account association
          </Text2>
        </View>
        <View>
          <View style={[t.flexRow, t.mB2, { gap: sizes.s2 }]}>
            <Text2 weight="medium" size="xs" color="secondary">
              Manifest (JSON){' '}
            </Text2>
            <TouchableOpacity
              hitSlop={hitSlop}
              onPress={() => setStringManifest('')}
            >
              <Text2 size="xs" color="brand">
                Clear
              </Text2>
            </TouchableOpacity>
          </View>
          <TextInput
            onChangeText={setStringManifest}
            value={stringManifest}
            numberOfLines={5}
            multiline
            inputStyle={[t.textSm, t.h40]}
            placeholder="{}"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>
        {stringManifestState && (
          <DomainManifestState
            manifestState={stringManifestState}
            verifiedOnBackend={false}
            checkDomain={domain}
            doGenerateDomainManifest={doGenerateDomainManifest}
          />
        )}
        <View style={[t.flexRow, t.wFull]}>
          <ButtonV2
            title="Verify domain manifest"
            onPress={verifyStringManifest}
            disabled={!stringManifest}
            width="flex1"
          />
        </View>
      </View>
    </>
  );
}
DevToolsDomainsScreen.displayName = 'DevToolsDomainsScreen';

interface DomainManifestStateProps {
  manifestState: ApiDomainManifestState;
  verifiedOnBackend: boolean;
  checkDomain: string;
  doGenerateDomainManifest: (domain: string) => void;
}

const DomainManifestState: FC<DomainManifestStateProps> = ({
  manifestState,
  verifiedOnBackend,
  checkDomain,
  doGenerateDomainManifest,
}) => {
  const t = useTheme();

  const domain = manifestState.decodedManifest?.accountAssociation.domain;

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text2 weight="medium" size="xs" color="secondary" style={[t.mB1]}>
          Status
        </Text2>
        {manifestState.verified ? (
          <>
            <Text2 weight="semibold" style={[t.texts.success]}>
              {verifiedOnBackend
                ? 'Verified'
                : `Valid for domain ${domain}, ensure you host it there`}
            </Text2>
            {manifestState.message && (
              <Text2 size="xs" style={[t.fontMono]}>
                {manifestState.message ? `: ${manifestState.message}` : ''}
              </Text2>
            )}
          </>
        ) : (
          <Text2 color="danger">
            {manifestState.message ?? 'Unknown error, let the team know'}
          </Text2>
        )}
        {domain !== undefined &&
          manifestState.message?.includes(
            'The domain specified in the manifest is',
          ) && (
            <View style={[t.mT2]}>
              <ButtonV2
                title={`Generate manifest for ${checkDomain}`}
                onPress={() => doGenerateDomainManifest(checkDomain)}
              />
            </View>
          )}
      </View>
      {manifestState.manifest && (
        <View>
          <Text2 weight="medium" size="xs" color="secondary" style={[t.mB1]}>
            Validated manifest
          </Text2>
          <Text2 size="xs" style={[t.fontMono]}>
            {manifestState.manifest}
          </Text2>
        </View>
      )}
      {manifestState.decodedManifest && (
        <View>
          <Text2 weight="medium" size="xs" color="secondary" style={[t.mB1]}>
            Decoded values:
          </Text2>
          <Text2 size="xs">
            Fid: {manifestState.decodedManifest.accountAssociation.fid}
          </Text2>
          <Text2 size="xs">
            Domain: {manifestState.decodedManifest.accountAssociation.domain}
          </Text2>
          <Text2 size="xs">
            App key: {manifestState.decodedManifest.accountAssociation.key}
          </Text2>
          <Text2 size="xs">
            Signature:{' '}
            {manifestState.decodedManifest.accountAssociation.signature}
          </Text2>
        </View>
      )}
    </View>
  );
};

export { DevToolsDomainsScreen };
