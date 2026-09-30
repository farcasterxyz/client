import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ApiChain,
  ApiSwapQuote,
  ApiWalletActionDetails,
  ApiWalletActionStateChange,
  formatDecimal,
  getTransactionExplorerUrl,
  RELAY_SOLANA_CHAIN_ID,
} from 'farcaster-client-data';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import moment from 'moment';
import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';

import { ChainImage } from '../../../../components/crypto';
import { hitSlop } from '../../../../constants/Pressable';
import { useTheme } from '../../../../contexts';
import { formatAddress } from '../../../../utils';
import { Text2, TextPlaceholder } from '../../../design-system';
import { GaslessPreviewSection } from '../common';
import { getChainNameFromChain, getEvmChainId } from '../utils';

/**
 * Helper component for a detail row in the transaction details card
 */
const DetailRow = ({
  label,
  value,
  valueNode,
  align = 'row',
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  align?: 'row' | 'col';
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        align === 'row' ? t.flexRow : t.flexCol,
        align === 'row' ? t.justifyBetween : undefined,
        align === 'row' ? t.itemsCenter : undefined,
        t.p3,
        { backgroundColor: t.colors.bgNewLightGray },
      ]}
    >
      <Text2 size="base" color="secondary" weight="medium">
        {label}
      </Text2>
      {valueNode ? (
        valueNode
      ) : value ? (
        <Text2 size="base" color="secondary" weight="medium">
          {value}
        </Text2>
      ) : (
        <TextPlaceholder width={50} size="base" variant="darker" />
      )}
    </View>
  );
};

/**
 * Card component that displays transaction details such as network, fees, and advanced info
 */
