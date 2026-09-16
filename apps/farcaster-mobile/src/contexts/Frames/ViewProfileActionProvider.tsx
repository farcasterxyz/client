import { LinearGradient } from 'expo-linear-gradient';
import {
  formatShorthandNumber,
  resolveUsernameShort,
  useFollowersYouKnow,
  useUser,
} from 'farcaster-client-hooks';
import React, { Suspense, useCallback, useState } from 'react';
import { Animated, View } from 'react-native';

import { Avatar } from '~/components/Avatar';
import {
  BottomSheetContentContainer,
  BottomSheetModal,
  useBottomSheetModalRef,
} from '~/components/BottomSheet';
import { FollowersYouKnowContent } from '~/components/headers/FollowersYouKnowContent';
import { Text2 } from '~/components/Text';
import { FollowButton } from '~/components/users/FollowButton';
import { useTheme } from '~/contexts/ThemeProvider';

type ViewProfileOptions = {
  fid: number;
  onToggle?: (action: 'follow' | 'unfollow') => void;
};

type ViewProfileActionState = ViewProfileOptions;

export type ViewProfileActionContextValue = {
  viewProfile: (params: ViewProfileOptions) => Promise<void>;
  closeProfile: () => void;
};

const ViewProfileActionContext =
  React.createContext<ViewProfileActionContextValue>({
    viewProfile: async () => {
      throw new Error('Must be called in ViewProfileActionContext provider');
    },
    closeProfile: () => {
      throw new Error('Must be called in ViewProfileActionContext provider');
    },
  });

type ViewProfileActionProviderProps = {
  children: React.ReactNode;
};

export const useViewProfileAction = () =>
  React.useContext(ViewProfileActionContext);

export const ViewProfileActionProvider: React.FC<ViewProfileActionProviderProps> =
  React.memo(({ children }) => {
    const [params, setParams] = useState<ViewProfileActionState | null>(null);
    const modalRef = useBottomSheetModalRef();
    const viewProfile = useCallback(
      async (params: ViewProfileOptions) => {
        setParams(params);
        modalRef.current?.present();
      },
      [modalRef],
    );

    const closeProfile = useCallback(() => {
      setParams(null);
      modalRef.current?.dismiss();
    }, [modalRef]);

    return (
      <ViewProfileActionContext.Provider value={{ viewProfile, closeProfile }}>
        {children}

        <BottomSheetModal name="ViewProfileAction" ref={modalRef}>
          <Suspense fallback={<ViewProfileBottomSheetSuspenseFallback />}>
            {!!params && (
              <ViewProfileBottomSheet
                fid={params.fid}
                onToggle={params.onToggle}
              />
            )}
          </Suspense>
        </BottomSheetModal>
      </ViewProfileActionContext.Provider>
    );
  });

function AvatarPlaceholder({ diameter }: { diameter: number }) {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.bgMuted, t.colors.bgFaint]}
      style={[{ width: diameter, height: diameter }, t.roundedFull]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

function TitlePlaceholder() {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.bgMuted, t.colors.bgFaint]}
      style={[{ width: '60%', height: 28 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

function SubPlaceholder() {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.bgMuted, t.colors.bgFaint]}
      style={[{ width: '80%', height: 18 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

function ButtonPlaceholder() {
  const t = useTheme();

  return (
    <LinearGradient
      colors={[t.colors.bgMuted, t.colors.bgFaint]}
      style={[{ width: '100%', height: 48 }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
}

function ViewProfileBottomSheetSuspenseFallback() {
  const t = useTheme();

  return (
    <BottomSheetContentContainer>
      <View
        style={[
          t.flexCol,
          t.itemsCenter,
          t.justifyCenter,
          t.wFull,
          { gap: 10 },
        ]}
      >
        <AvatarPlaceholder diameter={72} />
        <TitlePlaceholder />
        <SubPlaceholder />
        <View style={[{ height: 80 }]} />
        <ButtonPlaceholder />
      </View>
    </BottomSheetContentContainer>
  );
}

function ViewProfileBottomSheet({
  fid,
  onToggle,
}: {
  fid: number;
  onToggle?: (action: 'follow' | 'unfollow') => void;
}) {
  const t = useTheme();
  const { data: userData } = useUser({ fid });
  const { data: followData } = useFollowersYouKnow({ fid, limit: 3 });

  const user = userData.result.user;

  const users = React.useMemo(() => {
    return followData!.pages.flatMap((page) => page.result.users);
  }, [followData]);

  const totalCount = React.useMemo(() => {
    return followData!.pages[0].result.totalCount;
  }, [followData]);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300, // Duration of the fade-in animation
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <BottomSheetContentContainer>
      <Animated.View
        style={[
          t.flexCol,
          t.itemsCenter,
          t.justifyCenter,
          { gap: 10, opacity: fadeAnim },
        ]}
      >
        <Avatar pfpUrl={user.pfp?.url} diameter={72} shouldFadeIn={false} />
        <View style={[t.flexCol, t.itemsCenter, t.justifyCenter, { gap: 8 }]}>
          <Text2 weight="semibold" size="2xl">
            {resolveUsernameShort(user)}
          </Text2>
          <View style={[t.flexRow, { gap: 8 }]}>
            {user.followerCount !== undefined && (
              <Text2>
                <Text2 size="sm" color="secondary" weight="semibold">
                  {formatShorthandNumber(user.followerCount)}
                </Text2>{' '}
                <Text2 size="sm" color="secondary">
                  follower{user.followerCount !== 1 && 's'}
                </Text2>
              </Text2>
            )}
            {user.followingCount !== undefined && (
              <Text2>
                <Text2 size="sm" color="secondary" weight="semibold">
                  {formatShorthandNumber(user.followingCount)}
                </Text2>{' '}
                <Text2 size="sm" color="secondary">
                  following
                </Text2>
              </Text2>
            )}
          </View>
          <Text2 color="secondary" align="center" numberOfLines={2}>
            {user.profile.bio.text.replace(/\n/g, ' ')}
          </Text2>
          {users && (
            <FollowersYouKnowContent
              users={users}
              totalCount={totalCount}
              condensed
              size="sm"
            />
          )}
        </View>
        <View style={[t.wFull, t.mT3]}>
          <FollowButton
            size="normal"
            targetUser={user}
            presentation="standalone"
            onToggle={onToggle}
          />
        </View>
      </Animated.View>
    </BottomSheetContentContainer>
  );
}
