import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useTheme } from '../../../contexts/ThemeContext';
import { CollectibleIcon } from '../../crypto/collectibles/CollectibleIcon';
import { AnimatedPressable, Text2 } from '../../design-system';
import { SkeletonPlaceholder } from '../../design-system/SkeletonPlaceholder';

export const SPACING = 12;

interface NftItemProps {
  imageUrl: string;
  name: string;
  amount?: string;
  imageSize: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  dangerouslyAllowAnimation?: boolean;
}

export function WalletCollectiblesItem({
  imageUrl,
  name,
  amount,
  imageSize,
  onPress,
  style,
  dangerouslyAllowAnimation = false,
}: NftItemProps) {
  const t = useTheme();

  const amountNumber = useMemo(() => {
    if (!amount) {
      return 1;
    }

    try {
      return parseFloat(amount);
    } catch (e) {
      return 1;
    }
  }, [amount]);

  return (
    <View
      style={[
        {
          width: imageSize,
          marginHorizontal: SPACING / 2,
          marginBottom: SPACING,
        },
        style,
      ]}
    >
      <AnimatedPressable onPress={onPress}>
        <CollectibleIcon
          imageUrl={imageUrl}
          imageSize={imageSize}
          dangerouslyAllowAnimation={dangerouslyAllowAnimation}
        />
        <View
          style={[
            t.absolute,
            t.bottom0,
            t.left0,
            t.wFull,
            t.hFull,
            t.justifyEnd,
            t.roundedBLg,
            t.overflowHidden,
            { maxWidth: imageSize },
          ]}
        >
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0.5 }}
            style={[t.absolute, t.top0, t.left0, t.flex1, t.bottom0, t.right0]}
          />
          <View style={[t.pX2, t.pY1, t.relative, t.overflowHidden]}>
            <Text2 size="2xs" weight="semibold" color="light" numberOfLines={1}>
              {name}
            </Text2>
          </View>
        </View>
        {amountNumber > 1 && (
          <View style={[t.absolute, t.top0, t.right0, t.p1]}>
            <View
              style={[t.roundedLg, t.pX2, t.pY1, t.relative, t.overflowHidden]}
            >
              <View
                style={[
                  t.absolute,
                  t.top0,
                  t.left0,
                  t.flex1,
                  t.bottom0,
                  t.right0,
                  t.bgBlack,
                  t.opacity25,
                ]}
              />
              <Text2
                size="2xs"
                weight="semibold"
                color="light"
                numberOfLines={1}
              >
                {amountNumber}
              </Text2>
            </View>
          </View>
        )}
      </AnimatedPressable>
    </View>
  );
}

export function WalletCollectiblesItemPlaceholder({
  imageSize,
}: {
  imageSize: number;
}) {
  const t = useTheme();

  return (
    <View
      style={[
        {
          width: imageSize,
          marginHorizontal: SPACING / 2,
          marginBottom: SPACING,
        },
      ]}
    >
      <SkeletonPlaceholder
        style={[
          t.roundedLg,
          {
            width: imageSize,
            height: imageSize,
          },
        ]}
      />
    </View>
  );
}

export function WalletCollectiblesItemsPlaceholder({
  columns = 2,
  rows = 3,
  imageSize,
}: {
  columns?: number;
  rows?: number;
  imageSize: number;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {[...Array(columns * rows)].map((_, idx) => (
        <WalletCollectiblesItemPlaceholder key={idx} imageSize={imageSize} />
      ))}
    </View>
  );
}
