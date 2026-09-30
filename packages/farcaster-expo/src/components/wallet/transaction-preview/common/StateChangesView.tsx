import { Feather, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ApiSwapQuote,
  ApiWalletActionApproval,
  ApiWalletActionStateChange,
  ApiWalletEvmScanAction200Response,
  formatDecimal,
} from 'farcaster-client-data';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { formatValue, UNLIMITED_ALLOWANCE } from '../../../../utils';
import { Text2, TextColor } from '../../../design-system';
import { getConversionTextFromQuote } from '../../GaslessConversionText';
import { getAssetMetadataSymbol } from '../utils';

/**
 * Component for displaying approvals (used by StateChangesView)
 */
export function PreviewApprovals({
  approvals,
}: {
  approvals: ApiWalletActionApproval[];
}) {
  const t = useTheme();

  const isRevoke = approvals.length === 1 && approvals[0].value === 0;
  const heightSingleItem = 44;
  const maxNumItems = 3;
  const maxHeightOfScrollView =
    heightSingleItem * maxNumItems + heightSingleItem / 2;
  return (
    <ScrollView
      nestedScrollEnabled
      style={{ maxHeight: maxHeightOfScrollView, borderRadius: 12 }}
    >
      <View style={[t.flexCol, { gap: 1 }, { overflow: 'hidden' }]}>
        {/* First row - site approval message */}
        {!isRevoke && (
          <View style={[t.p3, { backgroundColor: t.colors.bgNewLightGray }]}>
            <Text2 size="base" weight="medium">
              Approve this site to spend on behalf of you
            </Text2>
          </View>
        )}

        {approvals.map((approval, index) => {
          const decimals =
            approval.value !== undefined && approval.value < 1 ? 2 : 0;
          const symbol = getAssetMetadataSymbol(approval.assetMetadata);
          const roundedValue =
            !approval.value || approval.value >= UNLIMITED_ALLOWANCE
              ? 'All'
              : `-${formatValue(approval.value, decimals)}`;

          return (
            <View
              key={index}
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.p3,
                { backgroundColor: t.colors.bgNewLightGray },
                { height: heightSingleItem },
              ]}
            >
              <View style={[t.flexRow, t.itemsCenter, { gap: 8 }]}>
                <Text2 size="base" weight="medium" color="secondary">
                  {isRevoke ? 'Revoke approval' : 'Approve spending'}
                </Text2>
              </View>

              <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
                {approval.assetMetadata.assetLogoUrl && (
                  <Image
                    source={{ uri: approval.assetMetadata.assetLogoUrl }}
                    style={[t.roundedLg, t.w5, t.h5]}
                    contentFit="contain"
                  />
                )}
                <Text2
                  size="base"
                  weight="medium"
                  style={{
                    color: isRevoke
                      ? t.colors.text.primary
                      : t.colors.text.danger,
                  }}
                >
                  {isRevoke ? symbol : `${roundedValue} ${symbol}`}
                </Text2>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

/**
 * Component for displaying a single asset change (like token in/out)
 */
export function AssetChange({
  change,
}: {
  change: ApiWalletActionStateChange;
}) {
  const t = useTheme();

  const symbol = getAssetMetadataSymbol(change.assetMetadata, change.value);
  const roundedValue = formatValue(change.value);
  const isReceiving = change.direction === 'IN';

  const roundedUsdPrice =
    change.usdPrice !== undefined ? formatDecimal(change.usdPrice) : null;

  const arrow = useMemo(() => {
    if (isReceiving) {
      return (
        <Ionicons
          name="arrow-down-circle"
          size={24}
          color={t.colors.bgSuccess}
        />
      );
    } else {
      return (
        <Ionicons name="arrow-up-circle" size={24} color={t.colors.red500} />
      );
    }
  }, [isReceiving, t.colors.bgSuccess, t.colors.red500]);

  const assetImage: React.ReactNode = useMemo(() => {
    if (change.assetMetadata.assetLogoUrl) {
      return (
        <Image
          source={{ uri: change.assetMetadata.assetLogoUrl }}
          style={{ width: 20, height: 20, borderRadius: 4 }}
          contentFit="contain"
        />
      );
    }
    return null;
  }, [change]);

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyBetween,
        t.p3,
        { backgroundColor: t.colors.bgNewLightGray },
      ]}
    >
      <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
        {arrow}
        <Text2 size="base" weight="medium" color="secondary">
          {isReceiving ? 'Receive' : 'Send'}
        </Text2>
        <Text2
          size="base"
          weight="medium"
          color={isReceiving ? 'success' : 'danger'}
        >
          {isReceiving ? '+' : '-'}
          {roundedValue} {symbol}
        </Text2>
        {assetImage}
      </View>
      <Text2
        size="base"
        weight="medium"
        color="secondary"
        style={[roundedUsdPrice ? t.flex : t.hidden]}
      >
        {roundedUsdPrice}
      </Text2>
    </View>
  );
}

/**
 * Component that displays state changes (token transfers, approvals)
 */
export function PreviewStateChanges({
  stateChanges,
}: {
  stateChanges: ApiWalletActionStateChange[];
}) {
  const t = useTheme();

  const inChanges = stateChanges.filter((change) => change.direction === 'IN');
  const outChanges = stateChanges.filter(
    (change) => change.direction === 'OUT',
  );

  const inChangesUi = inChanges.map((change, index) => (
    <AssetChange key={index} change={change} />
  ));

  const outChangesUi = outChanges.map((change, index) => (
    <AssetChange key={index} change={change} />
  ));

  const heightSingleItem = 44;
  const maxNumItems = 3;
  const maxHeight = heightSingleItem * maxNumItems + heightSingleItem / 2;

  return (
    <ScrollView nestedScrollEnabled style={{ maxHeight, borderRadius: 12 }}>
      <View style={[t.flexCol, { gap: 1 }, { overflow: 'hidden' }]}>
        {inChangesUi}
        {outChangesUi}
      </View>
    </ScrollView>
  );
}

/**
 * Generic section component for displaying various transaction warnings
 */
export function GenericPreviewSection({
  title,
  description,
  icon,
  bgColor,
  descriptionColor = 'secondary',
}: {
  title: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  descriptionColor?: TextColor;
}) {
  const t = useTheme();
  return (
    <View style={[t.p4, { backgroundColor: bgColor }, t.roundedLg]}>
      <View style={[t.flex, t.mB1]}>
        <View style={[t.flexRow, t.itemsCenter, { gap: 4 }]}>
          {icon}
          {title}
        </View>
        <Text2 size="sm" weight="regular" color={descriptionColor}>
          {description}
        </Text2>
      </View>
    </View>
  );
}

/**
 * Component showing a warning banner for malicious transactions
 */
export function MaliciousScanSection({ message }: { message: string }) {
  const t = useTheme();
  return (
    <GenericPreviewSection
      title={
        <Text2 size="sm" weight="semibold" style={{ color: '#E11D48' }}>
          High risk transaction
        </Text2>
      }
      description={
        message || 'We believe this transaction is malicious and unsafe'
      }
      icon={<Ionicons name="alert-circle" size={20} color="#E11D48" />}
      bgColor={t.colors.red300}
      descriptionColor="danger"
    />
  );
}

export function WarningScanSection2({ message }: { message: string }) {
  const t = useTheme();
  return (
    <GenericPreviewSection
      descriptionColor="secondary"
      title={
        <Text2 size="sm" weight="semibold" color="warning">
          Proceed with caution
        </Text2>
      }
      description={message}
      icon={
        <Ionicons
          name="warning-outline"
          size={20}
          color={t.colors.text.warning}
        />
      }
      bgColor={t.colors.background.warning}
    />
  );
}

export function TestnetPreviewSection() {
  const t = useTheme();
  return (
    <GenericPreviewSection
      descriptionColor="secondary"
      title={
        <Text2 size="sm" weight="semibold" color="primary">
          Testnet environment
        </Text2>
      }
      description="You’re connected to a testnet. Funds here are only for testing and have no real-world value."
      icon={
        <Ionicons
          name="information-circle-outline"
          size={20}
          color={t.colors.text.secondary}
        />
      }
      bgColor={t.colors.bgNewLightGray}
    />
  );
}

/**
 * Component for displaying gasless transaction preview
 */
export function GaslessPreviewSection({
  gaslessQuote,
}: {
  gaslessQuote: ApiSwapQuote;
}) {
  const t = useTheme();
  const sourceToken = gaslessQuote?.price?.sell?.token?.symbol || 'tokens';
  const destToken = gaslessQuote?.price?.buy?.token?.symbol || 'ETH';

  const title = useMemo(() => {
    if (!sourceToken || !destToken) {
      return 'Converting to cover gas fees';
    }
    return `Converting ${sourceToken} to ${destToken} to cover gas fees`;
  }, [sourceToken, destToken]);

  return (
    <GenericPreviewSection
      title={
        <Text2 size="sm" weight="semibold" color="primary">
          {title}
        </Text2>
      }
      description={getConversionTextFromQuote(gaslessQuote)}
      icon={<Feather name="info" size={20} color={t.colors.text.primary} />}
      bgColor={t.colors.bgNewLightGray}
    />
  );
}

/**
 * Component showing a warning banner for warning/malicious transactions
 */
export function WarningScanSection({
  type,
  message,
}: {
  type: 'WARNING' | 'UNSUPPORTED' | 'MALICIOUS';
  message: string;
}) {
  const t = useTheme();
  const warningBgColor = '#FEF3C7';
  const maliciousBgColor = '#FEE2E2';

  return (
    <View
      style={[
        t.p3,
        t.roundedLg,
        t.mT4,
        {
          backgroundColor:
            type === 'WARNING' || type === 'UNSUPPORTED'
              ? warningBgColor
              : maliciousBgColor,
        },
      ]}
    >
      <Text2 style={[t.textSm, t.texts.secondary]}>{message}</Text2>
    </View>
  );
}

/**
 * Main component for displaying transaction state changes or approvals
 */
export function StateChangesView({
  data,
}: {
  data?: ApiWalletEvmScanAction200Response['result'];
}) {
  const t = useTheme();
  const approvals = useMemo(() => data?.approvals ?? [], [data]);
  const stateChanges = useMemo(() => data?.stateChanges ?? [], [data]);

  const toRender = useMemo(() => {
    const items: React.ReactNode[] = [];
    if (stateChanges.length > 0) {
      items.push(<PreviewStateChanges stateChanges={stateChanges} />);
    }

    if (approvals.length > 0) {
      items.push(<PreviewApprovals approvals={approvals} />);
    }

    return items;
  }, [stateChanges, approvals]);

  if (toRender.length === 1) {
    return toRender[0];
  }

  if (toRender.length > 0) {
    return (
      <View style={[t.flexCol, { gap: 12 }]}>
        {toRender.map((item, index) => (
          <View key={index}>{item}</View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[t.p3, t.roundedLg, { backgroundColor: t.colors.bgNewLightGray }]}
    >
      <Text2 style={[t.textSm, t.texts.primary]}>
        No state changes detected
      </Text2>
    </View>
  );
}
