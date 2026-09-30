import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast } from 'farcaster-client-data';
import { resolveUsername } from 'farcaster-client-hooks';
import { TypographyBody } from 'farcaster-expo';
import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PressableGradient } from '~/components/FloatingSearch/PressableGradient';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastQueue } from '~/contexts/CastQueueProvider';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useMinimizedMiniApp } from '~/contexts/MinimizedMiniAppProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';

type CastScreenQuickReplyProps = {
  cast: ApiCast;
};

const CastScreenQuickReply: React.FC<CastScreenQuickReplyProps> = React.memo(
  ({ cast }) => {
    const t = useTheme();
    const openComposer = useOpenComposer();
    const { trackEvent } = useAnalytics();
    const { triggerImpactAsync } = useHaptics();
    const { hasActivelyQueuedCasts } = useCastQueue();
    const { minimizedMiniApp } = useMinimizedMiniApp();

    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    const label = React.useMemo(() => {
      return `Reply to ${resolveUsername({
        username: cast.author.username,
        fid: cast.author.fid,
      })}`;
    }, [cast.author.fid, cast.author.username]);

    return (
      <View
        style={[
          t.wFull,
          t.flex,
          t.flexRow,
          t.justifyCenter,
          (minimizedMiniApp || hasActivelyQueuedCasts) && [t.mB3],
        ]}
      >
        <Animated.View
          style={[
            t.mX2,
            t.mT2,
            t.flexGrow,
            t.texts.primary,
            t.textBase,
            t.roundedFull,
            t.relative,
            animatedStyle,
          ]}
          onTouchStart={() => {
            scale.value = withSpring(0.975);
          }}
          onTouchEnd={() => {
            scale.value = withSpring(1);
          }}
        >
          {t.dark && <PressableGradient />}
          <Pressable
            style={[
              t.inset0,
              t.p2,
              t.wFull,
              t.textLeft,
              { height: 56, borderRadius: 100, paddingLeft: 18 },
              t.justifyCenter,
              t.border,
              t.borders.secondary,
            ]}
            onPress={() => {
              triggerImpactAsync();

              trackEvent(AnalyticsEvent.PressThreadQuickReply, {});

              const { intent } = createCastParamsWithIntent({
                parentCastHash: cast.hash,
              });

              openComposer({ intent });
            }}
          >
            <TypographyBody label="Medium" color="tertiary">
              {label}
            </TypographyBody>
          </Pressable>
        </Animated.View>
      </View>
    );
  },
);

export { CastScreenQuickReply };
