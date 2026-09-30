import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import React, { FC, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useHeader } from '~/contexts/HeaderProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { usePopToTop } from '~/hooks/navigation/usePoptoTop';
import { HeaderOptions } from '~/types';

type HeaderLeftAlignedProps = NativeStackHeaderProps & HeaderOptions;

const HeaderLeftAligned: FC<HeaderLeftAlignedProps> = ({
  options,
  navigation,
  hideCancel: hideCancelDefault,
  disableCancel: disableCancelDefault,
  cancelPopsToTop: cancelPopsToTopDefault,
  onCancelPress: onCancelPressDefault,
}) => {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const { getHeaderOptions } = useHeader();
  const { key } = useRoute();
  const popToTop = usePopToTop();

  // Dynamic overrides via context
  const {
    hideCancel: hideCancelOverride,
    disableCancel: disableCancelOverride,
    cancelPopsToTop: cancelPopsToTopOverride,
    onCancelPress: onCancelPressOverride,
    onBackPress: onBackPressOverride,
  } = getHeaderOptions(key);

  const hideCancel = hideCancelOverride ?? hideCancelDefault;
  const disableCancel = disableCancelOverride ?? disableCancelDefault;
  const cancelPopsToTop = cancelPopsToTopOverride ?? cancelPopsToTopDefault;
  const onCancelPress = onCancelPressOverride ?? onCancelPressDefault;
  const onBackPress = onBackPressOverride ?? navigation.goBack;

  const showBack = options.headerBackVisible !== false;
  const showCancel = hideCancel !== true;
  const showNavigation = showCancel || showBack;

  const titleComp = useMemo(
    () =>
      options.headerTitle === undefined ? null : typeof options.headerTitle ===
        'string' ? (
        <Text style={[t.text2xl, t.texts.primary, t.mR2]}>
          {options.headerTitle}
        </Text>
      ) : (
        <options.headerTitle tintColor={options.headerTintColor}>
          {options.title || ''}
        </options.headerTitle>
      ),
    [options, t],
  );

  const onCancel = useMemo(
    () =>
      onCancelPress ??
      (cancelPopsToTop || showBack ? popToTop : navigation.goBack),
    [cancelPopsToTop, navigation.goBack, onCancelPress, popToTop, showBack],
  );

  return (
    <View
      style={[
        t.flexCol,
        titleComp !== null ? t.pB6 : t.pB2,
        t.bgDefault,
        {
          paddingTop: insets.top + sizes.s2 + (showNavigation ? 0 : sizes.s2),
          paddingLeft: 14,
          paddingRight: 14,
        },
      ]}
    >
      {showNavigation && (
        <View style={[t.flexRow, t.justifyBetween]}>
          <View>
            {showBack && (
              <Pressable
                hitSlop={hitSlop}
                onPress={onBackPress}
                style={[t.mB2]}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  style={[t.texts.secondary, t._mL2]}
                />
              </Pressable>
            )}
          </View>
          {showCancel && (
            <Pressable
              hitSlop={hitSlop}
              disabled={disableCancel}
              onPress={onCancel}
              style={[t.mB2]}
            >
              <Ionicons
                name="close"
                size={24}
                style={[
                  t.texts.secondary,
                  t._mL2,
                  disableCancel && t.opacity25,
                ]}
              />
            </Pressable>
          )}
        </View>
      )}
      {titleComp}
    </View>
  );
};

HeaderLeftAligned.displayName = 'HeaderLeftAligned';

// We need and require the use of this middleware function for 2 reasons:
// - if we pass the component directly to `options.header` it will render in
//   the parent component, so useRoute will wrongly return the parent route
// - makes it easier to pass custom params without defining a function for every use
function headerLeftAligned(overrideOptions?: Partial<HeaderLeftAlignedProps>) {
  return (options: HeaderLeftAlignedProps) => {
    const combinedOptions: HeaderLeftAlignedProps = {
      ...options,
      ...overrideOptions,
    };

    // Default to disabling the back button on the left in favor of the cancel button on the right
    if (combinedOptions.options.headerBackVisible === undefined) {
      combinedOptions.options.headerBackVisible = false;
    }

    return <HeaderLeftAligned {...combinedOptions} />;
  };
}

export { headerLeftAligned };
