import { Octicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiCast, ApiStarterPack, ApiUser } from 'farcaster-client-data';
import {
  resolveUsernameShort,
  useFollowAllStarterPackUsers,
  useStarterPack,
  useStarterPackFeed,
  useStarterPackUsers,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React, { ReactElement } from 'react';
import {
  ColorValue,
  GestureResponderEvent,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { Tabs } from 'react-native-collapsible-tab-view';

import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { Cast } from '~/components/casts/Cast';
import { buildCollapsibleTabBar } from '~/components/CollapsibleTab/CollapsibleTabBar';
import { FarcasterProBadge } from '~/components/FarcasterPro/FarcasterProBadge';
import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { Icon } from '~/components/StarterPacks/Icon';
import { NewStarterPackModal } from '~/components/StarterPacks/NewStarterPackModal';
import { StarterPackActionsModal } from '~/components/StarterPacks/StarterPackActionsModal';
import { Text2 } from '~/components/Text';
import { User } from '~/components/users';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useUserLevel } from '~/hooks/data/useUserLevel';
import { usePushToUserProfile } from '~/hooks/navigation/usePushToUserProfile';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useLinkifyText } from '~/hooks/useLinkifyText';
import { CommonStackParamList } from '~/types';
import { shareUrl } from '~/utils/SharingUtils';

type StarterPackScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'StarterPack'
>;

function HeaderIconButton({
  Icon,
  onPress,
}: {
  Icon: (props: { size: number; color: ColorValue }) => ReactElement;
  onPress: (event: GestureResponderEvent) => void;
}) {
  const t = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={[
        t.itemsCenter,
        t.justifyCenter,
        t.roundedFull,
        t.borderDefault,
        t.borderHairline,
        t.roundedFull,
        {
          height: 34,
          width: 34,
        },
      ]}
    >
      {Icon({ color: t.colors.text.primary, size: 16 })}
    </Pressable>
  );
}

const FlatList = Tabs.FlashList;

const StarterPackScreen = buildScreen<StarterPackScreenProps>(
  { name: 'StarterPack' },
  ({
    route: {
      params: { starterPackId: encodedStarterPackId, newlyCreatedStarterPack },
    },
  }) => {
    const t = useTheme();

    const { trackEvent } = useAnalytics();

    const starterPackId = decodeURI(encodedStarterPackId);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewStarterPack, {
          starterPackId,
        });
      }, [starterPackId, trackEvent]),
    );

    return (
      <View style={[t.hFull, t.wFull]}>
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <StarterPackTabbed
            starterPackId={starterPackId}
            newlyCreatedStarterPack={newlyCreatedStarterPack || false}
          />
        </React.Suspense>
      </View>
    );
  },
);

