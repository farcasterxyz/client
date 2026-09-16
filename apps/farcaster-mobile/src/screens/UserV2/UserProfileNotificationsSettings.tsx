import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiUser } from 'farcaster-client-data';
import {
  formatPrice,
  resolveUsernameShort,
  useCreateTraderSubscription,
  useDebouncedValue,
  useDeleteTraderSubscription,
  useDisableLinkNotifications,
  useEnableLinkNotifications,
  useGloballyCachedUser,
  useUserByFid,
} from 'farcaster-client-hooks';
import {
  AnimatedPressable,
  getTypographyTextStyle,
  Text2,
  TextInput,
  Typography,
  useTheme,
} from 'farcaster-expo';
import { useHaptics } from 'farcaster-expo/src/hooks/useHaptics';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { Radio } from '~/components/Radio';
import { buildScreen } from '~/components/Screen';
import { CommonStackParamList } from '~/types';

const DEFAULT_TRADER_NOTIFICATION_THRESHOLD = 10;

const MIN_TRADER_NOTIFICATION_THRESHOLD = 10;

type UserProfileNotificationsSettingsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'UserProfileNotificationsSettings'
>;

const UserProfileNotificationsSettingsScreen =
  buildScreen<UserProfileNotificationsSettingsScreenProps>(
    {
      name: 'UserProfileNotificationsSettings',
      insetTop: Platform.OS === 'android',
      themeV2: true,
    },
    ({
      route: {
        params: { profileFid },
      },
    }) => {
      const t = useTheme();

      return (
        <View style={[t.flex1]}>
          <React.Suspense>
            <WrappingPanel profileFid={profileFid} />
          </React.Suspense>
        </View>
      );
    },
  );

