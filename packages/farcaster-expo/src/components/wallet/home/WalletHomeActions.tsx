import { AnalyticsEvent } from 'farcaster-analytics';
import React from 'react';
import { Platform, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  useSharedNavigationContext,
  useSharedTelemetry,
  useTheme,
} from '../../../contexts';
import { useLimitOrdersEnabled } from '../../../hooks';
import { BottomSheetModal, useBottomSheetModalRef } from '../../bottom-sheet';
import { AnimatedPressable, Text2 } from '../../design-system';
import { WalletTradeActionsContent } from '../WalletTradeActionsContent';

export function WalletHomeActions({
  reviewMode = false,
}: {
  reviewMode?: boolean;
} = {}) {
  const t = useTheme();
  const { push } = useSharedNavigationContext();
  const { trackEvent } = useSharedTelemetry();
  const tradeBottomSheetRef = useBottomSheetModalRef();
  const limitOrdersEnabled = useLimitOrdersEnabled();

  const openSwap = React.useCallback(() => {
    tradeBottomSheetRef.current?.dismiss();
    push({
      path: 'WalletSwap',
      params: { platformType: Platform.OS === 'web' ? 'web' : 'mobile' },
    });
  }, [push, tradeBottomSheetRef]);

  const openBuy = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressWalletBuy, { source: 'wallet_home' });
    tradeBottomSheetRef.current?.dismiss();
    push({
      path: 'WalletSwap',
      params: {
        platformType: Platform.OS === 'web' ? 'web' : 'mobile',
        isBuy: true,
      },
    });
  }, [push, trackEvent, tradeBottomSheetRef]);

  const openSell = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressWalletSell, { source: 'wallet_home' });
    tradeBottomSheetRef.current?.dismiss();
    push({
      path: 'WalletSwap',
      params: {
        platformType: Platform.OS === 'web' ? 'web' : 'mobile',
        isSell: true,
      },
    });
  }, [push, trackEvent, tradeBottomSheetRef]);

  const openLimitBuy = React.useCallback(() => {
    if (!limitOrdersEnabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletLimitBuy, { source: 'wallet_home' });
    tradeBottomSheetRef.current?.dismiss();
    push({
      path: 'WalletLimitOrder',
      params: { kind: 'buy' },
    });
  }, [limitOrdersEnabled, push, trackEvent, tradeBottomSheetRef]);

  const openLimitSell = React.useCallback(() => {
    if (!limitOrdersEnabled) {
      return;
    }

    trackEvent(AnalyticsEvent.PressWalletLimitSell, { source: 'wallet_home' });
    tradeBottomSheetRef.current?.dismiss();
    push({
      path: 'WalletLimitOrder',
      params: { kind: 'sell' },
    });
  }, [limitOrdersEnabled, push, trackEvent, tradeBottomSheetRef]);

  const actions: {
    id: 'deposit' | 'send' | 'trade';
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
  }[] = [
    {
      id: 'deposit',
      label: 'Deposit',
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M9.16272 11.8241C8.96259 12.4858 8.59436 13.0844 8.09396 13.5614C7.59357 14.0384 6.97808 14.3776 6.30753 14.5459C5.63698 14.7141 4.93427 14.7057 4.26794 14.5215C3.60161 14.3372 2.99441 13.9834 2.50556 13.4946C2.01671 13.0057 1.66291 12.3985 1.47866 11.7322C1.29441 11.0658 1.286 10.3631 1.45427 9.69259C1.62253 9.02204 1.96171 8.40655 2.43873 7.90615C2.91575 7.40576 3.51431 7.03753 4.17605 6.8374"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 4H10.6667V6.66667"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4.08936 9.8453L4.66669 9.51196L6.00002 11.8213"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.6665 9.33325C12.8756 9.33325 14.6665 7.54239 14.6665 5.33325C14.6665 3.12411 12.8756 1.33325 10.6665 1.33325C8.45736 1.33325 6.6665 3.12411 6.6665 5.33325C6.6665 7.54239 8.45736 9.33325 10.6665 9.33325Z"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        push({ path: 'WalletReceive' });
      },
    },
    {
      id: 'send',
      label: 'Send',
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M10 11.3334L13.3333 8.00008L10 4.66675"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2.66675 12V10.6667C2.66675 9.95942 2.9477 9.28115 3.4478 8.78105C3.94789 8.28095 4.62617 8 5.33341 8H13.3334"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        push({ path: 'WalletSend' });
      },
    },
    {
      id: 'trade',
      label: 'Trade',
      icon: (
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M11.3333 1.33325L13.9999 3.99992L11.3333 6.66659"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M2 7.33333V6.66667C2 5.95942 2.28095 5.28115 2.78105 4.78105C3.28115 4.28095 3.95942 4 4.66667 4H14"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M4.66667 14.6666L2 11.9999L4.66667 9.33325"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 8.66675V9.33341C14 10.0407 13.719 10.7189 13.219 11.219C12.7189 11.7191 12.0406 12.0001 11.3333 12.0001H2"
            stroke={t.colors.text.primary}
            strokeWidth={1.33333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ),
      onPress: () => {
        tradeBottomSheetRef.current?.present();
      },
    },
  ];

  const visibleActions = reviewMode
    ? actions.filter((action) => action.id !== 'trade')
    : actions;

  return (
    <>
      <View style={[t.flexRow, t.itemsCenter, t.pX3, t.pY1, { gap: 12 }]}>
        {visibleActions.map((action) => (
          <AnimatedPressable
            key={action.id}
            style={[
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.backgrounds.secondary,
              t.pX3,
              t.pY2,
              t.flex1,
              { gap: 6, borderRadius: 16, height: 40 },
            ]}
            onPress={action.onPress}
          >
            <View
              style={[
                t.itemsCenter,
                t.justifyCenter,
                t.roundedFull,
                { width: 20, height: 20 },
              ]}
            >
              {action.icon}
            </View>
            <Text2 weight="semibold" size="sm">
              {action.label}
            </Text2>
          </AnimatedPressable>
        ))}
      </View>
      {!reviewMode && (
        <BottomSheetModal ref={tradeBottomSheetRef} name="Wallet Trade Actions">
          <WalletTradeActionsContent
            onBuyPress={openBuy}
            onLimitBuyPress={openLimitBuy}
            onSellPress={openSell}
            onLimitSellPress={openLimitSell}
            onSwapPress={openSwap}
          />
        </BottomSheetModal>
      )}
    </>
  );
}
