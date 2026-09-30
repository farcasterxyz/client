import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useUserByFid, useUserByUsername } from 'farcaster-client-hooks';
import React, { FC, memo, Suspense, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { TabView } from 'react-native-tab-view';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { buildTabBar } from '~/components/TabBar';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { FollowsScreenInitialTab, FullParamList } from '~/types';

import { Followers } from './Followers';
import { FollowersYouKnow } from './FollowersYouKnow';
import { Following } from './Following';

const scenes = {
  followersYouKnow: FollowersYouKnow,
  followers: Followers,
  following: Following,
};

type Route = {
  key: keyof typeof scenes;
  title: string;
};

const routes: Route[] = [
  { key: 'followersYouKnow', title: 'Followers you know' },
  { key: 'followers', title: 'Followers' },
  { key: 'following', title: 'Following' },
];

type FollowsScreenProps = NativeStackScreenProps<FullParamList, 'Follows'>;

const FollowsScreen = buildScreen<FollowsScreenProps>(
  { name: 'Follows', insetTop: false },
  ({ route: { params } }) => {
    if ('fid' in params) {
      return (
        <FollowsScreenWithoutUsername
          fid={params.fid}
          initialTab={params.initialTab}
        />
      );
    }

    return (
      <FollowsScreenForUsername
        username={params.username}
        initialTab={params.initialTab}
      />
    );
  },
);

type FollowsScreenWithoutUsernameProps = {
  fid: number;
  initialTab: FollowsScreenInitialTab;
};

const FollowsScreenWithoutUsername: FC<FollowsScreenWithoutUsernameProps> =
  memo(({ fid, initialTab }) => {
    const {
      result: {
        user: { username },
      },
    } = useUserByFid({ fid }).data!;
    return (
      <FollowsScreenContent
        fid={fid}
        initialTab={initialTab}
        username={username}
      />
    );
  });

type FollowsScreenForUsernameProps = {
  username: string;
  initialTab: FollowsScreenInitialTab;
};

const FollowsScreenForUsername: FC<FollowsScreenForUsernameProps> = memo(
  ({ username, initialTab }) => {
    const {
      result: {
        user: { fid },
      },
    } = useUserByUsername({ username }).data!;
    return (
      <FollowsScreenContent
        fid={fid}
        initialTab={initialTab}
        username={username}
      />
    );
  },
);

type FollowsScreenContentProps = {
  fid: number;
  username: string | undefined;
  initialTab: FollowsScreenInitialTab;
};

const FollowsScreenContent: FC<FollowsScreenContentProps> = memo(
  ({ fid, initialTab }) => {
    const t = useTheme();
    const { setParams } = useNavigation();
    const { fid: currentUserFid } = useCurrentUser_UNSAFE();

    const layout = useWindowDimensions();

    const filteredRoutes = React.useMemo(() => {
      return routes.filter(
        (route) => route.key !== 'followersYouKnow' || currentUserFid !== fid,
      );
    }, [currentUserFid, fid]);

    const resolveTabIndex = React.useCallback(
      (initialTab: undefined | keyof typeof scenes) => {
        const index = filteredRoutes.findIndex(
          (route) => route.key === initialTab,
        );
        return index === -1 ? 0 : index;
      },
      [filteredRoutes],
    );

    const [tabIndex, setTabIndex] = useState(resolveTabIndex(initialTab));

    useEffect(() => {
      if (initialTab) {
        setTabIndex(resolveTabIndex(initialTab));
        setParams({ initialTab: undefined });
      }
    }, [initialTab, resolveTabIndex, setParams]);

    return (
      <View style={[t.flexGrow]}>
        <TabView
          lazy={true}
          navigationState={{ index: tabIndex, routes: filteredRoutes }}
          renderScene={({ route }) => {
            const Scene = scenes[route.key];
            return (
              <Suspense
                fallback={
                  <FullScreenLoadingIndicator debugName="FollowsScreen" />
                }
              >
                <Scene fid={fid} />
              </Suspense>
            );
          }}
          onIndexChange={(index) => {
            setTabIndex(index);
          }}
          initialLayout={{ width: layout.width }}
          renderTabBar={buildTabBar()}
        />
      </View>
    );
  },
);

FollowsScreen.displayName = 'FollowsScreen';

export { FollowsScreen };
