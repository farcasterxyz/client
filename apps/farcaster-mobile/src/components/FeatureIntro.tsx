import { Image, ImageSource } from 'expo-image';
import { AnimatedPressable, Text2 } from 'farcaster-expo';
import * as React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '~/contexts/ThemeProvider';

export function FeatureIntro({
  titleLabel,
  title,
  bannerImage,
  bullets,
  primaryActionText,
  primaryActionOnPress,
  secondaryActionText,
  secondaryActionOnPress,
}: {
  titleLabel: string;
  title: string;
  bannerImage: ImageSource;
  bullets: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }[];
  primaryActionText: string;
  primaryActionOnPress: () => void;
  secondaryActionText?: string;
  secondaryActionOnPress?: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[t.flex1]}>
      <ScrollView
        contentContainerStyle={[
          t.pX3,
          {
            paddingBottom: insets.bottom,
            flexGrow: 1,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={bannerImage}
          style={{ width: '100%', height: 240 }}
          contentFit="contain"
        />
        <View style={[t.flex1, t.justifyBetween, { gap: 8 }]}>
          <View style={{ gap: 8 }}>
            <View style={{ gap: 4, paddingHorizontal: 20, paddingTop: 28 }}>
              <Text2 weight="semibold" color="brand" style={[{ fontSize: 16 }]}>
                {titleLabel}
              </Text2>
              <Text2 weight="bold" size="2xl" style={[{ fontSize: 26 }]}>
                {title}
              </Text2>
            </View>
            <View style={{ padding: 20, gap: 32 }}>
              {bullets.map((bullet, index) => (
                <View style={[t.flexRow, { gap: 12 }]} key={index}>
                  {bullet.icon}
                  <View style={[t.flex1, { gap: 4 }]}>
                    <Text2 weight="semibold" lineHeight="sm" letterSpacing="lg">
                      {bullet.title}
                    </Text2>
                    <Text2 color="secondary">{bullet.description}</Text2>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={[{ gap: 12 }]}>
            <AnimatedPressable
              onPress={primaryActionOnPress}
              style={{ flex: 1, height: 48 }}
            >
              <View
                style={[
                  t.flex1,
                  t.backgrounds.brand,
                  { borderRadius: 32 },
                  t.justifyCenter,
                  t.itemsCenter,
                  { height: 48 },
                ]}
              >
                <Text2 size="lg" weight="semibold" color="light">
                  {primaryActionText}
                </Text2>
              </View>
            </AnimatedPressable>
            {secondaryActionText && (
              <AnimatedPressable onPress={secondaryActionOnPress}>
                <Text2 color="tertiary" align="center" weight="semibold">
                  {secondaryActionText}
                </Text2>
              </AnimatedPressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
