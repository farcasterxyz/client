import { AnalyticsEvent } from 'farcaster-analytics';
import {
  AtomsButton,
  getTypographyTextStyle,
  TextColor,
  Typography,
  TypographyHeading,
} from 'farcaster-expo';
import { ButtonHierarchy } from 'farcaster-expo/src/components/design-system/atoms/Button/types';
import { InfoIcon } from 'lucide-react-native';
import React, { forwardRef, useRef } from 'react';
import {
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  TextInput as TextInputRN,
  TextInputProps as TextInputPropsRN,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Path, Svg } from 'react-native-svg';

import { Text2 } from '~/components/Text';
import { TextInput, TextInputProps } from '~/components/TextInput/TextInput';
import { createOneOffHitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useHaptics } from '~/hooks/useHaptics';
import { trackError } from '~/utils/ErrorUtils';

const NAV_BACK_HIT_SLOP = createOneOffHitSlop(20);

function BackIcon({ fill }: { fill: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExitIcon({ fill }: { fill: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 6L18 18"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FowardIcon({ fill }: { fill: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const Onboarding = {
  Layout: ({
    children,
    onBackPress,
    onSkipPress,
    hideIcons,
  }: {
    onBackPress: (() => void) | undefined;
    onSkipPress: (() => void) | undefined;
    children: React.ReactNode;
    hideIcons?: boolean;
  }) => {
    const navigate = useNavigate();

    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();
    const { trackEvent } = useAnalytics();

    const onBackPressWrapped = React.useCallback(() => {
      triggerImpactAsync();

      if (typeof onBackPress === 'undefined') {
        navigate('Landing', {});
        trackEvent(AnalyticsEvent.PressExitOnboarding);
      } else {
        onBackPress();
      }
    }, [navigate, onBackPress, triggerImpactAsync, trackEvent]);

    const onSkipPressWrapped = React.useCallback(() => {
      if (typeof onSkipPress === 'undefined') {
        return;
      }

      triggerImpactAsync();

      onSkipPress();
    }, [onSkipPress, triggerImpactAsync]);

    return (
      <View style={[t.flex1]}>
        <View
          style={[
            t.pX4,
            t.h12,
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
          ]}
        >
          {!hideIcons && (
            <OnboardingPressableScale
              onPress={onBackPressWrapped}
              style={[t.flex, t.flexRow, t.itemsCenter]}
              minScale={0.8}
              hitSlop={NAV_BACK_HIT_SLOP}
            >
              {typeof onBackPress === 'undefined' ? (
                <ExitIcon fill={t.colors.text.primary} />
              ) : (
                <BackIcon fill={t.colors.text.primary} />
              )}
            </OnboardingPressableScale>
          )}
          {!hideIcons && (
            <OnboardingPressableScale
              onPress={onSkipPressWrapped}
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                typeof onSkipPress === 'undefined' && [t.opacity0],
              ]}
              minScale={0.8}
            >
              <Text2 weight="regular" size="base" color="primary">
                Skip
              </Text2>
              <FowardIcon fill={t.colors.text.primary} />
            </OnboardingPressableScale>
          )}
        </View>
        <View style={[t.flex1, t.pX5, t.gap3]}>{children}</View>
      </View>
    );
  },

  Title: ({ children }: { children: React.ReactNode }) => {
    const t = useTheme();

    return (
      <TypographyHeading label="ExtraLarge" style={[t.itemsCenter, t.mT3]}>
        {children}
      </TypographyHeading>
    );
  },

  Sub: ({ children }: { children: React.ReactNode }) => {
    return (
      <Typography numberOfLines={1} adjustsFontSizeToFit label="Medium/L">
        {children}
      </Typography>
    );
  },

  Text: ({
    children,
    numberOfLines,
    ellipsizeMode,
  }: {
    children: React.ReactNode;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  }) => {
    return (
      <Typography
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        label="Medium/S"
        color="tertiary"
      >
        {children}
      </Typography>
    );
  },

  InputHelperText: ({
    children,
    color = 'tertiary',
  }: {
    children: React.ReactNode;
    color?: TextColor;
  }) => {
    return (
      <Typography color={color} label="Medium/S">
        {children}
      </Typography>
    );
  },

  InputSuccessText: ({ children }: { children: React.ReactNode }) => {
    return (
      <Onboarding.InputHelperText color="success">
        {children}
      </Onboarding.InputHelperText>
    );
  },

  InputErrorText: ({ children }: { children: React.ReactNode }) => {
    return (
      <Onboarding.InputHelperText color="danger">
        {children}
      </Onboarding.InputHelperText>
    );
  },

  ButtonDisclaimer: ({ children }: { children: React.ReactNode }) => {
    return (
      <Text2
        size="sm"
        weight="medium"
        color="tertiary"
        style={[{ textAlign: 'center' }]}
      >
        {children}
      </Text2>
    );
  },

  Alert: ({ children }: { children: React.ReactNode }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.p3,
          t.itemsStart,
          t.flexRow,
          t.justifyCenter,
          t.backgrounds.warning,
          { borderRadius: 16, gap: 8 },
        ]}
      >
        <View>
          <InfoIcon size={20} stroke={t.colors.text.warning} />
        </View>
        <View style={[t.flex1]}>
          <Typography label="Body/Large/Strong" color="warning">
            {children}
          </Typography>
        </View>
      </View>
    );
  },

  MutedAlert: ({ children }: { children: React.ReactNode }) => {
    const t = useTheme();

    return (
      <View
        style={[
          t.p3,
          t.itemsStart,
          t.flexRow,
          t.justifyCenter,
          t.backgrounds.informative,
          { borderRadius: 16, gap: 8 },
        ]}
      >
        <View>
          <InfoIcon size={20} stroke={t.colors.text.informative} />
        </View>
        <View style={[t.flex1]}>
          <Typography label="Body/Large/Strong" color="informative">
            {children}
          </Typography>
        </View>
      </View>
    );
  },

  Button: ({
    children,
    onPress,
    disabled,
    loading,
  }: React.PropsWithChildren & {
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
  }) => {
    return (
      <AtomsButton
        onPress={onPress}
        disabled={disabled}
        size={'l'}
        hierarchy="primary"
        loading={loading}
      >
        {children}
      </AtomsButton>
    );
  },

  SecondaryButton: ({
    children,
    onPress,
    disabled,
    loading,
    hierarchy = 'tertiary',
  }: React.PropsWithChildren & {
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    hierarchy?: ButtonHierarchy;
  }) => {
    return (
      <AtomsButton
        onPress={onPress}
        disabled={disabled}
        size="l"
        hierarchy={hierarchy}
        loading={loading}
      >
        {children}
      </AtomsButton>
    );
  },

  LinkButton: ({
    children,
    onPress,
    disabled,
  }: React.PropsWithChildren & {
    onPress: () => void;
    disabled?: boolean;
  }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const onPressWrapped = React.useCallback(() => {
      if (disabled) {
        return;
      }

      triggerImpactAsync();

      onPress();
    }, [disabled, onPress, triggerImpactAsync]);

    const pressableStyle = React.useMemo(
      () => [
        t.h10,
        t.pX3,
        t.bgDefault,
        t.itemsCenter,
        t.justifyCenter,
        { borderRadius: 16 },
        disabled && [t.opacity25],
      ],
      [
        disabled,
        t.bgDefault,
        t.h10,
        t.itemsCenter,
        t.justifyCenter,
        t.opacity25,
        t.pX3,
      ],
    );

    return (
      <OnboardingPressableScale
        minScale={0.98}
        onPress={onPressWrapped}
        style={pressableStyle}
      >
        <Text2
          size="base"
          weight="semibold"
          color="secondary"
          style={[t.itemsCenter]}
        >
          {children}
        </Text2>
      </OnboardingPressableScale>
    );
  },

  IconButton: ({
    children,
    onPress,
    disabled,
  }: React.PropsWithChildren & {
    onPress: () => void;
    disabled?: boolean;
  }) => {
    const t = useTheme();

    const { triggerImpactAsync } = useHaptics();

    const onPressWrapped = React.useCallback(() => {
      if (disabled) {
        return;
      }

      triggerImpactAsync();

      onPress();
    }, [disabled, onPress, triggerImpactAsync]);

    const pressableStyle = React.useMemo(
      () => [
        t.bgLightGray,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        t.h7,
        t.w7,
        t.border,
        t.borderBackground,
        { padding: 2 },
        t.overflowHidden,
      ],
      [
        t.bgLightGray,
        t.h7,
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        t.w7,
        t.border,
        t.borderBackground,
        t.overflowHidden,
      ],
    );

    return (
      <OnboardingPressableScale
        minScale={0.8}
        onPress={onPressWrapped}
        style={pressableStyle}
      >
        <View style={[t.bgLightGray]}>{children}</View>
      </OnboardingPressableScale>
    );
  },

  Input: ({
    autoCorrect,
    autoCapitalize,
    autoComplete,
    autoFocus,
    spellCheck,
    maxLength,
    placeholder,
    defaultValue,
    onChangeText,
    keyboardType,
    onFocus,
    value,
    label,
    color,
    returnKeyType,
    onSubmitEditing,
    textContentType,
  }: React.PropsWithChildren & {
    label?: string;
    color?: TextColor;
  } & Pick<
      TextInputProps,
      | 'autoCorrect'
      | 'autoCapitalize'
      | 'autoComplete'
      | 'autoFocus'
      | 'spellCheck'
      | 'maxLength'
      | 'placeholder'
      | 'defaultValue'
      | 'onChangeText'
      | 'autoComplete'
      | 'keyboardType'
      | 'textContentType'
      | 'onFocus'
      | 'value'
      | 'returnKeyType'
      | 'onSubmitEditing'
    >) => {
    const t = useTheme();

    const [hasValue, setHasValue] = React.useState(!!defaultValue);

    const wrappedOnFocus = React.useCallback(
      (e: Parameters<NonNullable<TextInputPropsRN['onFocus']>>[0]) => {
        onFocus?.(e);
      },
      [onFocus],
    );

    const wrapperStyle = React.useMemo((): ViewStyle[] => {
      return [
        t.gap2,
        t.backgrounds.secondary,
        { borderRadius: 12 },
        t.p3,
        t.justifyCenter,
      ] satisfies ViewStyle[];
    }, [t.backgrounds.secondary, t.p3, t.justifyCenter, t.gap2]);

    const inputStyle = React.useMemo(() => {
      return [
        t.bgTransparent,
        getTypographyTextStyle('Body/Large', [
          !color ? (hasValue ? t.texts.primary : t.texts.tertiary) : {},
          color ? t.texts[color] : {},
        ]),
        t.borderTransparent,
        t.h8,
        t.alignCenter,
        Platform.OS === 'ios' ? t.mB1 : undefined,
      ] satisfies TextStyle[];
    }, [
      color,
      hasValue,
      t.alignCenter,
      t.bgTransparent,
      t.borderTransparent,
      t.h8,
      t.texts,
      t.mB1,
    ]);

    const onChangeTextWrapped = React.useCallback(
      (text: string) => {
        setHasValue(!!text);
        onChangeText?.(text);
      },
      [onChangeText],
    );

    return (
      <View style={wrapperStyle}>
        {!!label && (
          <Typography label="Body/Medium/Strong" color="secondary">
            {label}
          </Typography>
        )}
        <TextInput
          underlineColorAndroid="transparent"
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          keyboardType={keyboardType}
          spellCheck={spellCheck}
          clearButtonMode="never"
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={t.colors.text.tertiary}
          inputStyle={inputStyle}
          defaultValue={defaultValue}
          // For most onboarding inputs we are moving away from the controlled inputs
          // But to ensure text is always lowercase (or other masking/transformations), we need a controlled input
          value={value}
          onChangeText={onChangeTextWrapped}
          onFocus={wrappedOnFocus}
          variant={'no-style'}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
        />
      </View>
    );
  },

  TextArea: forwardRef(
    (
      {
        autoCorrect,
        autoCapitalize,
        autoFocus,
        spellCheck,
        maxLength,
        placeholder,
        defaultValue,
        onChangeText,
        keyboardType,
        onFocus,
        label,
        returnKeyType,
        onSubmitEditing,
      }: React.PropsWithChildren & { label?: string } & Pick<
          TextInputProps,
          | 'autoCorrect'
          | 'autoCapitalize'
          | 'autoFocus'
          | 'spellCheck'
          | 'maxLength'
          | 'placeholder'
          | 'defaultValue'
          | 'onChangeText'
          | 'keyboardType'
          | 'onFocus'
          | 'returnKeyType'
          | 'onSubmitEditing'
        >,
      ref: React.Ref<TextInputRN>,
    ) => {
      const t = useTheme();

      const inputStyle = React.useMemo((): TextStyle[] => {
        return [
          t.bgTransparent,
          t.borderTransparent,
          t.p0,
          getTypographyTextStyle('Body/Large'),
        ] satisfies TextStyle[];
      }, [t.bgTransparent, t.borderTransparent, t.p0]);

      const wrapperStyle = React.useMemo((): TextStyle[] => {
        return [
          t.gap2,
          t.pX3,
          t.pY3,
          t.backgrounds.secondary,
          { maxHeight: 148, borderRadius: 12, textAlignVertical: 'top' },
        ] satisfies TextStyle[];
      }, [t.pX3, t.pY3, t.gap2, t.backgrounds.secondary]);

      const onChangeTextWrapped = React.useCallback(
        (text: string) => {
          onChangeText?.(text);
        },
        [onChangeText],
      );

      return (
        <View style={wrapperStyle}>
          {!!label && (
            <Typography label="Body/Medium/Strong" color="secondary">
              {label}
            </Typography>
          )}
          <TextInput
            ref={ref}
            underlineColorAndroid="transparent"
            autoCorrect={autoCorrect}
            autoCapitalize={autoCapitalize}
            autoFocus={autoFocus}
            keyboardType={keyboardType}
            spellCheck={spellCheck}
            clearButtonMode="never"
            maxLength={maxLength}
            placeholder={placeholder}
            placeholderTextColor={t.colors.text.tertiary}
            inputStyle={inputStyle}
            defaultValue={defaultValue}
            // For onboarding inputs we are moving away from the controlled inputs
            value={undefined}
            onChangeText={onChangeTextWrapped}
            multiline={true}
            numberOfLines={8}
            onFocus={onFocus}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
          />
        </View>
      );
    },
  ),

  CodeInput: ({
    onChangeText,
    length = 6,
  }: {
    onChangeText: (text: string) => void;
    length?: number;
  }): React.ReactNode => {
    const t = useTheme();
    const [code, setCode] = React.useState('');
    const onChangeTextWrapped = React.useCallback(
      (text: string) => {
        setCode(text);
        onChangeText(text);
      },
      [onChangeText],
    );

    const ref = useRef<TextInputRN>(null);

    const onCodeInputPress = React.useCallback(() => {
      if (Platform.OS === 'android' && ref.current?.isFocused()) {
        ref.current?.blur();
      }
      ref.current?.focus();
    }, []);

    return (
      <View>
        <TextInputRN
          ref={ref}
          style={{
            height: Platform.OS === 'ios' ? 0 : 1,
            elevation: 0,
            width: 1,
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          keyboardType="number-pad"
          autoFocus={true}
          onChangeText={onChangeTextWrapped}
          maxLength={length}
          cursorColor={'transparent'}
        />
        <Pressable onPress={onCodeInputPress}>
          <View style={[t.flexRow, t.justifyBetween]}>
            {Array.from({ length }).map((_, index) => (
              <View
                key={index}
                style={[
                  {
                    width: 48,
                    height: 54,
                    borderRadius: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  t.backgrounds.secondary,
                ]}
              >
                <Typography label="Heading/Display" color="primary">
                  {code[index] ?? ''}
                </Typography>
              </View>
            ))}
          </View>
        </Pressable>
      </View>
    );
  },
};

const BaseAnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OnboardingPressableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  minScale,
  ...rest
}: {
  targetScale?: number;
  style?: StyleProp<ViewStyle>;
  minScale: number;
} & Exclude<PressableProps, 'onPressIn' | 'onPressOut' | 'style'>) {
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <BaseAnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        onPressIn?.(e);
        cancelAnimation(scale);
        scale.value = withTiming(minScale, { duration: 100 });
      }}
      onPressOut={(e) => {
        onPressOut?.(e);
        cancelAnimation(scale);
        scale.value = withTiming(1, { duration: 100 });
      }}
      style={[!reducedMotion && animatedStyle, style]}
      {...rest}
    >
      {children}
    </BaseAnimatedPressable>
  );
}

export const RUM_ACTIONS = {
  passkeyEnroll: 'onboarding_passkey_enroll',
  passkeyCancelled: 'onboarding_passkey_cancelled',
  passkeyOperationNotSupported: 'onboarding_passkey_not_supported',
  passkeyUnknownError: 'onboarding_passkey_unknown_error',
  creatingAccountPerceivedStale: 'creating_account_perceived_stale',
  submitRegisterFid: 'submit_register_fid',
  fidRegistered: 'fid_registered',

  // legacy
  registering: 'onboarding:registering',
  registeringCompleted: 'onboarding:registering:completed',
  registeringError: 'onboarding:registering:error',
};

export function trackOnboardingError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any,
  step: string,
  context?: Record<string, unknown>,
) {
  trackError(error, {
    ...context,
    feature: 'onboarding',
    step,
  });
}

export { Onboarding };
