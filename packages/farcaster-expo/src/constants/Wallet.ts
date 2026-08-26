import { ApiOnchainTokenChartPeriod } from 'farcaster-client-data';

// Transactions of this amount or more require biometric auth if
// biometricAuthLargeTransactions is enabled
export const largeTransactionUsd = 50;

export const defaultTokenChartPeriod =
  'h6' satisfies ApiOnchainTokenChartPeriod;

export const FARCASTER_PRO_IAP_PRODUCT_ID = 'warpconsumable18000';
export const FARCASTER_PRO_IAP_TRANSACTION_TYPE = 'upgrade-to-pro';

export const WALLET_NUX_CONFIG = {
  // Added in case there is a really small balance, we can still show the nux
  WALLET_BALANCE_MAX_THRESHOLD: 0.0001,
  // Added in case there is a bug where the balance is negative
  WALLET_BALANCE_MIN_THRESHOLD: 0,
  // Duration of nux animation in milliseconds
  DURATION: 1000,
  // Delay of nux animation in milliseconds
  DELAY: 100,
  PROGRESS_START_POINT: 0,
  PROGRESS_END_POINT: 1,
  // When nux components are hidden
  NUX_DISPLAY_PROGRESS_THRESHOLD: 0.4,
  PROGRESS_MID_POINT: 0.5,
  // When normal components are shown - slight difference so we don't need to manage exact heights
  NON_NUX_DISPLAY_PROGRESS_THRESHOLD: 0.6,
  // Height of the nux header as a percentage of the screen height
  NUX_HEADER_SCREEN_HEIGHT_RATIO: 0.3,
  // Width of the nux text as a percentage of the screen width
  NUX_TEXT_WIDTH_RATIO: '66.66%',
};

export const WALLET_PREFETCH_CONFIG = {
  PREFETCH_ON_VIEW_TOKEN: true,
  PREFETCH_ON_PRESS_IN: true,
  PREFETCH_ON_NAVIGATE_TO_TOKEN: true,
  PREFETCH_ON_TOKEN_PERIOD_CHANGE: true,
};

export const WALLET_ANIMATION_CONFIG = {
  LINE_CHART_ANIMATION_ENABLED: true,
  LINE_CHART_ANIMATION_DURATION: 200,
};
