import { ApiUser } from 'farcaster-client-data';
import { LoadingIndicator, Text2 } from 'farcaster-expo';
import React, { useRef } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AutoDisplayingBottomSheetModal } from '~/components/BottomSheet/AutoDisplayingBottomSheetModal';
import { ChannelRemoteImage } from '~/components/ChannelsV3/ChannelRemoteImage';
import { AboutChannelStreakPromptContent } from '~/components/prompts/AboutChannelStreakPrompt';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';

type ChannelStreakBottomSheetUpdatedProps = {
  user: ApiUser;
  onDismiss: () => void;
};

export const ChannelStreakBottomSheetUpdated = ({
  user,
  onDismiss,
}: ChannelStreakBottomSheetUpdatedProps) => {
  const t = useTheme();

  const bottomSheetRef = useRef<{ dismiss: () => void }>(null);

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  return (
    <AutoDisplayingBottomSheetModal
      name="ChannelStreakBottomSheetUpdated"
      onDismiss={onDismiss}
      ref={bottomSheetRef}
    >
      <React.Suspense
        fallback={
          <View style={[t.wFull, t.itemsCenter, t.justifyCenter]}>
            <LoadingIndicator />
          </View>
        }
      >
        {user.fid === currentUserFid && (
          <AboutChannelStreakPromptContent fid={currentUserFid} />
        )}
        {user.fid === currentUserFid && typeof user.streak !== 'undefined' && (
          <View style={[t.itemsCenter, t.justifyCenter, t.flexRow, { gap: 4 }]}>
            <View style={[t.relative]}>
              <ChannelRemoteImage
                channelImageUrl={user.streak.channel.imageUrl}
                size="feed"
              />
              <Svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={[
                  t.absolute,
                  t.bottom0,
                  t.right0,
                  { marginBottom: -2, marginRight: -4 },
                ]}
              >
                <Path
                  d="M5.77443 0.98137L5.32607 1.20268L5.77443 0.981369C5.62893 0.686608 5.32872 0.5 5 0.5C4.67128 0.5 4.37107 0.686608 4.22557 0.981369L3.30269 2.85103L1.23874 3.15271C0.913529 3.20024 0.643488 3.42825 0.542116 3.74089L1.01774 3.89511L0.542116 3.74089C0.440745 4.05353 0.525617 4.39662 0.761059 4.62594L2.25383 6.07989L1.90153 8.13399C1.84595 8.45801 1.97916 8.78549 2.24515 8.97871C2.51113 9.17193 2.86374 9.19738 3.15471 9.04436L5 8.07394L6.84529 9.04436C7.13626 9.19738 7.48887 9.17193 7.75485 8.97871C8.02083 8.78549 8.15405 8.45801 8.09847 8.13399L7.74617 6.07989L9.23894 4.62594C9.47438 4.39662 9.55926 4.05354 9.45788 3.74089L8.98226 3.89511L9.45788 3.74089C9.35651 3.42825 9.08647 3.20024 8.76126 3.15271L6.69731 2.85103L5.77443 0.98137Z"
                  fill="#EAB305"
                  stroke="#FCF4DA"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <Text2
              color="secondary"
              size="sm"
              weight="semibold"
              style={[{ color: '#ECA220' }]}
            >
              {`${Math.max(1, user.streak.streakCount)}d`} streak
            </Text2>
          </View>
        )}
      </React.Suspense>
    </AutoDisplayingBottomSheetModal>
  );
};
