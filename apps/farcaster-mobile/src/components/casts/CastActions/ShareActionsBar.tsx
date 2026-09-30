import { Octicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { CastClickType, useTrackCastClick } from 'farcaster-client-hooks';
import React from 'react';
import { View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { AnimatedPressableCircle } from '~/components/Animated/AnimatedPressable';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { shareUrl } from '~/utils/SharingUtils';

interface ShareActionsBarProps {
  castURL: string;
  copiedCastURL: boolean;
  onCopyCastURL: () => void;
  onShowImageShare: () => void;
  castAuthorUsername: string;
  feed?: string;
  onShareComplete?: () => void;
}

type ShareActionButtonProps = {
  iconName: React.ComponentProps<typeof Octicons>['name'];
  label: string;
  onPress: () => void;
};

const ShareActionButton: React.FC<ShareActionButtonProps> = ({
  iconName,
  label,
  onPress,
}) => {
  const t = useTheme();

  return (
    <View style={[t.itemsCenter, t.justifyCenter, t.flex, t.flexCol, t.h21]}>
      <AnimatedPressableCircle background="muted" onPress={onPress}>
        <Octicons
          pointerEvents="none"
          name={iconName}
          size={20}
          style={[{ color: t.colors.text.primary }]}
        />
      </AnimatedPressableCircle>
      <Text style={[{ fontSize: 12 }, t.texts.primary, t.mT1]}>{label}</Text>
    </View>
  );
};

const ShareActionsBar: React.FC<ShareActionsBarProps> = ({
  castURL,
  copiedCastURL,
  onCopyCastURL,
  onShowImageShare,
  castAuthorUsername,
  feed,
  onShareComplete,
}) => {
  const toast = useToast();
  const { triggerImpactAsync } = useHaptics();
  const { trackEvent } = useAnalytics();
  const trackCastClick = useTrackCastClick();

  return (
    <>
      <ShareActionButton
        iconName={copiedCastURL ? 'check' : 'link'}
        label={copiedCastURL ? 'Copied!' : 'Copy link'}
        onPress={() => {
          triggerImpactAsync();

          trackEvent(AnalyticsEvent.ShareCastCopy, {});
          trackCastClick({ type: CastClickType.ShareLink, feed });

          Clipboard.setStringAsync(castURL);
          onCopyCastURL();

          toast.show('Link copied to clipboard', {
            duration: 3000,
            placement: 'bottom',
          });

          onShareComplete?.();
        }}
      />
      <ShareActionButton
        iconName="share"
        label="Share to"
        onPress={() => {
          triggerImpactAsync();

          trackEvent(AnalyticsEvent.ShareCastLink, {});
          trackCastClick({ type: CastClickType.ShareNative, feed });

          shareUrl({
            title: `Cast by ${castAuthorUsername}`,
            url: castURL,
          })
            .then((result) => {
              if (result.action === 'sharedAction') {
                trackCastClick({ type: CastClickType.ShareNative });
              }
            })
            .finally(() => {
              onShareComplete?.();
            });
        }}
      />
      <ShareActionButton
        iconName="image"
        label="Share image"
        onPress={() => {
          triggerImpactAsync();

          trackEvent(AnalyticsEvent.ShareCastImage, {});
          trackCastClick({ type: CastClickType.ShareImage, feed });

          onShowImageShare();
        }}
      />
    </>
  );
};

export { ShareActionButton, ShareActionsBar };
