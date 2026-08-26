import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ApiCast } from 'farcaster-client-data';
import { AnimatedPressable } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ShareActionsBar } from '~/components/casts/CastActions/ShareActionsBar';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';

interface ShareCastBottomActionsProps {
  cast: ApiCast;
  castURL: string;
  selectedTargets: (string | number)[];
  directCastMessage: string | undefined;
  copiedCastURL: boolean;
  onSendPress: () => void;
  onDirectCastMessageChange: (text: string | undefined) => void;
  onCopyCastURL: () => void;
  onShowImageShare: () => void;
  onShareComplete?: () => void;
  handleOnBlur: () => void;
  handleOnFocus: () => void;
}

const ShareCastBottomActions: React.FC<ShareCastBottomActionsProps> =
  React.memo(
    ({
      cast,
      castURL,
      selectedTargets,
      directCastMessage,
      copiedCastURL,
      onSendPress,
      onDirectCastMessageChange,
      onCopyCastURL,
      onShowImageShare,
      onShareComplete,
      handleOnBlur,
      handleOnFocus,
    }) => {
      const t = useTheme();

      if (selectedTargets.length !== 0) {
        return (
          <Animated.View
            style={[t.wFull, t.flex1, t.flexShrink0, t.pX4, t.mT4, { gap: 12 }]}
            entering={FadeIn.duration(150)}
          >
            <BottomSheetTextInput
              autoFocus={true}
              clearButtonMode="never"
              onChangeText={(text) =>
                onDirectCastMessageChange(text || undefined)
              }
              placeholder="Add a message..."
              placeholderTextColor={t.colors.text.tertiary}
              autoCorrect={true}
              value={directCastMessage}
              onBlur={handleOnBlur}
              onFocus={handleOnFocus}
              selectionColor={t.colors.selection}
              style={[
                {
                  height: 42,
                },
                t.texts.primary,
                t.textBase,
                t.pY2,
                t.textLeft,
                t.pX4,
                t.rounded,
                t.borderHairline,
                t.borders.primary,
                { borderRadius: 12 },
              ]}
            />
            <AnimatedPressable onPress={onSendPress}>
              <View
                style={[
                  t.bgAction,
                  t.roundedLg,
                  t.flex,
                  t.flexRow,
                  t.justifyCenter,
                  t.itemsCenter,
                  t.borderHairline,
                  t.borderDefault,
                  t.fontSemibold,
                  t.flex1,
                  t.wFull,
                  t.h12,
                  { minHeight: 48, borderRadius: 16 },
                ]}
              >
                <Text style={[t.texts.light, t.textBase, t.fontSemibold]}>
                  {selectedTargets.length === 1 ? 'Send' : 'Send separately'}
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        );
      }

      return (
        <Animated.View
          style={[
            t.wFull,
            t.flex1,
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX6,
            t.pY4,
          ]}
          entering={FadeIn.duration(150)}
        >
          <ShareActionsBar
            castURL={castURL}
            copiedCastURL={copiedCastURL}
            onCopyCastURL={onCopyCastURL}
            onShowImageShare={onShowImageShare}
            onShareComplete={onShareComplete}
            castAuthorUsername={cast.author.username || ''}
          />
        </Animated.View>
      );
    },
  );

ShareCastBottomActions.displayName = 'ShareCastBottomActions';

export { ShareCastBottomActions };