export function TransactionDetailsCard({
  chain,
  details,
  stateChanges,
  estimatedFeeUsd,
  gaslessQuote,
  functionSignature,
  showFees,
  rawData,
  hasAdvanced = true,
  offChainSignatureLabel,
}: {
  chain: ApiChain | undefined;
  details?: ApiWalletActionDetails;
  stateChanges?: ApiWalletActionStateChange[];
  estimatedFeeUsd?: number;
  gaslessQuote?: ApiSwapQuote | null;
  functionSignature?: string | null;
  showFees?: boolean;
  rawData?: string | null;
  hasAdvanced: boolean;
  offChainSignatureLabel?: string;
}) {
  const t = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // On Android, we use GestureScrollView to allow scrolling on the raw data
  // instead of the default ScrollView. This is because we are nesting
  // the scrollviews and this caused a bug on Android where you couldn't scroll
  // the raw data.
  const RawDataScroll: typeof ScrollView =
    Platform.OS === 'android'
      ? (GestureScrollView as unknown as typeof ScrollView)
      : ScrollView;

  const feeDisplay =
    estimatedFeeUsd !== undefined
      ? `${formatDecimal(estimatedFeeUsd)}`
      : undefined;
  const networkName = details?.networkName || getChainNameFromChain(chain);

  // Determine the 'To' content based on stateChanges or details
  const toRowContent = useMemo(() => {
    // Prioritize 'to' from details if it's a direct transfer/interaction to an EOA/Contract
    // If stateChanges provide richer identity info (like for a known user), use that
    if (
      stateChanges?.length === 1 &&
      stateChanges[0].direction === 'OUT' &&
      stateChanges[0].toIdentity?.user
    ) {
      return (
        <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
          {stateChanges[0].toIdentity.user.pfp?.url && (
            <Image
              source={{ uri: stateChanges[0].toIdentity.user.pfp.url }}
              style={{ width: 20, height: 20, borderRadius: 12 }}
              contentFit="contain"
            />
          )}
          <Text2 size="base" color="secondary" weight="medium">
            {stateChanges[0].toIdentity.user.username}
          </Text2>
        </View>
      );
    }
    return null;
  }, [stateChanges, t]);

  let transactionExplorerChainId: number | undefined;
  if (chain === 'solana') {
    transactionExplorerChainId = Number(RELAY_SOLANA_CHAIN_ID);
  } else if (chain) {
    transactionExplorerChainId = getEvmChainId(chain);
  }

  const advancedToggle = useMemo(() => {
    if (!showAdvanced) {
      return;
    }

    let verboseTimeAgo: string | undefined;
    if (details?.contractCreatedAt) {
      const created = moment(details?.contractCreatedAt);
      const now = moment();

      const diffYears = now.diff(created, 'years');
      const diffMonths = now.diff(created, 'months');
      const diffDays = now.diff(created, 'days');
      const diffHours = now.diff(created, 'hours');

      if (diffYears >= 1) {
        verboseTimeAgo =
          diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
      } else if (diffMonths >= 1) {
        verboseTimeAgo =
          diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
      } else if (diffDays >= 1) {
        verboseTimeAgo = diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
      } else {
        verboseTimeAgo =
          diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      }
    }
    return (
      <View style={[t.flexCol, { gap: 1 }]}>
        {details?.sourceCodeState && (
          <DetailRow
            label="Source Code"
            valueNode={
              <Text2
                size="base"
                color="primary"
                weight="regular"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {details.sourceCodeState}
              </Text2>
            }
          />
        )}
        {functionSignature && (
          <DetailRow
            label="Function"
            valueNode={
              <Text2
                size="base"
                color="primary"
                weight="regular"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ maxWidth: '70%' }}
              >
                {functionSignature}
              </Text2>
            }
          />
        )}
        {details?.contractName && (
          <DetailRow
            label="Contract Name"
            valueNode={
              <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                <Text2 size="base" color="primary" weight="regular">
                  {details?.contractName}
                </Text2>
              </View>
            }
          />
        )}
        {verboseTimeAgo && (
          <DetailRow
            label="Contract Created"
            valueNode={
              <Text2 size="base" color="primary" weight="regular">
                {verboseTimeAgo}
              </Text2>
            }
          />
        )}
        {details?.targetAddress && (
          <DetailRow
            label="Contract Address"
            valueNode={
              <TouchableOpacity
                style={[t.flexRow, t.itemsCenter, { gap: 4 }]}
                disabled={!transactionExplorerChainId}
                onPress={() => {
                  if (!transactionExplorerChainId) {
                    return;
                  }
                  const url = getTransactionExplorerUrl({
                    chainId: transactionExplorerChainId.toString(),
                    type: 'address',
                    address: details?.targetAddress ?? '',
                  });
                  if (url) {
                    Linking.openURL(url);
                  }
                }}
              >
                <Text2 size="base" color="brand" weight="regular">
                  {formatAddress(details?.targetAddress)}
                </Text2>
                <Ionicons
                  name="open-outline"
                  size={14}
                  color={t.colors.actionPrimary}
                />
              </TouchableOpacity>
            }
          />
        )}
        {rawData && (
          <DetailRow
            align="col"
            label="Raw Data"
            valueNode={
              <RawDataScroll
                style={[{ maxHeight: 200 }]}
                nestedScrollEnabled
                scrollEnabled
                showsVerticalScrollIndicator
              >
                <Text2
                  size="base"
                  color="secondary"
                  weight="regular"
                  style={[t.mT2, { width: '100%' }]}
                >
                  {rawData}
                </Text2>
              </RawDataScroll>
            }
          />
        )}
      </View>
    );
  }, [
    showAdvanced,
    details,
    transactionExplorerChainId,
    t,
    functionSignature,
    rawData,
    RawDataScroll,
  ]);

  return (
    <View style={[t.flexCol, { gap: 12 }]}>
      <View
        style={[
          t.flexCol,
          { borderRadius: 12 },
          { gap: 1 },
          { overflow: 'hidden' },
        ]}
      >
        {/* 'To' row - only display if we have a target address */}
        {toRowContent && <DetailRow label="To" valueNode={toRowContent} />}

        {/* Network row — for off-chain protocol signatures (e.g.
            Hyperliquid L1), show the protocol label instead of the
            user's connected EVM chain to avoid misleading the user. */}
        {offChainSignatureLabel ? (
          <DetailRow
            label="Signature type"
            valueNode={
              <Text2 size="base" color="secondary" weight="medium">
                {`${offChainSignatureLabel} (off-chain)`}
              </Text2>
            }
          />
        ) : (
          <DetailRow
            label="Network"
            valueNode={
              <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                {chain && <ChainImage chain={chain} />}
                <Text2 size="base" color="secondary" weight="medium">
                  {networkName}
                </Text2>
              </View>
            }
          />
        )}

        {/* Fees row */}
        {showFees && <DetailRow label="Fees" value={feeDisplay} />}
      </View>

      <View
        style={[
          t.flexCol,
          { borderRadius: 12 },
          { gap: 1 },
          { overflow: 'hidden' },
        ]}
      >
        {/* Advanced Toggle - always present as per screenshot */}
        {hasAdvanced ? (
          <>
            <TouchableOpacity
              style={[
                t.flexRow,
                t.justifyBetween,
                t.itemsCenter,
                t.p3,
                { backgroundColor: t.colors.bgNewLightGray },
              ]}
              onPress={() => setShowAdvanced(!showAdvanced)}
              hitSlop={hitSlop}
            >
              <Text2 size="base" weight="medium" color="secondary">
                Advanced
              </Text2>
              {showAdvanced ? (
                <ChevronUpIcon color={t.colors.text.secondary} size={22} />
              ) : (
                <ChevronDownIcon color={t.colors.text.secondary} size={22} />
              )}
            </TouchableOpacity>
            {advancedToggle}
          </>
        ) : null}
      </View>

      {gaslessQuote ? (
        <View
          style={[
            t.flexCol,
            { backgroundColor: t.colors.bgNewLightGray, borderRadius: 12 },
          ]}
        >
          <GaslessPreviewSection gaslessQuote={gaslessQuote} />
        </View>
      ) : null}
    </View>
  );
}
