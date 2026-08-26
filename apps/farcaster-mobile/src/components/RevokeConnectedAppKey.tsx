import { useFocusEffect } from '@react-navigation/native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  ApiConnectedApp,
  ApiConnectedAppWriteKey,
  formatDate,
  formatEthAddress,
  getFirstApiErrorBody,
} from 'farcaster-client-data';
import {
  useConnectedApp,
  useFetchSignerRemoveHash,
  useInvalidateConnectedApp,
  useInvalidateConnectedApps,
  useKeyTransaction,
  useOptimisticallyRemoveKey,
  useRemoveSigner,
} from 'farcaster-client-hooks';
import {
  ButtonV2,
  CheckboxWithText,
  CircleIconBadge,
  Text2,
  useRootToast,
  useTheme,
} from 'farcaster-expo';
import {
  Ban,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  PenOff,
  RefreshCwOff,
  Trash,
  Unlink,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Hex } from 'viem';

import {
  TrackEventFn,
  useAnalytics,
  useTrackEvent,
} from '~/contexts/AnalyticsProvider';
import { useWallet } from '~/contexts/WalletProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { trackError } from '~/utils/ErrorUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const WARPCAST_FID = 9152;

export function RevokeConnectedAppKey({
  appFid,
  keyType,
}: {
  appFid: number;
  keyType: 'write' | 'auth';
}) {
  const t = useTheme();

  const [selectedKey, selectKey] = useState<string>();
  const { data } = useConnectedApp({
    appFid,
  });

  const app = data.connectedApp;
  const keys = useMemo(() => {
    switch (keyType) {
      case 'auth':
        return app.authKeys;
      case 'write':
        return app.writeKeys;
      default:
        return [];
    }
  }, [app.authKeys, app.writeKeys, keyType]);

  const trackEvent = useTrackEvent(
    useMemo(
      () => ({
        appUsername: app.appUser.username,
        appFid: app.appUser.fid,
        keyType,
      }),
      [app.appUser.fid, app.appUser.username, keyType],
    ),
  );

  const key = keys.length === 1 ? keys[0].publicKey : selectedKey;

  if (WARPCAST_FID === app.appUser.fid) {
    return (
      <View style={[t.p3]}>
        <Text2 align="center" weight="semibold" size="2xl">
          Not Allowed
        </Text2>
      </View>
    );
  }

  if (key) {
    return (
      <RevokeKey
        publicKey={key}
        app={app}
        keyType={keyType}
        trackEvent={trackEvent}
      />
    );
  }

  return (
    <SelectKey
      keys={app.writeKeys}
      onSelect={selectKey}
      trackEvent={trackEvent}
    />
  );
}