function WrappingPanel({ profileFid }: { profileFid: number }) {
  const t = useTheme();

  const { data } = useUserByFid({ fid: profileFid });

  const fallbackUser = React.useMemo(() => {
    return data.result.user;
  }, [data.result.user]);

  const user = useGloballyCachedUser({ fallback: fallbackUser });

  return (
    <ScrollView
      contentContainerStyle={[t.pX6, t.pT6, t.flexCol, { gap: 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[t.flexCol, t.borderB, t.borders.secondary, t.pB3]}>
        <Text2 size="2xl" weight="semibold">
          Push notifications
        </Text2>
        <Typography label="Body/Medium/Strong" color="secondary">
          {resolveUsernameShort({ fid: user.fid, username: user.username })}
        </Typography>
      </View>
      <CastActivityPanel user={user} />
      <TradeAlertsPanel user={user} />
    </ScrollView>
  );
}

type CastActivityOption = 'all' | 'priority' | 'off';

export function CastActivityPanel({ user }: { user: ApiUser }) {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const enablePushNotifications = useEnableLinkNotifications();

  const disablePushNotifications = useDisableLinkNotifications();

  const [value, setValue] = React.useState<CastActivityOption>(() => {
    if (user.viewerContext) {
      if (user.viewerContext.enableNotifications) {
        if (user.viewerContext.castNotificationsType === 'priority') {
          return 'priority';
        }

        return 'all';
      }
    }

    return 'off';
  });

  const onCastActivityChange = React.useCallback(
    (newValue: CastActivityOption) => {
      triggerImpactAsync();

      setValue(newValue);

      if (newValue === 'off') {
        void disablePushNotifications({ targetFid: user.fid });
      } else {
        void enablePushNotifications({ targetFid: user.fid, filter: newValue });
      }
    },
    [
      disablePushNotifications,
      enablePushNotifications,
      triggerImpactAsync,
      user.fid,
    ],
  );

  return (
    <View style={[{ gap: 12 }]}>
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 size="xl" weight="semibold" color="primary">
          Cast notifications
        </Text2>
      </View>
      <Radio
        options={[
          {
            value: 'all',
            title: 'All casts',
          },
          {
            value: 'priority',
            title: 'Recommended',
          },
          {
            value: 'off',
            title: 'Off',
          },
        ]}
        value={value}
        onChange={onCastActivityChange}
      />
    </View>
  );
}

type TradeAlertOption = 'token-algo' | 'token-swapped' | 'off';

type TraderAlertAmount = 'custom' | '100' | '1000' | '50' | 'off';

function convertToTraderAlertAmount({
  threshold,
}: {
  threshold: number | undefined;
}): TraderAlertAmount {
  if (typeof threshold === 'undefined') {
    return 'off';
  }

  if (threshold <= 0) {
    return 'off';
  }

  switch (threshold) {
    case 50: {
      return '50';
    }
    case 100: {
      return '100';
    }
    case 1000: {
      return '1000';
    }
    default: {
      return 'custom';
    }
  }
}

type TradeAlertsState = {
  alertAmount: TraderAlertAmount;
  amount: number | null;
  option: TradeAlertOption;
};

type TradeAlertsAction =
  | { type: 'HydrateFromViewerContext'; state: TradeAlertsState }
  | { type: 'SelectOption'; option: TradeAlertOption }
  | { type: 'SelectPreset'; amount: number }
  | { type: 'BeginCustom' }
  | { type: 'UpdateCustomAmount'; amount: number | null };

function getNormalizedAmount(amount: number | null): number {
  if (
    typeof amount === 'number' &&
    amount >= MIN_TRADER_NOTIFICATION_THRESHOLD
  ) {
    return amount;
  }

  return MIN_TRADER_NOTIFICATION_THRESHOLD;
}

function tradeAlertsReducer(
  state: TradeAlertsState,
  action: TradeAlertsAction,
): TradeAlertsState {
  switch (action.type) {
    case 'HydrateFromViewerContext': {
      return action.state;
    }
    case 'SelectOption': {
      if (action.option === 'token-swapped') {
        return {
          ...state,
          option: 'token-swapped',
          alertAmount:
            state.alertAmount === 'off' ? 'custom' : state.alertAmount,
          amount: getNormalizedAmount(state.amount),
        };
      }

      return {
        ...state,
        option: action.option,
      };
    }
    case 'SelectPreset': {
      return {
        ...state,
        option: 'token-swapped',
        alertAmount: convertToTraderAlertAmount({
          threshold: action.amount,
        }),
        amount: action.amount,
      };
    }
    case 'BeginCustom': {
      return {
        ...state,
        option: 'token-swapped',
        alertAmount: 'custom',
        amount: getNormalizedAmount(state.amount),
      };
    }
    case 'UpdateCustomAmount': {
      return {
        ...state,
        option: 'token-swapped',
        alertAmount: 'custom',
        amount: action.amount,
      };
    }
    default: {
      return state;
    }
  }
}

function buildTradeAlertsStateFromUser({
  userViewerContext,
}: {
  userViewerContext: ApiUser['viewerContext'];
}): TradeAlertsState {
  const rawThreshold =
    typeof userViewerContext?.traderNotificationThreshold === 'number'
      ? userViewerContext.traderNotificationThreshold
      : undefined;

  const threshold =
    typeof rawThreshold === 'number' && rawThreshold > 0
      ? rawThreshold
      : undefined;

  let option: TradeAlertOption = 'off';
  if (
    userViewerContext?.traderNotificationsType === 'token-swapped' &&
    typeof threshold !== 'undefined'
  ) {
    option = 'token-swapped';
  } else if (
    userViewerContext?.traderNotificationsType === 'token-algo' &&
    typeof threshold !== 'undefined'
  ) {
    option = 'token-algo';
  }

  const amount =
    typeof threshold === 'number'
      ? threshold
      : DEFAULT_TRADER_NOTIFICATION_THRESHOLD;

  const alertAmount =
    typeof threshold === 'number'
      ? convertToTraderAlertAmount({ threshold })
      : 'custom';

  return {
    alertAmount,
    amount,
    option,
  };
}

export function TradeAlertsPanel({ user }: { user: ApiUser }) {
  const t = useTheme();

  const { triggerImpactAsync } = useHaptics();

  const enableTraderNotifications = useCreateTraderSubscription();

  const disableTraderNotifications = useDeleteTraderSubscription();

  const derivedState = React.useMemo(
    () =>
      buildTradeAlertsStateFromUser({ userViewerContext: user.viewerContext }),
    [user.viewerContext],
  );

  const [state, dispatch] = React.useReducer(tradeAlertsReducer, derivedState);

  const syncedStateRef = React.useRef(derivedState);

  React.useEffect(() => {
    if (syncedStateRef.current === derivedState) {
      return;
    }

    syncedStateRef.current = derivedState;

    dispatch({
      type: 'HydrateFromViewerContext',
      state: derivedState,
    });
  }, [derivedState, dispatch]);

  const { alertAmount, amount, option } = state;

  const debouncedCustomAmount = useDebouncedValue({
    value: amount,
    debounceDuration: 500,
  });

  const hasInteractedWithCustomRef = React.useRef(false);
  const lastSubmittedAmountRef = React.useRef<number | null>(null);

  const inputRef = React.useRef<TextInput>(null);

  const resolveMinimumValueUsd = React.useCallback(() => {
    if (
      typeof amount === 'number' &&
      amount >= MIN_TRADER_NOTIFICATION_THRESHOLD
    ) {
      return amount;
    }

    return MIN_TRADER_NOTIFICATION_THRESHOLD;
  }, [amount]);

  const onPressQuickSet = React.useCallback(
    ({ amount }: { amount: number }) => {
      triggerImpactAsync();

      inputRef.current?.blur();

      dispatch({
        type: 'SelectPreset',
        amount,
      });

      void enableTraderNotifications({
        targetFid: user.fid,
        type: 'token-swapped',
        minimumValueUsd: amount,
      });
    },
    [dispatch, enableTraderNotifications, triggerImpactAsync, user.fid],
  );

  const onPressCustom = React.useCallback(() => {
    triggerImpactAsync();
    hasInteractedWithCustomRef.current = true;

    inputRef.current?.clear();

    inputRef.current?.focus();

    dispatch({
      type: 'BeginCustom',
    });

    const minimumValueUsd = resolveMinimumValueUsd();

    lastSubmittedAmountRef.current = minimumValueUsd;

    void enableTraderNotifications({
      targetFid: user.fid,
      type: 'token-swapped',
      minimumValueUsd: minimumValueUsd,
    });
  }, [
    dispatch,
    enableTraderNotifications,
    resolveMinimumValueUsd,
    triggerImpactAsync,
    user.fid,
  ]);

  const onTextChange = React.useCallback(
    (text: string) => {
      hasInteractedWithCustomRef.current = true;

      if (text === '') {
        dispatch({ type: 'UpdateCustomAmount', amount: null });
        return;
      }

      const parsedValue = parseInt(text, 10);

      if (isNaN(parsedValue)) {
        return;
      }

      dispatch({ type: 'UpdateCustomAmount', amount: parsedValue });
    },
    [dispatch],
  );

  const onTradeAlertChange = React.useCallback(
    (newValue: TradeAlertOption) => {
      triggerImpactAsync();

      inputRef.current?.blur();

      dispatch({
        type: 'SelectOption',
        option: newValue,
      });

      // FIXME: What is the value of sending this to backend? Seems off.
      const previousMinimumValueUsd =
        user.viewerContext?.traderNotificationThreshold ??
        DEFAULT_TRADER_NOTIFICATION_THRESHOLD;

      if (newValue === 'off') {
        void disableTraderNotifications({
          targetFid: user.fid,
          previousMinimumValueUsd: previousMinimumValueUsd,
        });

        return;
      }

      const minimumValueUsd = resolveMinimumValueUsd();

      void enableTraderNotifications({
        targetFid: user.fid,
        type: newValue,
        minimumValueUsd,
      });
    },
    [
      disableTraderNotifications,
      dispatch,
      enableTraderNotifications,
      resolveMinimumValueUsd,
      triggerImpactAsync,
      user.fid,
      user.viewerContext?.traderNotificationThreshold,
    ],
  );

  React.useEffect(() => {
    if (
      alertAmount !== 'custom' ||
      option !== 'token-swapped' ||
      !hasInteractedWithCustomRef.current
    ) {
      return;
    }

    if (
      typeof debouncedCustomAmount !== 'number' ||
      debouncedCustomAmount < MIN_TRADER_NOTIFICATION_THRESHOLD
    ) {
      return;
    }

    if (lastSubmittedAmountRef.current === debouncedCustomAmount) {
      return;
    }

    lastSubmittedAmountRef.current = debouncedCustomAmount;

    void enableTraderNotifications({
      targetFid: user.fid,
      type: 'token-swapped',
      minimumValueUsd: debouncedCustomAmount,
    });
  }, [
    alertAmount,
    debouncedCustomAmount,
    enableTraderNotifications,
    option,
    user.fid,
  ]);

  return (
    <KeyboardAvoidingView behavior="padding" style={[{ gap: 12 }]}>
      <View style={[t.flexRow, t.itemsCenter, t.justifyBetween]}>
        <Text2 size="xl" weight="semibold" color="primary">
          Trade notifications
        </Text2>
      </View>
      <View
        style={[
          t.flex,
          t.flexCol,
          t.wFull,
          t.backgrounds.secondary,
          { borderRadius: 16 },
        ]}
      >
        <TouchableOpacity
          style={[
            t.flex,
            t.flexCol,
            t.p3,
            t.borderB,
            t.borders.background,
            t.gap3,
          ]}
          activeOpacity={0.75}
          onPress={() => onTradeAlertChange('token-swapped')}
        >
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}>
            <View style={[t.flexCol]}>
              <Typography label="Body/Large">Trades larger than</Typography>
            </View>
            {option === 'token-swapped' && (
              <Check
                size={20}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                color={t.colors.text.brand}
              />
            )}
          </View>
          <View style={[t.flex, t.flexRow, { gap: 12 }]}>
            <AnimatedPressable
              style={[
                t.flexGrow,
                t.itemsCenter,
                { borderRadius: 12 },
                t.p2,
                t.border,
                t.dark ? t.borders.secondary : t.borders.tertiary,
                option === 'token-swapped' &&
                  alertAmount === '50' && [
                    { borderColor: t.colors.text.brand },
                    t.backgrounds.brandLight,
                  ],
              ]}
              onPress={() => onPressQuickSet({ amount: 50 })}
            >
              <Typography label="Semibold/Base" color="secondary">
                {formatPrice(50).split('.00')[0]}
              </Typography>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                t.flexGrow,
                t.itemsCenter,
                { borderRadius: 12 },
                t.p2,
                t.border,
                t.dark ? t.borders.secondary : t.borders.tertiary,
                option === 'token-swapped' &&
                  alertAmount === '100' && [
                    { borderColor: t.colors.text.brand },
                    t.backgrounds.brandLight,
                  ],
              ]}
              onPress={() => onPressQuickSet({ amount: 100 })}
            >
              <Typography label="Semibold/Base" color="secondary">
                {formatPrice(100).split('.00')[0]}
              </Typography>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                t.flexGrow,
                t.itemsCenter,
                { borderRadius: 12 },
                t.p2,
                t.border,
                t.dark ? t.borders.secondary : t.borders.tertiary,
                option === 'token-swapped' &&
                  alertAmount === '1000' && [
                    { borderColor: t.colors.text.brand },
                    t.backgrounds.brandLight,
                  ],
              ]}
              onPress={() => onPressQuickSet({ amount: 1000 })}
            >
              <Typography label="Semibold/Base" color="secondary">
                {formatPrice(1000).split('.00')[0]}
              </Typography>
            </AnimatedPressable>
            <AnimatedPressable
              style={[
                t.flexGrow,
                t.itemsCenter,
                { borderRadius: 12 },
                t.p2,
                t.border,
                t.dark ? t.borders.secondary : t.borders.tertiary,
                option === 'token-swapped' &&
                  alertAmount === 'custom' && [
                    { borderColor: t.colors.text.brand },
                    t.backgrounds.brandLight,
                  ],
              ]}
              onPress={onPressCustom}
            >
              <Typography label="Semibold/Base" color="secondary">
                Custom
              </Typography>
            </AnimatedPressable>
          </View>
          {alertAmount === 'custom' && option === 'token-swapped' && (
            <View
              style={[
                t.flexRow,
                t.itemsCenter,
                t.justifyStart,
                t.backgrounds.primary,
                { borderRadius: 12 },
                t.p3,
                t.gap2,
              ]}
            >
              <Typography
                label="Semibold/L"
                color="tertiary"
                style={[t.textCenter, { marginTop: 1.25 }]}
              >
                $
              </Typography>
              <TextInput
                ref={inputRef}
                value={amount?.toString() ?? ''}
                onChangeText={onTextChange}
                style={getTypographyTextStyle('Semibold/L', [
                  t.wFull,
                  t.texts.primary,
                ])}
                keyboardType="number-pad"
                onPress={inputRef.current?.focus}
                autoFocus={false}
              />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            t.flex,
            t.flexRow,
            t.justifyBetween,
            t.itemsCenter,
            t.p3,
            t.borderB,
            t.borders.background,
          ]}
          activeOpacity={0.75}
          onPress={() => onTradeAlertChange('token-algo')}
        >
          <View style={[t.flexCol]}>
            <Typography label="Body/Large">Recommended</Typography>
          </View>
          {option === 'token-algo' && (
            <Check
              size={20}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              color={t.colors.text.brand}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[t.flex, t.flexRow, t.justifyBetween, t.itemsCenter, t.p3]}
          activeOpacity={0.75}
          onPress={() => onTradeAlertChange('off')}
        >
          <View style={[t.flexCol]}>
            <Typography label="Body/Large">Off</Typography>
          </View>
          {option === 'off' && (
            <Check
              size={20}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              color={t.colors.text.brand}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

UserProfileNotificationsSettingsScreen.displayName =
  'UserProfileNotificationsSettingsScreen';

export { UserProfileNotificationsSettingsScreen };
