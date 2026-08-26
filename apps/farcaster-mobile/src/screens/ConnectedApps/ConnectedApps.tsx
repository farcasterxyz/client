import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiConnectedApp } from 'farcaster-client-data';
import { resolveUsername, useConnectedApps } from 'farcaster-client-hooks';
import { AnimatedPressable, RemoteImage, Text2 } from 'farcaster-expo';
import { ChevronRight } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Empty } from '~/components/Empty';
import { buildScreen } from '~/components/Screen';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useRefreshOnFocus } from '~/hooks/useRefreshOnFocus';
import { CommonStackParamList } from '~/types';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

type ConnectedAppsScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'ConnectedApps'
>;

export const ConnectedAppsScreen = buildScreen<ConnectedAppsScreenProps>(
  { name: 'ConnectedApps' },
  () => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const { data, refetch, onEndReached } = useConnectedApps(
      {
        limit: 10,
      },
      {
        refetchOnMount: 'always',
      },
    );

    useRefreshOnFocus(refetch);

    useFocusEffect(
      useCallback(() => {
        trackEvent(AnalyticsEvent.ViewConnectedApps);
      }, [trackEvent]),
    );

    const itemsLength = data ? data.length : 0;

    const renderItem = useCallback<ListRenderItem<ApiConnectedApp>>(
      ({ item, index }) => {
        return (
          <ConnectedAppListItem
            item={item}
            isFirst={index === 0}
            isLast={index === itemsLength - 1}
          />
        );
      },
      [itemsLength],
    );

    return (
      <FlashList
        data={data}
        keyExtractor={(item) => String(item.appUser.fid)}
        contentContainerStyle={{
          ...t.pX3,
          ...t.pB3,
        }}
        onEndReached={onEndReached}
        ListEmptyComponent={EmptyConnectedApps}
        {...STANDARD_FLASHLIST_PERF_PROPS}
        renderItem={renderItem}
      />
    );
  },
);

const EmptyConnectedApps: React.FC = React.memo(() => {
  return (
    <Empty
      icon={
        <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
          <Path
            stroke="#546473"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            d="M34.213 5.813a5.333 5.333 0 0 0-4.426 0l-22.854 10.4a2.667 2.667 0 0 0 0 4.88l22.88 10.427a5.334 5.334 0 0 0 4.427 0l22.88-10.4a2.667 2.667 0 0 0 0-4.88L34.213 5.813Z"
          />
          <Path
            stroke="#546473"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            d="M5.333 32a2.667 2.667 0 0 0 1.547 2.427l22.933 10.426a5.333 5.333 0 0 0 4.4 0l22.88-10.4A2.667 2.667 0 0 0 58.667 32"
          />
          <Path
            stroke="#546473"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={4}
            d="M5.333 45.333A2.667 2.667 0 0 0 6.88 47.76l22.933 10.427a5.333 5.333 0 0 0 4.4 0l22.88-10.4a2.667 2.667 0 0 0 1.574-2.454"
          />
        </Svg>
      }
      justify="start"
      message="No connected apps"
      subMessage="Connected apps can post and sign in on your behalf."
    />
  );
});

function ConnectedAppListItem({
  item,
  isFirst,
  isLast,
}: {
  item: ApiConnectedApp;
  isFirst: boolean;
  isLast: boolean;
}) {
  const t = useTheme();
  const navigate = useNavigate();

  return (
    <AnimatedPressable
      style={[
        t.p4,
        t.flexRow,
        t.justifyBetween,
        t.itemsCenter,
        {
          gap: 8,
          borderTopLeftRadius: isFirst ? 16 : 0,
          borderTopRightRadius: isFirst ? 16 : 0,
          borderBottomLeftRadius: isLast ? 16 : 0,
          borderBottomRightRadius: isLast ? 16 : 0,
        },
        isFirst ? [] : [t.borderT, t.borderBackground],
      ]}
      onPress={() => {
        navigate('ConnectedApp', {
          appFid: item.appUser.fid,
          appName: item.appUser.displayName,
        });
      }}
      color="lightGray"
    >
      <View style={[t.flexRow, { gap: 8 }]}>
        <RemoteImage
          uri={item.appUser.pfp?.url}
          height={40}
          width={40}
          style={[{ borderRadius: 12, backgroundColor: 'white' }]}
          recyclingKey={item.appUser.fid.toString()}
        />
        <View style={[{ height: 40 }, t.justifyAround]}>
          <Text2 weight="semibold">{item.appUser.displayName}</Text2>
          <Text2 color="secondary" size="sm">
            {resolveUsername(item.appUser)}
          </Text2>
        </View>
      </View>
      <View style={[t.flexNone]}>
        <ChevronRight color={t.colors.text.secondary} height={20} />
      </View>
    </AnimatedPressable>
  );
}

ConnectedAppsScreen.displayName = 'ConnectedAppsScreen';