function RevokeKey({
  publicKey,
  app,
  keyType,
}: {
  publicKey: string;
  app: ApiConnectedApp;
  keyType: 'write' | 'auth';
  trackEvent: TrackEventFn;
}) {
  const t = useTheme();
  const toast = useRootToast();
  const pop = usePop();
  const { account } = useWallet();
  const { trackEvent } = useAnalytics();
  const removeSigner = useRemoveSigner();
  const optimisticallyRemoveKey = useOptimisticallyRemoveKey();
  const invalidateConnectedApp = useInvalidateConnectedApp();
  const invalidateConnectedApps = useInvalidateConnectedApps();
  const fetchSignerRemoveHash = useFetchSignerRemoveHash();

  const [needsAck, setNeedsAck] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const [keyTransactionId, setKeyTransactionId] = useState<string>();

  const analyticsProperties = useMemo(
    () => ({
      appUsername: app.appUser.username,
      appFid: app.appUser.fid,
      keyType: 'write',
    }),
    [app.appUser.fid, app.appUser.username],
  );

  // If we're revoking the last key pop back to ConnectedApps,
  // otherwise return to the ConnectedApp
  const popCount = useMemo(() => {
    if (app.authKeys.length + app.writeKeys.length === 1) {
      return 2;
    }

    return 1;
  }, [app]);

  const onRevoked = useCallback(() => {
    trackEvent(AnalyticsEvent.ViewDisconnectAppCompleted, analyticsProperties);
    optimisticallyRemoveKey({
      appFid: app.appUser.fid,
      publicKey,
      keyType,
    });
    invalidateConnectedApp({ appFid: app.appUser.fid });
    invalidateConnectedApps();
    pop(popCount);
    setTimeout(() => {
      toast.show('Access revoked', {
        type: 'generic',
        data: {
          icon: <CircleCheck size={18} color={t.colors.text.brand} />,
        },
      });
    }, 150);
  }, [
    trackEvent,
    analyticsProperties,
    optimisticallyRemoveKey,
    app.appUser.fid,
    publicKey,
    keyType,
    invalidateConnectedApp,
    invalidateConnectedApps,
    pop,
    popCount,
    toast,
    t.colors.text.brand,
  ]);

  const revoke = useCallback(async () => {
    trackEvent(AnalyticsEvent.RevokeConnectedAppKey, analyticsProperties);

    try {
      setRevoking(true);
      const deadline = Math.floor(Date.now() / 1000 + 600);
      const { hash } = await fetchSignerRemoveHash({
        publicKey,
        deadline,
      });

      const signature = await account!.sign({ hash: hash as Hex });
      const { keyTransactionId } = await removeSigner({
        publicKey,
        deadline,
        signature,
      });

      setKeyTransactionId(keyTransactionId);
    } catch (e) {
      const apiError = getFirstApiErrorBody(e);

      if (apiError) {
        if (apiError.reason === 'transaction_would_revert') {
          const message = `Transaction would revert: ${apiError.data.revertError.name}.`;
          toast.show(message, { type: 'danger', placement: 'top' });
          trackEvent(AnalyticsEvent.ViewDisconnectAppFailed, {
            ...analyticsProperties,
            reason: apiError.reason,
            message,
          });

          return;
        }

        if (apiError.reason === 'signer_already_removed') {
          onRevoked();
          return;
        }
      }

      const message = 'Failed to revoke write access';
      trackEvent(AnalyticsEvent.ViewDisconnectAppFailed, {
        ...analyticsProperties,
        message,
      });
      trackError(new Error(`Failed to remove signer ${publicKey}: ${e}`));

      toast.show(message, { type: 'error', placement: 'top' });
    }
  }, [
    trackEvent,
    analyticsProperties,
    fetchSignerRemoveHash,
    publicKey,
    account,
    removeSigner,
    toast,
    onRevoked,
  ]);

  const keyTxQuery = useKeyTransaction(
    {
      keyTransactionId: keyTransactionId as string,
    },
    {
      enabled: !!keyTransactionId,
      refetchInterval: 500,
    },
  );

  useEffect(() => {
    if (keyTxQuery.data?.result.keyTransaction.completedAt) {
      onRevoked();
    }
  }, [keyTxQuery.data?.result.keyTransaction.completedAt, onRevoked]);

  useEffect(() => {
    if (keyTxQuery.data?.result.keyTransaction.failedAt) {
      pop();
      setTimeout(() => {
        toast.show('Failed to revoke access', {
          type: 'danger',
          placement: 'top',
        });
      }, 150);
    }
  }, [keyTxQuery.data?.result.keyTransaction.failedAt, pop, toast]);

  const content = useMemo(() => {
    switch (keyType) {
      case 'write':
        return <RevokeWriteContent appName={app.appUser.displayName} />;
      case 'auth':
        return <RevokeAuthContent appName={app.appUser.displayName} />;
    }
  }, [app.appUser.displayName, keyType]);

  if (WARPCAST_FID === app.appUser.fid) {
    return (
      <View style={[t.p3]}>
        <Text2 align="center" weight="semibold" size="2xl">
          Not Allowed
        </Text2>
      </View>
    );
  }

  return (
    <View style={[t.flex1, t.p3, { gap: 12 }]}>
      {content}
      <View style={[t.flex1, t.justifyEnd, { gap: 18 }]}>
        <CheckboxWithText
          toggleIsChecked={() => {
            setNeedsAck(!needsAck);
          }}
          isChecked={!needsAck}
          text="I understand the above and want to revoke access."
        />
        <ButtonV2
          title={revoking ? 'Revoking access' : 'Revoke access'}
          variant="destructive"
          loading={revoking}
          disabled={needsAck}
          onPress={revoke}
        />
      </View>
    </View>
  );
}