function StarterPackHeader({ starterPack }: { starterPack: ApiStarterPack }) {
  const t = useTheme();

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const followAllStarterPackUsers = useFollowAllStarterPackUsers();

  const navigation = useNavigation();
  const pushToUserProfile = usePushToUserProfile();

  const { trackEvent } = useAnalytics();

  const onSharePress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressShareStarterPack, {
      via: 'starter pack header',
      starterPackName: starterPack.name,
    });

    shareUrl({
      title: starterPack.name,
      url: `https://farcaster.xyz/${starterPack.creator.username}/pack/${starterPack.id}`,
    });
  }, [
    starterPack.creator.username,
    starterPack.id,
    starterPack.name,
    trackEvent,
  ]);

  const [showMenuModal, setShowMenuModal] = React.useState<boolean>(false);

  const onMenuPress = React.useCallback(() => {
    if (starterPack.creator.fid === currentUserFid) {
      setShowMenuModal(true);
    }
  }, [currentUserFid, starterPack.creator.fid]);

  const headerRight = React.useMemo(() => {
    return (
      <View style={[t.flex, t.flexRow, { gap: 12 }]}>
        <HeaderIconButton
          Icon={({ color, size }) => (
            <Octicons name="share" size={size} color={color} />
          )}
          onPress={onSharePress}
        />
        {starterPack.creator.fid === currentUserFid && (
          <HeaderIconButton
            Icon={({ color, size }) => (
              <Octicons name="kebab-horizontal" size={size} color={color} />
            )}
            onPress={onMenuPress}
          />
        )}
      </View>
    );
  }, [
    currentUserFid,
    onMenuPress,
    onSharePress,
    starterPack.creator.fid,
    t.flex,
    t.flexRow,
  ]);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => headerRight,
    });
  }, [navigation, headerRight]);

  const toast = useRootToast();

  const onFollowAllPress = React.useCallback(() => {
    trackEvent(AnalyticsEvent.PressFollowAllStarterPack, {
      starterPackId: starterPack.id,
      starterPackName: starterPack.name,
    });

    followAllStarterPackUsers({ id: starterPack.id });

    toast.show('Followed all! 🎉', {
      type: 'generic',
      duration: 3000,
      placement: 'bottom',
    });
  }, [
    followAllStarterPackUsers,
    starterPack.id,
    starterPack.name,
    toast,
    trackEvent,
  ]);

  const linkifiedStarterPackDescription = useLinkifyText({
    text: starterPack.description,
    mentions: [],
  });

  const isProUser = useUserLevel(starterPack.creator) === 'pro';

  return (
    <View style={[t.flex, t.flexCol, { gap: 12 }, t.pY4]}>
      <View style={[t.flex, t.flexRow, t.mX4, t.itemsStart]}>
        <View
          style={[
            t.flex,
            t.itemsCenter,
            t.justifyCenter,
            t.mR3,
            t.roundedLg,
            {
              backgroundColor: t.colors.bgHover,
              width: 56,
              height: 56,
            },
          ]}
        >
          <Icon color={t.colors.text.primary} size={32} />
        </View>
        <View style={[t.flex1, t.flexCol, { gap: 4 }]}>
          <Text2 size="xl" weight="semibold" color="primary" numberOfLines={2}>
            {starterPack.name}
          </Text2>
          <View style={[t.flex, t.flexRow, t.itemsCenter]}>
            <Text2 size="sm" weight="medium" color="secondary">
              by{' '}
            </Text2>
            <TouchableOpacity
              style={[t.flex, t.flexRow, t.itemsCenter]}
              onPress={() => {
                pushToUserProfile({
                  fid: starterPack.creator.fid,
                });
              }}
            >
              <Avatar pfpUrl={starterPack.creator.pfp?.url} diameter={16} />
              <Text2 size="sm" weight="medium" color="secondary">
                {' '}
                {resolveUsernameShort({
                  username: starterPack.creator.username,
                  fid: starterPack.creator.fid,
                })}
              </Text2>
              {isProUser && <FarcasterProBadge size={18} style={[t.mL1]} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text2 size="base" weight="regular" color="primary" style={[t.mX4]}>
        {linkifiedStarterPackDescription.linkifiedText}
      </Text2>
      <View style={[t.flex, t.flexRow, t.itemsCenter, t.mX4, { gap: 8 }]}>
        <ButtonV2
          width="flex1"
          height="sm"
          title="Follow all"
          onPress={onFollowAllPress}
        />
      </View>
      {showMenuModal && (
        <StarterPackActionsModal
          onDismiss={() => setShowMenuModal(false)}
          starterPack={starterPack}
        />
      )}
    </View>
  );
}

function StarterPackUsers({ starterPackId }: { starterPackId: string }) {
  const t = useTheme();

  const {
    data: starterPackUsersData,
    fetchNextPage,
    isLoading,
  } = useStarterPackUsers({
    id: starterPackId,
  });

  const extraData = useCommonFlatListExtraData();

  const handleEndReached = React.useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const starterPackUsers = React.useMemo(() => {
    return (
      starterPackUsersData?.pages.flatMap((page) => page.result.users) || []
    );
  }, [starterPackUsersData?.pages]);

  return (
    <>
      <FlatList
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{}}
        data={starterPackUsers}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListFooterComponent={
          isLoading ? (
            <LoadingIndicator size="small" style={[t.mT4]} />
          ) : undefined
        }
      />
    </>
  );
}

