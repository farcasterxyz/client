import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { hitSlop } from '../../constants';
import { useSharedNavigationContext, useTheme } from '../../contexts';
import { Text2 } from '../design-system';

function WalletScreenHeader({
  title,
  onBackCallback,
  rightIcon,
  leftIcon,
  style,
  shouldShowBack = true,
}: {
  title: string;
  onBackCallback?: () => void;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shouldShowBack?: boolean;
}) {
  const t = useTheme();

  const { goBack } = useSharedNavigationContext();

  const onBackPress = React.useCallback(() => {
    if (typeof onBackCallback === 'function') {
      onBackCallback();

      return;
    }

    goBack();
  }, [goBack, onBackCallback]);

  const shouldShowBackMemo = React.useMemo(() => {
    if (Platform.OS === 'ios') {
      return shouldShowBack && typeof onBackCallback !== 'undefined';
    }

    if (Platform.OS === 'android') {
      return shouldShowBack;
    }

    return shouldShowBack;
  }, [onBackCallback, shouldShowBack]);

  return (
    <View
      style={[
        t.flexRow,
        t.itemsCenter,
        t.justifyEvenly,
        t.pX3,
        t.pT5,
        t.pB4,
        style,
      ]}
    >
      {shouldShowBackMemo ? (
        <Pressable
          hitSlop={hitSlop}
          onPress={onBackPress}
          style={{ width: 40 }}
        >
          <ChevronLeft size={24} color={t.colors.text.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }}>{leftIcon}</View>
      )}
      <View style={[t.flex1, t.itemsCenter]}>
        <Text2
          size="lg"
          weight="semibold"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ maxWidth: '90%' }}
        >
          {title}
        </Text2>
      </View>
      <View style={[t.itemsEnd, { width: 40 }]}>{rightIcon}</View>
    </View>
  );
}

export { WalletScreenHeader };
