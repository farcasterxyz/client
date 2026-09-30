import { Image } from 'expo-image';
import { ApiWalletActivity, formatDecimal } from 'farcaster-client-data';
import {
  CircleSlashIcon,
  Repeat,
  RocketIcon,
  SendHorizonalIcon,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { AutoDisplayingBottomSheetModal } from '../../../components/bottom-sheet';
import { useEmbeddedWallet } from '../../../contexts/EmbeddedWalletContext';
import { useRootToast } from '../../../contexts/RootToastProvider';
import { useSharedTelemetry } from '../../../contexts/SharedTelemetryContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useHaptics } from '../../../hooks/useHaptics';
import {
  AlterTransactionState,
  useWalletAlterTransaction,
} from '../../../hooks/useWalletAlterTransaction';
import { PendingTransaction } from '../../../hooks/useWalletPendingTransactions';
import { formatValue } from '../../../utils';
import { ButtonV2, Text2 } from '../../design-system';
import {
  ActivityTokenIcon,
  ActivityTypeStatus,
  getNameFromActivity,
} from './WalletActivityItem';

const ForgetTransactionBottomSheet = ({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}) => {
  const t = useTheme();
  return (
    <AutoDisplayingBottomSheetModal
      name="forget-transaction"
      onDismiss={onDismiss}
    >
      <View style={[{ gap: 16 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <Text2 weight="semibold" size="xl">
            Forget transaction
          </Text2>
        </View>
        <Text2 color="primary">
          This will remove the pending transaction from Farcaster. You will no
          longer be able to cancel or speed up the transaction within Farcaster.
        </Text2>
        <View style={[t.flexRow, { gap: 8 }]}>
          <ButtonV2
            variant="secondary"
            title="Close"
            onPress={onDismiss}
            width="flex1"
          />
          <ButtonV2
            variant="destructive"
            title="Forget transaction"
            onPress={onConfirm}
            width="flex1"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

const CancelTransactionBottomSheet = ({
  transaction,
  onConfirm,
  onDismiss,
}: {
  transaction: PendingTransaction;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}) => {
  const t = useTheme();
  const { estimateRepriceGas } = useWalletAlterTransaction();
  const [cancelFee, setCancelFee] = useState<string>();
  const [cancelFeeLoading, setCancelFeeLoading] = useState(false);

  useEffect(() => {
    const estimate = async () => {
      setCancelFeeLoading(true);
      const estimate = await estimateRepriceGas(
        transaction.txHash as `0x${string}`,
        'cancel',
        true,
      );
      if (estimate && estimate.isDelta) {
        setCancelFee(
          estimate.estimatedFeeUsd
            ? formatDecimal(estimate.estimatedFeeUsd)
            : `${formatValue(estimate.estimatedFeeEth ?? 0n)} ETH`,
        );
      } else {
        setCancelFee(undefined);
      }
      setCancelFeeLoading(false);
    };
    estimate();
  }, [estimateRepriceGas, transaction.txHash]);

  return (
    <AutoDisplayingBottomSheetModal
      name="cancel-transaction"
      onDismiss={onDismiss}
    >
      <View style={[{ gap: 16 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View style={[t.bgPillDanger, t.roundedFull, t.p2]}>
            <CircleSlashIcon size={18} style={t.texts.danger} />
          </View>
          <Text2 weight="semibold" size="xl">
            Cancel transaction
          </Text2>
        </View>
        <Text2 color="primary">
          You're replacing your pending transaction with a no-op transaction.
          Your original transaction may still confirm first.
        </Text2>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 4 },
            t.bgFaint,
            t.roundedLg,
            t.p4,
          ]}
        >
          <Text2 color="secondary">Additional fees</Text2>
          {cancelFee ? (
            <Text2 color="primary">{cancelFee}</Text2>
          ) : (
            <Text2 color="primary">
              {cancelFeeLoading ? 'Estimating...' : 'Unknown'}
            </Text2>
          )}
        </View>
        <View style={[t.flexRow, { gap: 8 }]}>
          <ButtonV2
            variant="secondary"
            title="Close"
            onPress={onDismiss}
            width="flex1"
          />
          <ButtonV2
            variant="destructive"
            title="Cancel transaction"
            onPress={onConfirm}
            width="flex1"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

const SpeedUpTransactionBottomSheet = ({
  transaction,
  onConfirm,
  onDismiss,
}: {
  transaction: PendingTransaction;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
}) => {
  const t = useTheme();
  const { estimateRepriceGas } = useWalletAlterTransaction();
  const [speedUpFee, setSpeedUpFee] = useState<string>();
  const [speedUpFeeLoading, setSpeedUpFeeLoading] = useState(false);
  useEffect(() => {
    const estimate = async () => {
      setSpeedUpFeeLoading(true);
      const estimate = await estimateRepriceGas(
        transaction.txHash as `0x${string}`,
        'speedUp',
        true,
      );
      if (estimate && estimate.isDelta) {
        setSpeedUpFee(
          estimate.estimatedFeeUsd
            ? formatDecimal(estimate.estimatedFeeUsd)
            : `${formatValue(estimate.estimatedFeeEth ?? 0n)} ETH`,
        );
      } else {
        setSpeedUpFee(undefined);
      }
      setSpeedUpFeeLoading(false);
    };
    estimate();
  }, [estimateRepriceGas, transaction.txHash]);

  return (
    <AutoDisplayingBottomSheetModal
      name="speedup-transaction"
      onDismiss={onDismiss}
    >
      <View style={[{ gap: 16 }]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          <View style={[t.bgLightPurple, t.roundedFull, t.p2]}>
            <RocketIcon size={18} style={t.texts.tertiary} />
          </View>
          <Text2 weight="semibold" size="xl">
            Speed up transaction
          </Text2>
        </View>
        <Text2 color="primary">
          This will attempt to speed up your current transaction. It requires
          submitting another transaction.
        </Text2>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            { gap: 4 },
            t.bgFaint,
            t.roundedLg,
            t.p4,
          ]}
        >
          <Text2 color="secondary">Additional fees</Text2>
          {speedUpFee ? (
            <Text2 color="primary">{speedUpFee}</Text2>
          ) : (
            <Text2 color="primary">
              {speedUpFeeLoading ? 'Estimating...' : 'Unknown'}
            </Text2>
          )}
        </View>
        <View style={[t.flexRow, { gap: 8 }]}>
          <ButtonV2
            variant="secondary"
            title="Cancel"
            onPress={onDismiss}
            width="flex1"
          />
          <ButtonV2
            variant="primary"
            title="Confirm"
            onPress={onConfirm}
            width="flex1"
          />
        </View>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
};

const PendingTransactionItem = ({
  transaction,
  activity,
  onPress,
}: {
  transaction: PendingTransaction;
  activity?: ApiWalletActivity;
  onPress?: (tx: PendingTransaction) => void;
}) => {
  const { cancelPendingTransaction, speedUpPendingTransaction } =
    useWalletAlterTransaction();
  const { removePendingTransaction, getPendingTransaction } =
    useEmbeddedWallet();
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();
  const toast = useRootToast();
  const { trackError } = useSharedTelemetry();

  const [cancelState, setCancelState] = useState<AlterTransactionState>();
  const [speedUpState, setSpeedUpState] = useState<AlterTransactionState>();
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showSpeedUpSheet, setShowSpeedUpSheet] = useState(false);
  const [showForgetSheet, setShowForgetSheet] = useState(false);

  const handleCancel = useCallback(async () => {
    triggerImpactAsync();
    setCancelState('pending');
    setShowCancelSheet(false);

    const result = await cancelPendingTransaction(
      transaction.txHash as `0x${string}`,
    );
    setCancelState(result.state);

    if (result.error) {
      const pendingTx = getPendingTransaction(transaction.txHash);
      if (pendingTx) {
        toast.show('Failed to cancel transaction', {
          type: 'danger',
          placement: 'top',
        });
        trackError(result.error, result);
      } else {
        toast.show('Cancellation aborted, transaction was confirmed', {
          type: 'notice',
          placement: 'top',
        });
      }
    }
    if (result.state === 'succeeded') {
      toast.show('Transaction cancelled', {
        type: 'success',
        placement: 'top',
      });
    }
  }, [
    cancelPendingTransaction,
    getPendingTransaction,
    transaction.txHash,
    triggerImpactAsync,
    toast,
    trackError,
  ]);

  const handleSpeedUp = useCallback(async () => {
    triggerImpactAsync();
    setShowSpeedUpSheet(false);
    setSpeedUpState('pending');

    const result = await speedUpPendingTransaction(
      transaction.txHash as `0x${string}`,
    );
    setSpeedUpState(result.state);

    if (result.error) {
      const pendingTx = getPendingTransaction(transaction.txHash);
      if (pendingTx) {
        toast.show('Failed to speed up transaction', {
          type: 'danger',
          placement: 'top',
        });
        trackError(result.error, result);
      } else {
        toast.show('Speed up aborted, transaction was confirmed', {
          type: 'notice',
          placement: 'top',
        });
      }
    }
    if (result.state === 'succeeded') {
      toast.show('Transaction speed up confirmed', {
        type: 'success',
        placement: 'top',
      });
    }
  }, [
    speedUpPendingTransaction,
    getPendingTransaction,
    transaction.txHash,
    triggerImpactAsync,
    toast,
    trackError,
  ]);

  const handleForget = useCallback(async () => {
    triggerImpactAsync();
    await removePendingTransaction(transaction.txHash);
    setShowForgetSheet(false);
  }, [triggerImpactAsync, transaction.txHash, removePendingTransaction]);

  const isPending = useMemo(() => {
    return cancelState === 'pending' || speedUpState === 'pending';
  }, [cancelState, speedUpState]);

  const name = useMemo(() => {
    if (activity) {
      return getNameFromActivity(activity);
    }
    if (
      transaction.metadata?.type === 'misc' &&
      typeof transaction.metadata?.connectionContext?.domain !== 'undefined'
    ) {
      return transaction.metadata?.connectionContext?.domain;
    }
    if (
      transaction.metadata?.type === 'swap' &&
      transaction.metadata?.quote &&
      transaction.metadata?.quote.price
    ) {
      return `${transaction.metadata?.quote.price.sell.token.name} -> ${transaction.metadata?.quote.price.buy.token.name}`;
    } else if (transaction.metadata?.type === 'send') {
      if (transaction.metadata?.target.type === 'user') {
        return `to ${transaction.metadata.target.fid.toString()}`;
      }
      return `to ${transaction.metadata.target.address.slice(0, 6)}...${transaction.metadata.target.address.slice(-4)}`;
    }
    return '';
  }, [activity, transaction]);

  const icon = useMemo(() => {
    if (
      transaction.metadata?.type === 'misc' &&
      typeof transaction.metadata?.connectionContext?.iconUrl !== 'undefined'
    ) {
      return (
        <Image
          source={{ uri: transaction.metadata?.connectionContext?.iconUrl }}
          recyclingKey={transaction.metadata?.connectionContext?.iconUrl}
          style={{ width: 38, height: 38 }}
          contentFit="contain"
        />
      );
    }
    if (transaction.metadata?.type === 'swap') {
      return <Repeat size={14} style={t.texts.tertiary} />;
    }
    if (transaction.metadata?.type === 'send') {
      return <SendHorizonalIcon size={14} color={t.colors.text.tertiary} />;
    }
    return (
      <Text2 weight="semibold" size="sm" color="tertiary">
        tx
      </Text2>
    );
  }, [transaction.metadata, t]);

  const statusType = useMemo(() => {
    if (transaction.metadata?.type === 'send') {
      return 'send';
    }
    if (transaction.metadata?.type === 'swap') {
      return 'swap';
    }
    return 'transaction';
  }, [transaction.metadata]);

  return (
    <>
      <Pressable
        style={[t.flexRow, t.itemsCenter, t.pX4, t.pY2, { gap: 8 }]}
        key={transaction.txHash}
        onLongPress={() => setShowForgetSheet(true)}
        onPress={() => onPress?.(transaction)}
        delayLongPress={3000}
      >
        <View style={[t.flex1, t.flexRow, t.itemsCenter, { gap: 12 }]}>
          {activity ? (
            <ActivityTokenIcon item={activity} />
          ) : (
            <View
              style={[
                { width: 36, height: 36 },
                t.bgFaint,
                t.roundedLg,
                t.justifyCenter,
                t.itemsCenter,
              ]}
            >
              {icon}
            </View>
          )}
          <View style={t.flex1}>
            <ActivityTypeStatus type={statusType} status={'pending'} />
            <Text2 color="primary" size="base" numberOfLines={1}>
              {name}
            </Text2>
          </View>
        </View>
        {transaction.chain !== 'solana' && (
          <View style={[t.flexRow, { gap: 8 }]}>
            <ButtonV2
              height="sm"
              variant="destructive"
              onPress={() => setShowCancelSheet(true)}
              title="Cancel"
              loading={cancelState === 'pending'}
              disabled={isPending}
            />
            <ButtonV2
              height="sm"
              variant="secondary"
              onPress={() => setShowSpeedUpSheet(true)}
              title="Speed Up"
              loading={speedUpState === 'pending'}
              disabled={isPending}
            />
          </View>
        )}
      </Pressable>

      {showCancelSheet && transaction.chain !== 'solana' && (
        <CancelTransactionBottomSheet
          transaction={transaction}
          onConfirm={handleCancel}
          onDismiss={() => setShowCancelSheet(false)}
        />
      )}

      {showSpeedUpSheet && transaction.chain !== 'solana' && (
        <SpeedUpTransactionBottomSheet
          transaction={transaction}
          onConfirm={handleSpeedUp}
          onDismiss={() => setShowSpeedUpSheet(false)}
        />
      )}

      {showForgetSheet && (
        <ForgetTransactionBottomSheet
          onConfirm={handleForget}
          onDismiss={() => setShowForgetSheet(false)}
        />
      )}
    </>
  );
};

export function WalletPendingActivity({
  transactions,
  activities,
  onPress,
}: {
  transactions: PendingTransaction[];
  activities: ApiWalletActivity[];
  onPress?: (activity: ApiWalletActivity) => void;
}) {
  const t = useTheme();

  const handlePress = useCallback(
    (tx: PendingTransaction) => {
      const activity = activities.find(
        (activity) => activity.transaction.txHash === tx.txHash,
      );
      if (!activity) {
        return;
      }
      onPress?.(activity);
    },
    [activities, onPress],
  );

  if (!transactions.length) {
    return null;
  }

  return (
    <View style={[t.bgDefault]}>
      {transactions.map((tx) => (
        <PendingTransactionItem
          key={tx.txHash}
          transaction={tx}
          activity={activities.find(
            (activity) => activity.transaction.txHash === tx.txHash,
          )}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}
