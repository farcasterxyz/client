import React, { FC, memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button } from '~/components/Button';
import { CircleProgressIndicator } from '~/components/CircleProgressIndicator';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useUserAppContext } from '~/contexts/UserAppContextProvider';
import { useGloballyCachedCurrentUser } from '~/hooks/data/useGloballyCachedCurrentUser';

interface NewUserFollowsBannerProps {
  onRefreshFeed: () => Promise<void>;
}

const NewUserFollowsBanner: FC<NewUserFollowsBannerProps> = memo(
  ({ onRefreshFeed }) => {
    const { newUserStatus } = useUserAppContext();
    const currentUser = useGloballyCachedCurrentUser();

    if (
      newUserStatus?.showFollowsBanner !== true ||
      newUserStatus?.targetFollowingCount === undefined ||
      !currentUser
    ) {
      return null;
    }

    return (
      <NewUserFollowsBannerContent
        onRefreshFeed={onRefreshFeed}
        targetFollowingCount={newUserStatus.targetFollowingCount}
        followingCount={currentUser.followingCount}
      />
    );
  },
);

interface NewUserFollowsBannerContentProps {
  onRefreshFeed: () => Promise<void>;
  targetFollowingCount: number;
  followingCount: number;
}

const NewUserFollowsBannerContent: FC<NewUserFollowsBannerContentProps> = memo(
  ({ onRefreshFeed, targetFollowingCount, followingCount }) => {
    const t = useTheme();

    const remainingFollows = useMemo(
      () => Math.max(0, targetFollowingCount - followingCount),
      [followingCount, targetFollowingCount],
    );

    const done = useMemo(() => remainingFollows === 0, [remainingFollows]);

    const message = useMemo(() => {
      if (remainingFollows > 1) {
        return `Follow ${remainingFollows} more users to improve your feed`;
      } else if (remainingFollows === 1) {
        return `Follow 1 more user to improve your feed`;
      }

      return `Your improved feed is ready!`;
    }, [remainingFollows]);

    return (
      <View style={[t.borderDefault, t.borderTHairline, t.p2]}>
        <View
          style={[
            t.roundedLg,
            t.flex,
            t.flexRow,
            t.itemsCenter,
            t.pX3,
            {
              backgroundColor: t.dark ? '#342B3E' : '#F5F5F5',
              paddingVertical: 10,
            },
          ]}
        >
          {/* SVG has weird dimensions so wrapping in a fixed container to avoid shifts */}
          <View
            style={[
              t.flex,
              t.itemsCenter,
              t.justifyCenter,
              { width: 26, height: 26 },
            ]}
          >
            {done ? (
              <Svg width="24" height="26" viewBox="0 0 24 26" fill="none">
                <Circle
                  cx="12"
                  cy="12.9238"
                  r="12"
                  fill={t.colors.text.brand}
                />
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M17.2678 9.26095C17.4386 9.43181 17.4386 9.70882 17.2678 9.87967L10.5594 16.588C10.4762 16.6712 10.3629 16.7174 10.2452 16.7161C10.1275 16.7148 10.0153 16.6661 9.93393 16.5811L6.72559 13.2269C6.55858 13.0523 6.56473 12.7753 6.73934 12.6083C6.91395 12.4413 7.19089 12.4475 7.3579 12.6221L10.257 15.653L16.6491 9.26095C16.8199 9.0901 17.0969 9.0901 17.2678 9.26095Z"
                  fill="white"
                />
              </Svg>
            ) : (
              <CircleProgressIndicator
                progress={followingCount / targetFollowingCount}
                stroke={t.colors.text.brand}
                strokeAlternate={t.dark ? '#443C4E' : '#E7E8EB'}
                backgroundColor="transparent"
                strokeWidth={5}
                outerRadius={12}
                startSide="top"
              />
            )}
          </View>
          <Text style={[t.texts.primary, t.flex1, t.mL2]}>{message}</Text>
          {done && (
            <Button
              title="View feed"
              size="xs"
              variant="muted"
              fontWeight="normal"
              style={[
                t.roundedLg,
                t.mL2,
                t.border,
                t.dark ? t.borderWhite : t.borderBlack,
                t.pX2,
              ]}
              onPress={onRefreshFeed}
            />
          )}
        </View>
      </View>
    );
  },
);

NewUserFollowsBanner.displayName = 'NewUserFollowsBanner';

export { NewUserFollowsBanner };