function keyExtractor(item: ApiUser) {
  return item.fid.toString();
}

function renderItem({ item }: { item: ApiUser }) {
  return <User user={item} hideBio={false} hideFollowsYou={true} />;
}

function StarterPackCasts({ starterPackId }: { starterPackId: string }) {
  const { trackEvent } = useAnalytics();

  const t = useTheme();

  const {
    data: starterPackFeedData,
    fetchNextPage: starterPackFeedFetchNextPage,
    isLoading: starterPackFeedIsLoading,
  } = useStarterPackFeed({
    id: starterPackId,
  });

  const starterPackFeed = React.useMemo(() => {
    return (
      starterPackFeedData?.pages.flatMap((page) => page.result.casts) || []
    );
  }, [starterPackFeedData?.pages]);

  const extraData = useCommonFlatListExtraData();

  const handleEndReached = React.useCallback(() => {
    starterPackFeedFetchNextPage();
  }, [starterPackFeedFetchNextPage]);

  React.useEffect(() => {
    trackEvent(AnalyticsEvent.ViewStarterPackCasts, { starterPackId });
  }, [starterPackId, trackEvent]);

  return (
    <>
      <FlatList
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{}}
        data={starterPackFeed}
        extraData={extraData}
        renderItem={renderCastItem}
        keyExtractor={castKeyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListFooterComponent={
          starterPackFeedIsLoading ? (
            <LoadingIndicator size="small" style={[t.mT4]} />
          ) : undefined
        }
      />
    </>
  );
}

function castKeyExtractor(item: ApiCast) {
  return item.hash;
}

function renderCastItem({ item }: { item: ApiCast }) {
  return <Cast cast={item} />;
}

const TabBar = buildCollapsibleTabBar({
  tabStyle: {
    flex: 1,
    paddingBottom: 12,
  },
});

type Route = {
  key: string;
  name: string;
  Scene: React.FC<{ starterPackId: string }>;
};

const routes: Route[] = [
  { key: 'users', name: 'Users', Scene: StarterPackUsers },
  { key: 'casts', name: 'Casts', Scene: StarterPackCasts },
];

function StarterPackTabbed({
  starterPackId,
  newlyCreatedStarterPack,
}: {
  starterPackId: string;
  newlyCreatedStarterPack: boolean;
}) {
  const t = useTheme();

  const [, setTabIndex] = React.useState<number>(0);

  const [showStarterPackModal, setShowStarterPackModal] = React.useState<
    ApiStarterPack | undefined
  >(undefined);

  const { data } = useStarterPack({ id: starterPackId });

  const starterPack = React.useMemo(() => {
    return data.starterPack;
  }, [data.starterPack]);

  const renderHeader = React.useCallback(() => {
    return <StarterPackHeader starterPack={starterPack} />;
  }, [starterPack]);

  React.useEffect(() => {
    if (newlyCreatedStarterPack) {
      setShowStarterPackModal(starterPack);
    }
  }, [newlyCreatedStarterPack, starterPack]);

  return (
    <>
      <Tabs.Container
        lazy={true}
        initialTabName={routes[0].name}
        onIndexChange={setTabIndex}
        containerStyle={[t.bgDefault]}
        headerContainerStyle={[
          t.bgDefault,
          {
            shadowRadius: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0,
          },
        ]}
        renderHeader={renderHeader}
        renderTabBar={TabBar}
        snapThreshold={0.5}
      >
        {routes.map(({ key, Scene, name }) => {
          return (
            <Tabs.Tab name={name} key={key}>
              <Scene starterPackId={starterPackId} />
            </Tabs.Tab>
          );
        })}
      </Tabs.Container>
      {typeof showStarterPackModal !== 'undefined' && (
        <NewStarterPackModal
          starterPack={showStarterPackModal}
          onDismiss={() => setShowStarterPackModal(undefined)}
        />
      )}
    </>
  );
}

StarterPackScreen.displayName = 'StarterPackScreen';

export { StarterPackScreen };
