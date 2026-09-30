import { Octicons } from '@expo/vector-icons';
import { useBottomSheetTimingConfigs } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { AnalyticsEvent } from 'farcaster-analytics';
import { resolveUsername } from 'farcaster-client-hooks';
import React from 'react';
import { TouchableOpacity, useWindowDimensions, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Avatar } from '~/components/Avatar';
import { Text } from '~/components/Text';
import { easing } from '~/constants/Animated';
import { userProfileQRCodePromptKey } from '~/constants/Storage';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useGlobalPrompts } from '~/contexts/GlobalPromptsProvider';
import { sizes, useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

import { Prompt } from './Prompt';

const UserProfileQRCodePrompt: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();

  const { activePromptKey, hideGlobalPrompt } = useGlobalPrompts();

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing,
  });

  const shouldPresent = React.useCallback(() => {
    return activePromptKey === userProfileQRCodePromptKey;
  }, [activePromptKey]);

  React.useEffect(() => {
    if (activePromptKey === userProfileQRCodePromptKey) {
      trackEvent(AnalyticsEvent.ShowUserProfileQRCodePrompt, undefined);
    }
  }, [activePromptKey, trackEvent]);

  return (
    <Prompt
      shouldPresent={shouldPresent}
      height={'60%'}
      storageKey={userProfileQRCodePromptKey}
      enableTouchThrough={false}
      onBackdropPress={hideGlobalPrompt}
      onCloseCallback={hideGlobalPrompt}
      animationConfigs={animationConfigs}
    >
      <UserProfileQRCodePromptContent />
    </Prompt>
  );
});

UserProfileQRCodePrompt.displayName = 'UserProfileQRCodePrompt';

const UserProfileQRCodePromptContent: React.FC = () => {
  const user = useCurrentUser_UNSAFE();

  const t = useTheme();

  const { width: windowWidth } = useWindowDimensions();

  const [copiedTarget, setCopiedTarget] = React.useState<boolean>(false);

  const currentUserProfileUrl = React.useMemo(() => {
    return user.username
      ? `https://farcaster.xyz/${user.username}`
      : `https://farcaster.xyz/~/profiles/${user.fid}`;
  }, [user.fid, user.username]);

  const copyTargetToClipboard = React.useCallback(() => {
    Clipboard.setStringAsync(currentUserProfileUrl);
    setCopiedTarget(true);

    setTimeout(() => {
      setCopiedTarget(false);
    }, 2000);
  }, [currentUserProfileUrl]);

  return (
    <View style={[t.hFull, t.justifyBetween, t.p4, t.pB8]}>
      <View
        style={[t.relative, t.flex1, t.itemsCenter, t.justifyCenter, t.wFull]}
      >
        <View
          style={[t.flex, t.flexRow, t.justifyCenter, t.itemsCenter, t.wFull]}
        >
          <Avatar pfpUrl={user.pfp?.url} diameter={40} />
          <View style={[t.pX2]}>
            <Text
              style={[t.textBase, t.texts.primary, t.fontBold]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user.displayName}
            </Text>
            <Text style={[t.textBase, t.texts.secondary]}>
              {resolveUsername({ username: user.username, fid: user.fid })}
            </Text>
          </View>
        </View>
        <View style={[t.mY8]}>
          <QRCode
            backgroundColor={'#ffffff'}
            color={'#000000'}
            ecl="H"
            // Instead of directly targeting the apps, we will hop from our servers to guarantee Android
            // devices handle the linking properly as well.
            value={currentUserProfileUrl}
            size={windowWidth - sizes.s40}
          />
        </View>

        <View style={[t.flex, t.flexCol]}>
          <TouchableOpacity
            style={[
              t.flex,
              t.flexRow,
              t.itemsCenter,
              t.justifyCenter,
              t.mB2,
              t.pX4,
              t.pY2,
              { borderRadius: 24 },
            ]}
            onPress={copyTargetToClipboard}
          >
            {!copiedTarget && (
              <Octicons name="copy" size={16} style={[t.texts.brand, t.mR2]} />
            )}
            <Text style={[t.texts.brand, t.textSm]}>
              {copiedTarget ? 'Copied!' : 'Copy profile link'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export { UserProfileQRCodePrompt };
