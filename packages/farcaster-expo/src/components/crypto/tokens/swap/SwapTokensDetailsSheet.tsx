import { ApiOnchainSwapFees } from 'farcaster-client-data';
import { formatPercent, tokenQuantityToFloat } from 'farcaster-client-hooks';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { useTheme } from '../../../../contexts';
import { formatFee } from '../../../../utils';
import {
  getSwapDetailsBackgroundColor,
  getSwapDetailsSheetWarningContent,
  getSwapDetailsTextColor,
  SwapWarning,
} from '../../../../utils/SwapWarnings';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet/AutoDisplayingBottomSheetModal';
import {
  TextWithPress,
  Typography,
  TypographyProps,
} from '../../../design-system';
import { TokenInputAccessoryIconMap } from '../TokenInputAccessory';
import { useSwapTokens } from './SwapTokensProvider';
import { useSwapFees } from './useSwapFees';
import { useSwapWarnings } from './useSwapWarnings';

function PriceDisplayText(props: Omit<TypographyProps, 'label'>) {
  return <Typography label="Body/Medium/Strong" {...props} />;
}

function FeeLabel(props: Omit<TypographyProps, 'label'>) {
  const t = useTheme();
  return (
    <Typography
      label="Medium/S"
      color={'secondary'}
      style={[t.flexGrow]}
      {...props}
    />
  );
}

function SwapDetailsSheetWarning({ warning }: { warning: SwapWarning }) {
  const t = useTheme();
  const backgroundColor = getSwapDetailsBackgroundColor(warning);
  const textColor = getSwapDetailsTextColor(warning);
  const Icon = TokenInputAccessoryIconMap[warning.type];
  const content = getSwapDetailsSheetWarningContent(warning);

  return (
    <View
      style={[
        t.backgrounds[backgroundColor],
        t.flexRow,
        t.gap1,
        t.pX3,
        t.pY2,
        {
          borderRadius: t.borderRadiuses.$16,
        },
        t.mB3,
      ]}
    >
      {Icon ? (
        <Icon
          size={16}
          fill={t.colors.text[textColor]}
          color={t.colors.background[backgroundColor]}
        />
      ) : null}
      <Typography label="Medium/S" color={textColor}>
        {content}
      </Typography>
    </View>
  );
}

function getFeeInfo({
  normalValue,
  discountedValue,
  isPro,
  isReferralProgram,
}: {
  normalValue: number;
  discountedValue: number;
  isPro: boolean;
  isReferralProgram: boolean;
}) {
  const isDiscounted =
    (isPro || isReferralProgram) && discountedValue < normalValue;
  const discountType = isDiscounted
    ? isPro
      ? 'pro'
      : isReferralProgram
        ? 'referral'
        : null
    : null;
  return {
    isDiscounted,
    discountType,
  };
}

function FeeRow({
  label,
  normalValue,
  valueColor = 'primary',
  discountedValue,
  isPro,
  isReferralProgram,
  secondaryValue,
}: {
  label: string;
  normalValue: number;
  secondaryValue?: string;
  valueColor?: 'primary' | 'danger' | 'warning';
  discountedValue: number;
  isPro: boolean;
  isReferralProgram: boolean;
}) {
  const t = useTheme();
  const { isDiscounted } = getFeeInfo({
    normalValue,
    discountedValue,
    isPro,
    isReferralProgram,
  });
  return (
    <View
      style={[
        t.flexRow,
        t.flex,
        t.itemsCenter,
        t.justifyBetween,
        { paddingVertical: 6 },
        { width: '100%' },
        t.gap1,
      ]}
    >
      <FeeLabel>{label}</FeeLabel>
      {secondaryValue ? (
        <PriceDisplayText
          color={'tertiary'}
          numberOfLines={1}
          style={[t.flexShrink, t.flexRow]}
        >
          {secondaryValue}
        </PriceDisplayText>
      ) : null}
      <PriceDisplayText color={valueColor} style={[t.flex]}>
        {isDiscounted ? formatFee(discountedValue) : formatFee(normalValue)}
      </PriceDisplayText>
    </View>
  );
}

