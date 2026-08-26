import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useFollowAllTwitterFollowing,
  useTwitterFollowing,
} from 'farcaster-client-hooks';
import {
  ButtonV2,
  LoadingIndicator,
  Text2,
  useRootToast,
} from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { buildScreen } from '~/components/Screen';
import { User } from '~/components/users';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { CommonStackParamList } from '~/types';

const FlatList = Animated.FlatList;

type ProfilesFromXScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ProfilesFromX'
>;

const ProfilesFromXScreen = buildScreen<ProfilesFromXScreenProps>(
  { name: 'ProfilesFromX' },
  () => {
    return <ProfilesFromXContent />;
  },
);
ProfilesFromXScreen.displayName = 'ProfilesFromXScreen';

function ProfilesFromXContent() {
  const { trackEvent } = useAnalytics();

  const t = useTheme();

  const toast = useRootToast();

  const { data, fetchNextPage, isLoading } = useTwitterFollowing();

  const followAllFollowing = useFollowAllTwitterFollowing();

  const onFollowAll = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickFollowAllImportX, {});

    followAllFollowing();

    toast.show('Followed all! 🎉', {
      type: 'generic',
      duration: 3000,
      placement: 'bottom',
    });
  }, [followAllFollowing, toast, trackEvent]);

  const following = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.following) || [];
  }, [data.pages]);

  const totalMatchCount = React.useMemo(() => {
    return data.pages.length !== 0 ? data.pages[0].result.totalMatchCount : 0;
  }, [data.pages]);

  const alreadyFollowingCount = React.useMemo(() => {
    return data.pages.length !== 0
      ? data.pages[0].result.alreadyFollowingCount
      : 0;
  }, [data.pages]);

  const extraData = useCommonFlatListExtraData();

  const handleEndReached = React.useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  const ListHeaderComponent = React.useMemo(() => {
    if (totalMatchCount === 0) {
      return (
        <View
          style={[
            t.flex,
            t.flexCol,
            { gap: 12 },
            t.borderBHairline,
            t.borderDefault,
            t.mB2,
            t.pY4,
          ]}
        >
          <View style={[t.flex, t.flexRow, t.mX4, t.itemsStart]}>
            <Text2
              size="xl"
              weight="semibold"
              color="primary"
              numberOfLines={2}
            >
              Find people you follow on X / Twitter
            </Text2>
          </View>
          <Text2 size="base" weight="regular" color="primary" style={[t.mX4]}>
            Visit Farcaster {`Settings > Profiles from X / Twitter`} and follow
            the instructions on web to start the process.
          </Text2>
        </View>
      );
    }

    return (
      <View
        style={[
          t.flex,
          t.flexCol,
          { gap: 12 },
          t.borderBHairline,
          t.borderDefault,
          t.mB2,
          t.pY4,
        ]}
      >
        <View style={[t.flex, t.flexRow, t.mX4, t.itemsStart]}>
          <Text2 size="xl" weight="semibold" color="primary" numberOfLines={2}>
            Find people you follow on X / Twitter
          </Text2>
        </View>
        {totalMatchCount === 0 && (
          <Text2 size="base" weight="regular" color="primary" style={[t.mX4]}>
            We found no profiles you follow on X. We will notify you if any
            matches occur in the future.
          </Text2>
        )}
        {totalMatchCount !== 0 && (
          <View>
            <Text2 size="base" weight="regular" color="primary" style={[t.mX4]}>
              We found {totalMatchCount}{' '}
              {totalMatchCount === 1 ? `profile` : `profiles`} you follow on X.
            </Text2>
            <Text2 size="base" weight="regular" color="primary" style={[t.mX4]}>
              {totalMatchCount === alreadyFollowingCount
                ? 'You are already following all of them on Farcaster.'
                : `You are not following ${totalMatchCount - alreadyFollowingCount} of them on Farcaster.`}
            </Text2>
          </View>
        )}
        <View style={[t.flex, t.flexRow, t.itemsCenter, t.mX4, { gap: 8 }]}>
          <ButtonV2
            width="flex1"
            height="normal"
            textSize="lg"
            title={`Follow all ${totalMatchCount - alreadyFollowingCount !== 0 ? totalMatchCount - alreadyFollowingCount : ''}`}
            onPress={onFollowAll}
            disabled={totalMatchCount - alreadyFollowingCount === 0}
          />
        </View>
      </View>
    );
  }, [
    alreadyFollowingCount,
    onFollowAll,
    t.borderBHairline,
    t.borderDefault,
    t.flex,
    t.flexCol,
    t.flexRow,
    t.itemsCenter,
    t.itemsStart,
    t.mB2,
    t.mX4,
    t.pY4,
    totalMatchCount,
  ]);

  const ListFooterComponent = React.useMemo(() => {
    return isLoading ? (
      <LoadingIndicator size="small" style={[t.mT4]} />
    ) : undefined;
  }, [isLoading, t.mT4]);

  return (
    <>
      <FlatList
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{}}
        data={following}
        extraData={extraData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
      />
    </>
  );
}

function keyExtractor(item: ApiUser) {
  return item.fid.toString();
}

function renderItem({ item }: { item: ApiUser }) {
  return <User user={item} hideBio={true} hideFollowsYou={true} />;
}

export { ProfilesFromXScreen };
