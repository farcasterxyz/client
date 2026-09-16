import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiCastFeedIncludeReason,
  ApiUser,
  ApiUserProfile,
} from 'farcaster-client-data';
import {
  FeedSourceOn,
  useNonSuspenseUserByFid,
  useNonSuspenseUserByUsername,
} from 'farcaster-client-hooks';
import React, { FC, memo } from 'react';

import { FullScreenLoadingIndicator } from '~/components/FullScreenLoadingIndicator';
import { RetryableErrorBoundary } from '~/components/RetryableErrorBoundary';
import { buildScreen } from '~/components/Screen';
import { UserProfileWithBanner } from '~/components/UserProfileWithBanner/UserProfileWithBanner';
import { HomeStackParamList, UserScreenInitialTab } from '~/types';

type DeeplinkedUserScreenProps = NativeStackScreenProps<
  HomeStackParamList,
  'DeeplinkOnlyUserV2'
>;

const DeeplinkedUserScreen = buildScreen<DeeplinkedUserScreenProps>(
  { name: 'UserV2', insetTop: false },
  ({ route: { params } }) => {
    return (
      <RetryableErrorBoundary>
        <UserScreenWithUsername
          username={params.username}
          initialTab={undefined}
          profileOpenCastHash={params.profileOpenCastHash}
          sourceOn={params.sourceOn}
        />
      </RetryableErrorBoundary>
    );
  },
);

DeeplinkedUserScreen.displayName = 'DeeplinkedUserScreen';

type UserScreenProps = NativeStackScreenProps<HomeStackParamList, 'UserV2'>;

const UserScreen = buildScreen<UserScreenProps>(
  { name: 'UserV2', insetTop: false },
  ({ route: { params } }) => {
    return (
      <RetryableErrorBoundary>
        <UserScreenWithFid
          fid={params.fid}
          initialTab={params.initialTab}
          profileOpenIncludeReason={params.profileOpenIncludeReason}
          profileOpenCastHash={params.profileOpenCastHash}
          sourceOn={params.sourceOn}
        />
      </RetryableErrorBoundary>
    );
  },
);

UserScreen.displayName = 'UserScreen';

type UserScreenWithFidProps = {
  fid: number;
  initialTab: UserScreenInitialTab | undefined;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
};

function UserScreenWithFid(props: UserScreenWithFidProps) {
  return (
    <React.Suspense
      fallback={<FullScreenLoadingIndicator debugName="UserWithFid" />}
    >
      <UserScreenWithFidInner
        fid={props.fid}
        initialTab={props.initialTab}
        profileOpenIncludeReason={props.profileOpenIncludeReason}
        profileOpenCastHash={props.profileOpenCastHash}
        sourceOn={props.sourceOn}
      />
    </React.Suspense>
  );
}

const UserScreenWithFidInner: FC<UserScreenWithFidProps> = memo(
  ({
    fid,
    initialTab,
    profileOpenIncludeReason,
    profileOpenCastHash,
    sourceOn,
  }) => {
    const { data, isLoading } = useNonSuspenseUserByFid({
      fid,
      throwOnError: true,
    });

    if (isLoading || typeof data === 'undefined') {
      return <FullScreenLoadingIndicator debugName="UserWithFid" />;
    }

    return (
      <UserScreenRouter
        initialTab={initialTab}
        profileOpenIncludeReason={profileOpenIncludeReason}
        profileOpenCastHash={profileOpenCastHash}
        sourceOn={sourceOn}
        user={data.result.user}
        userProfile={data.result}
      />
    );
  },
);

type UserScreenWithusernameProps = {
  username: string;
  initialTab: UserScreenInitialTab | undefined;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
};

const UserScreenWithUsername: FC<UserScreenWithusernameProps> = memo(
  ({
    username,
    initialTab,
    profileOpenIncludeReason,
    profileOpenCastHash,
    sourceOn,
  }) => {
    const { dispatch } = useNavigation();

    const { data, isLoading } = useNonSuspenseUserByUsername({
      username: username,
      throwOnError: true,
    });

    if (isLoading || typeof data === 'undefined') {
      return <></>;
    }

    if (data === null) {
      dispatch(StackActions.replace('NotFound', {}));

      return null;
    }

    return (
      <UserScreenRouter
        initialTab={initialTab}
        profileOpenIncludeReason={profileOpenIncludeReason}
        profileOpenCastHash={profileOpenCastHash}
        sourceOn={sourceOn}
        user={data.result.user}
        userProfile={data.result}
      />
    );
  },
);

type UserScreenWithUserProps = {
  initialTab: UserScreenInitialTab | undefined;
  profileOpenIncludeReason?: ApiCastFeedIncludeReason['type'];
  profileOpenCastHash?: string;
  sourceOn?: FeedSourceOn;
  user: ApiUser;
  userProfile: ApiUserProfile;
};

function UserScreenRouter(props: UserScreenWithUserProps) {
  return (
    <UserProfileWithBanner
      user={props.user}
      userProfile={props.userProfile}
      initialTab={props.initialTab}
      profileOpenIncludeReason={props.profileOpenIncludeReason}
      profileOpenCastHash={props.profileOpenCastHash}
      sourceOn={props.sourceOn}
    />
  );
}

export { DeeplinkedUserScreen, UserScreen };