function SwapFeesBottomSheetContent({
  fees,
  isPro,
  priceImpact,
  priceImpactUsd,
  showHighPriceImpactWarning,
  showPriceImpactWarning,
  onShowSettings,
  isNoFeeAllowlisted,
  isReferralProgram,
  warning,
  buyUsdValue,
  outputTokenAmount,
}: {
  priceImpact: number;
  priceImpactUsd: number;
  onDismiss: () => void;
  isPro: boolean;
  isNoFeeAllowlisted: boolean;
  isReferralProgram: boolean;
  fees: ApiOnchainSwapFees | undefined;
  onShowSettings: () => void;
  warning: SwapWarning | undefined;
  showHighPriceImpactWarning: boolean;
  showPriceImpactWarning: boolean;
  buyUsdValue: number;
  outputTokenAmount: string;
}) {
  const t = useTheme();

  // const handleReferralInfoPress = useCallback(() => {
  //   triggerImpactAsync();
  //   Linking.openURL(getNotionLinkTarget({ to: 'referrals' }));
  // }, [triggerImpactAsync]);

  const { others, pro } = useSwapFees({
    fees,
    isPro,
    isNoFeeAllowlisted,
    priceImpact,
  });

  return (
    <View style={t.gap2}>
      <View style={t.pX4}>
        <Typography label="Semibold/XL">Details</Typography>
        <FeeRow
          label="Wallet fee"
          normalValue={others.walletFee}
          discountedValue={pro.walletFee}
          isPro={isPro}
          isReferralProgram={isReferralProgram}
        />
        <FeeRow
          label="Market fee"
          normalValue={others.marketFee}
          discountedValue={pro.marketFee}
          isPro={isPro}
          isReferralProgram={isReferralProgram}
        />
        {priceImpactUsd > 0.1 ? (
          <FeeRow
            label="Price impact"
            normalValue={priceImpactUsd}
            secondaryValue={`(${formatPercent({ value: priceImpact }).split('.')[0]}%)`}
            discountedValue={priceImpactUsd}
            valueColor={
              showHighPriceImpactWarning
                ? 'danger'
                : showPriceImpactWarning
                  ? 'warning'
                  : 'primary'
            }
            isPro={isPro}
            isReferralProgram={isReferralProgram}
          />
        ) : null}
        <FeeRow
          label="Estimated output"
          normalValue={buyUsdValue}
          secondaryValue={outputTokenAmount}
          discountedValue={buyUsdValue}
          isPro={isPro}
          isReferralProgram={isReferralProgram}
        />
      </View>
      <View style={t.pX4}>
        {warning ? <SwapDetailsSheetWarning warning={warning} /> : null}
        <View style={t.gap4}>
          <Typography label="Body/Medium" style={t.italic} color="tertiary">
            Market fee includes blockchain, router and dex fees. The final
            amount received depends on{' '}
            <TextWithPress
              onPress={onShowSettings}
              style={[t.fontMedium, t.texts.brand, t.italic]}
            >
              Slippage.
            </TextWithPress>
          </Typography>
        </View>
      </View>
    </View>
  );
}

const BILLION = 1000000000;
const MILLION = 1000000;

function getFormattedOutputTokenAmount({
  quantity,
}: {
  quantity: number;
}): string {
  if (quantity >= BILLION) {
    const num = Number(quantity / BILLION);
    return `${num.toFixed(1)}B`;
  }
  if (quantity >= MILLION) {
    const num = Number(quantity / MILLION);
    return `${num.toFixed(1)}M`;
  }

  return quantity.toLocaleString(undefined, {
    minimumSignificantDigits: 1,
  });
}

export function SwapTokensDetailsSheet({
  onDismiss,
  isPro,
  fees,
  onShowSettings,
  isReferralProgram,
  isNoFeeAllowlisted,
}: {
  onDismiss: () => void;
  isPro: boolean;
  isReferralProgram: boolean;
  isNoFeeAllowlisted: boolean;
  fees: ApiOnchainSwapFees | undefined;
  onShowSettings: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);
  const warning = useSwapWarnings();
  const {
    priceImpact: swapPriceImpact,
    preparedQuote,
    buyToken,
  } = useSwapTokens();
  const {
    priceImpact,
    priceImpactUsd,
    showHighPriceImpactWarning,
    showPriceImpactWarning,
    buyUsdValue,
  } = swapPriceImpact;

  const formattedOutputTokenAmount = useMemo(() => {
    const quantity = tokenQuantityToFloat({
      quantity: BigInt(preparedQuote?.quote?.buyAmount ?? '0'),
      price: parseFloat(buyToken?.priceUsd ?? '0'),
      decimals: buyToken?.decimals ?? 18,
    });
    const formattedOutputTokenAmount = getFormattedOutputTokenAmount({
      quantity,
    });

    return `(~${formattedOutputTokenAmount} ${buyToken?.ticker})`;
  }, [
    preparedQuote?.quote?.buyAmount,
    buyToken?.priceUsd,
    buyToken?.decimals,
    buyToken?.ticker,
  ]);

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
      contentContainerStyle={t.pX0}
    >
      <SwapFeesBottomSheetContent
        fees={fees}
        isPro={isPro}
        priceImpact={priceImpact}
        priceImpactUsd={priceImpactUsd}
        onShowSettings={onShowSettings}
        isNoFeeAllowlisted={isNoFeeAllowlisted}
        isReferralProgram={isReferralProgram}
        onDismiss={onDismiss}
        warning={warning}
        showHighPriceImpactWarning={showHighPriceImpactWarning}
        showPriceImpactWarning={showPriceImpactWarning}
        buyUsdValue={buyUsdValue}
        outputTokenAmount={formattedOutputTokenAmount}
      />
    </AutoDisplayingBottomSheetModal>
  );
}
