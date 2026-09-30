import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useSetUserPreferences } from 'farcaster-client-hooks';
import { AnimatedPressable, Text2 } from 'farcaster-expo';
import { HandHeart, Timer } from 'lucide-react-native';
import * as React from 'react';
import { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Sparkle } from '~/components/CollectibleCast/Sparkle';
import { buildScreen } from '~/components/Screen';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { useReplace } from '~/hooks/navigation/useReplace';
import { CommonStackParamList } from '~/types';

type CollectibleCastIntroScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CollectibleCastIntro'
>;

export const CollectibleCastIntroScreen =
  buildScreen<CollectibleCastIntroScreenProps>(
    {
      name: 'CollectibleCastIntro',
      insetTop: true,
      insetBottom: false,
    },
    () => {
      const t = useTheme();
      const goBack = useGoBack();
      const setUserPreference = useSetUserPreferences();
      const insets = useSafeAreaInsets();

      const replace = useReplace();

      const handleContinue = useCallback(async () => {
        setUserPreference({
          preferences: {
            collectibleCastsSetting: 'on',
          },
        });
        goBack();
      }, [goBack, setUserPreference]);

      const goToSettings = useCallback(() => {
        replace('CollectibleCastsSettings', {});
      }, [replace]);

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
              source={require('./collectibleCastIntro.png')}
              style={{ width: '100%', height: 240 }}
              contentFit="contain"
            />
            <View style={[t.flex1, t.justifyBetween, { gap: 8 }]}>
              <View style={{ gap: 8 }}>
                <View style={{ gap: 4, paddingHorizontal: 20, paddingTop: 28 }}>
                  <Text2
                    weight="semibold"
                    style={[{ fontSize: 16 }]}
                    color="brand"
                  >
                    Introducing
                  </Text2>
                  <Text2 weight="bold" size="2xl" style={[{ fontSize: 26 }]}>
                    Collectible Casts
                  </Text2>
                </View>
                <View style={{ padding: 20, gap: 32 }}>
                  <View style={[t.flexRow, { gap: 12 }]}>
                    <HandHeart
                      color={t.colors.text.primary}
                      strokeWidth={1.5}
                    />
                    <View style={[t.flex1, { gap: 4 }]}>
                      <Text2
                        weight="semibold"
                        lineHeight="sm"
                        letterSpacing="lg"
                      >
                        Support your favorite creators
                      </Text2>
                      <Text2 color="secondary">
                        Collect their casts onchain starting at $1. Creators
                        earn every time you collect.
                      </Text2>
                    </View>
                  </View>
                  <View style={[t.flexRow, { gap: 12 }]}>
                    <Timer color={t.colors.text.primary} strokeWidth={1.5} />
                    <View style={[t.flex1, { gap: 4 }]}>
                      <Text2
                        weight="semibold"
                        lineHeight="sm"
                        letterSpacing="lg"
                      >
                        Collect unique Farcaster moments
                      </Text2>
                      <Text2 color="secondary">
                        Each cast can only be collected once.To collect it, you
                        must be the highest bidder.
                      </Text2>
                    </View>
                  </View>
                  <View style={[t.flexRow, { gap: 12 }]}>
                    <Sparkle color={t.colors.text.primary} strokeWidth={1.5} />
                    <View style={[t.flex1, { gap: 4 }]}>
                      <Text2
                        weight="semibold"
                        lineHeight="sm"
                        letterSpacing="lg"
                      >
                        Onchain forever
                      </Text2>
                      <Text2 color="secondary">
                        Collectibles are minted to your wallet as NFTs and live
                        forever on the blockchain.
                      </Text2>
                    </View>
                  </View>
                </View>
              </View>
              <View style={[{ gap: 12 }]}>
                <AnimatedPressable
                  onPress={handleContinue}
                  style={{ flex: 1, height: 48 }}
                >
                  <View
                    style={[
                      t.flex1,
                      t.bgActionPrimary,
                      { borderRadius: 32 },
                      t.justifyCenter,
                      t.itemsCenter,
                      { height: 48 },
                    ]}
                  >
                    <Text2 size="lg" weight="semibold" color="light">
                      Continue
                    </Text2>
                  </View>
                </AnimatedPressable>
                <AnimatedPressable onPress={goToSettings}>
                  <Text2 color="tertiary" align="center" weight="semibold">
                    Turn off collecting for your casts
                  </Text2>
                </AnimatedPressable>
              </View>
            </View>
          </ScrollView>
        </View>
      );
    },
  );