function SelectKey({
  keys,
  onSelect,
  trackEvent,
}: {
  keys: ApiConnectedAppWriteKey[];
  onSelect: (publicKey: string) => void;
  trackEvent: TrackEventFn;
}) {
  const t = useTheme();
  const itemsLength = keys.length;

  useFocusEffect(
    useCallback(() => {
      trackEvent(AnalyticsEvent.ViewConnectedAppRevokeSelectKey, {
        keysCount: keys.length,
      });
    }, [keys.length, trackEvent]),
  );

  const renderItem = useCallback<ListRenderItem<ApiConnectedAppWriteKey>>(
    ({ item, index }) => {
      return (
        <Pressable
          style={[
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.p4,
            t.bgLightGray,
            {
              gap: 8,
              borderTopLeftRadius: index === 0 ? 16 : 0,
              borderTopRightRadius: index === 0 ? 16 : 0,
              borderBottomLeftRadius: index === itemsLength - 1 ? 16 : 0,
              borderBottomRightRadius: index === itemsLength - 1 ? 16 : 0,
            },
            index !== 0 ? [t.borderT, t.borderBackground] : {},
          ]}
          onPress={() => {
            onSelect(item.publicKey);
          }}
        >
          <View style={[t.flex1, t.flexRow, t.justifyBetween, { gap: 8 }]}>
            <Text2>{formatEthAddress(item.publicKey)}</Text2>
            <Text2 color="secondary" size="sm">
              {formatDate(new Date(item.createdAt))}
            </Text2>
          </View>
          <View style={[t.flexNone]}>
            <ChevronRight color={t.colors.text.secondary} height={20} />
          </View>
        </Pressable>
      );
    },
    [itemsLength, onSelect, t],
  );

  const Header = useMemo(() => {
    return (
      <View>
        <Text2 color="secondary" style={[t.mB6]}>
          You have multiple keys for this application. To revoke write
          permissions revoke each of the keys.
        </Text2>
        <Text2 color="secondary" weight="semibold" style={[t.mB4]}>
          Select a key to disconnect
        </Text2>
      </View>
    );
  }, [t]);

  return (
    <FlashList
      data={keys}
      keyExtractor={(item) => item.publicKey}
      ListHeaderComponent={Header}
      contentContainerStyle={{
        ...t.pX3,
        ...t.pB3,
      }}
      {...STANDARD_FLASHLIST_PERF_PROPS}
      renderItem={renderItem}
    />
  );
}

function RevokeWriteContent({ appName }: { appName: string }) {
  const t = useTheme();

  return (
    <>
      <View style={[t.pT10, t.itemsCenter]}>
        <CircleIconBadge
          size="80"
          Icon={(props) => <Unlink {...props} />}
          variant="danger"
        />
      </View>
      <View style={[t.pX2]}>
        <Text2 align="center" weight="semibold" size="2xl">
          Revoke read and write access for {appName}
        </Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <Trash {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">All messages it created will be deleted.</Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <PenOff {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">Won’t be able to post new messages.</Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <RefreshCwOff {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">This is an onchain action.</Text2>
      </View>
    </>
  );
}

function RevokeAuthContent({ appName }: { appName: string }) {
  const t = useTheme();

  return (
    <>
      <View style={[t.pT10, t.itemsCenter]}>
        <CircleIconBadge
          size="80"
          Icon={(props) => <Unlink {...props} />}
          variant="danger"
        />
      </View>
      <View style={[t.pX2]}>
        <Text2 align="center" weight="semibold" size="2xl">
          Permanently revoke sign in access for {appName}
        </Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <Ban {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">
          This app won't be able to sign in using your Farcaster ID.
        </Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <RefreshCwOff {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">This is a permanent onchain action.</Text2>
      </View>
      <View style={[t.p3, t.flexRow, t.itemsCenter, { gap: 8 }]}>
        <CircleIconBadge
          size="32"
          Icon={(props) => <CircleAlert {...props} />}
          variant="danger"
        />
        <Text2 weight="medium">
          You won&apos;t be able to reconnect it later.
        </Text2>
      </View>
    </>
  );
}
