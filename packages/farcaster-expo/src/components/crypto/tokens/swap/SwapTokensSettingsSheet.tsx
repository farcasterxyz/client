import { MinusIcon, PlusIcon } from 'lucide-react-native';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { useTheme } from '../../../../contexts';
import {
  useHaptics,
  useWalletQuickSwap,
  useWalletSlippageSettings,
  useWalletUsdcDenominatedValues,
} from '../../../../hooks';
import { SlippageSettings } from '../../../../types';
import {
  DEFAULT_SLIPPAGE_PCT,
  DEFAULT_SLIPPAGE_SETTINGS,
} from '../../../../utils';
import { AutoDisplayingBottomSheetModal } from '../../../bottom-sheet/AutoDisplayingBottomSheetModal';
import { AtomsButton, SwitchV2, Text2 } from '../../../design-system';

const MIN_SLIPPAGE_PCT = 0.5;
const MAX_SLIPPAGE_PCT = 100;

export function SwapTokensSettingsSheet({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  const t = useTheme();
  const bottomSheetRef = React.useRef<{ dismiss: () => void }>(null);

  const [slippageSettings = DEFAULT_SLIPPAGE_SETTINGS, setSlippageSettings] =
    useWalletSlippageSettings();
  const [localSlippageSettings, setLocalSlippageSettings] =
    useState(slippageSettings);
  const [quickSwap, setQuickSwap] = useWalletQuickSwap();
  const [usdcDenominatedValues = true, setUsdcDenominatedValues] =
    useWalletUsdcDenominatedValues();

  const handleConfirm = () => {
    setSlippageSettings(localSlippageSettings);
    onDismiss();
  };

  return (
    <AutoDisplayingBottomSheetModal
      name="walletSwapBottomPopup"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
      displayedInModalPresentationScreen={true}
    >
      <View style={[{ gap: 12 }]}>
        <Text2 weight="semibold" size="xl">
          Slippage
        </Text2>

        <Text2 weight="medium" color="secondary">
          We will find the lowest slippage for a successful swap.
        </Text2>

        <SwapSettingsSlippage
          slippageSettings={localSlippageSettings}
          setSlippageSettings={setLocalSlippageSettings}
        />

        <SwapSettingsToggle
          title="Quick Swap"
          description="Don't show swap receipts and take me back quickly"
          switchLabel="Quick Swap"
          value={quickSwap ?? false}
          onChange={setQuickSwap}
        />

        <SwapSettingsToggle
          title="USDC Denomination"
          description="Display swaps in USDC values"
          switchLabel="Automatically convert to USDC"
          value={usdcDenominatedValues ?? true}
          onChange={setUsdcDenominatedValues}
        />

        <AtomsButton
          onPress={handleConfirm}
          size="l"
          hierarchy="primary"
          style={[t.mT3]}
        >
          Confirm
        </AtomsButton>
      </View>
    </AutoDisplayingBottomSheetModal>
  );
}

function SwapSettingsToggle({
  title,
  description,
  switchLabel,
  value,
  onChange,
}: {
  title: string;
  description: string;
  switchLabel: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useTheme();
  return (
    <>
      <Text2 weight="semibold" size="xl" style={[t.mT3]}>
        {title}
      </Text2>

      <Text2 weight="medium" color="secondary">
        {description}
      </Text2>

      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX5,
          t.backgrounds.secondary,
          { paddingVertical: 14, borderRadius: 12 },
        ]}
      >
        <Text2 weight="medium" size="base">
          {switchLabel}
        </Text2>
        <SwitchV2 value={value} onValueChange={onChange} newColors />
      </View>
    </>
  );
}

function SwapSettingsSlippage({
  slippageSettings,
  setSlippageSettings,
}: {
  slippageSettings: SlippageSettings;
  setSlippageSettings: Dispatch<SetStateAction<SlippageSettings>>;
}) {
  const t = useTheme();
  const { triggerImpactAsync } = useHaptics();

  const decreaseSlippage = () => {
    if (slippageSettings.auto) {
      return;
    }

    if (slippageSettings.slippage > MIN_SLIPPAGE_PCT) {
      triggerImpactAsync();
      setSlippageSettings({
        auto: false,
        slippage: Math.max(
          MIN_SLIPPAGE_PCT,
          Number((slippageSettings.slippage - 0.5).toFixed(1)),
        ),
      });
    }
  };

  const increaseSlippage = () => {
    if (slippageSettings.auto) {
      return;
    }

    if (slippageSettings.slippage < MAX_SLIPPAGE_PCT) {
      triggerImpactAsync();
      setSlippageSettings({
        auto: false,
        slippage: Math.max(
          MIN_SLIPPAGE_PCT,
          Number((slippageSettings.slippage + 0.5).toFixed(1)),
        ),
      });
    }
  };

  const toggleAutoSlippage = () => {
    triggerImpactAsync();
    setSlippageSettings((prev) =>
      !prev || prev.auto
        ? {
            auto: false,
            slippage: prev?.lastSelectedSlippage ?? DEFAULT_SLIPPAGE_PCT,
          }
        : {
            auto: true,
            lastSelectedSlippage: prev.slippage,
          },
    );
  };

  return (
    <View style={[t.flexCol, { gap: 12 }]}>
      <View
        style={[
          t.flexRow,
          t.itemsCenter,
          t.justifyBetween,
          t.pX5,
          t.backgrounds.secondary,
          { paddingVertical: 14, borderRadius: 12 },
        ]}
      >
        <Text2 weight="medium" size="base">
          Auto
        </Text2>
        <SwitchV2
          value={slippageSettings.auto}
          onValueChange={toggleAutoSlippage}
          newColors
        />
      </View>
      {!slippageSettings.auto && (
        <View
          style={[
            t.backgrounds.secondary,
            t.pX5,
            { paddingVertical: 14, borderRadius: 12 },
          ]}
        >
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyBetween,
              { paddingVertical: 14 },
            ]}
          >
            <TouchableOpacity
              style={[
                t.backgrounds.tertiary,
                t.roundedFull,
                t.itemsCenter,
                t.justifyCenter,
                { width: 48, height: 48 },
              ]}
              onPress={decreaseSlippage}
              disabled={slippageSettings.slippage <= MIN_SLIPPAGE_PCT}
            >
              <MinusIcon
                size={18}
                style={[
                  slippageSettings.slippage <= MIN_SLIPPAGE_PCT
                    ? t.texts.secondary
                    : t.texts.primary,
                ]}
              />
            </TouchableOpacity>

            <Text2 weight="semibold" size="4xl">
              {slippageSettings.slippage}%
            </Text2>

            <TouchableOpacity
              style={[
                t.backgrounds.tertiary,
                t.roundedFull,
                t.itemsCenter,
                t.justifyCenter,
                { width: 48, height: 48 },
              ]}
              onPress={increaseSlippage}
              disabled={slippageSettings.slippage >= MAX_SLIPPAGE_PCT}
            >
              <PlusIcon
                size={18}
                style={[
                  slippageSettings.slippage >= MAX_SLIPPAGE_PCT
                    ? t.texts.secondary
                    : t.texts.primary,
                ]}
              />
            </TouchableOpacity>
          </View>

          <Text2 color="secondary" size="sm">
            Your transaction will revert if the price changes more than slippage
            percentage.
          </Text2>
        </View>
      )}
    </View>
  );
}
