import { Octicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  getNotionLinkTarget,
  useStorageUtilizationWithRefreshOnMount,
} from 'farcaster-client-hooks';
import { ButtonV2 } from 'farcaster-expo';
import React from 'react';
import { Linking, TouchableOpacity, View } from 'react-native';

import { Divider } from '~/components/Divider';
import { buildScreen } from '~/components/Screen';
import { StorageCapacity } from '~/components/StorageCapacity';
import { Text } from '~/components/Text';
import { hitSlop } from '~/constants/Pressable';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePush } from '~/hooks/navigation/usePush';
import { CommonStackParamList } from '~/types';

type StorageScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Storage'
>;

const StorageScreen = buildScreen<StorageScreenProps>(
  { name: 'Storage', insetBottom: true },
  () => {
    const t = useTheme();
    const push = usePush();
    const navigation = useNavigation();
    const { trackEvent } = useAnalytics();

    const { data } = useStorageUtilizationWithRefreshOnMount();

    const units = React.useMemo(() => {
      return data?.storageUtilization.rentedUnits || 0;
    }, [data?.storageUtilization.rentedUnits]);

    const utilization = React.useMemo(() => {
      return {
        casts: data?.storageUtilization.casts || { rented: 0, used: 0 },
        reactions: data?.storageUtilization.reactions || { rented: 0, used: 0 },
        links: data?.storageUtilization.links || { rented: 0, used: 0 },
      };
    }, [
      data?.storageUtilization.casts,
      data?.storageUtilization.links,
      data?.storageUtilization.reactions,
    ]);

    const storageScreenHeaderRight = React.useMemo(() => {
      return (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            Linking.openURL(getNotionLinkTarget({ to: 'storage' }));
          }}
          hitSlop={hitSlop}
        >
          <Octicons name="info" size={18} style={[t.texts.secondary]} />
        </TouchableOpacity>
      );
    }, [t.texts.secondary]);

    React.useEffect(() => {
      navigation.setOptions({
        headerRight: () => storageScreenHeaderRight,
      });
    }, [navigation, storageScreenHeaderRight]);

    useFocusEffect(
      React.useCallback(() => {
        trackEvent(AnalyticsEvent.ViewStorageScreen, {});
      }, [trackEvent]),
    );

    return (
      <View style={[t.hFull]}>
        <Divider marginVertical="slim" />
        <View
          style={[t.p4, t.flex, t.flexRow, t.itemsCenter, t.justifyBetween]}
        >
          <Text style={[t.textBase, t.texts.secondary]}>You have</Text>
          <Text
            style={[t.textBase, t.texts.primary, t.fontSemibold]}
          >{`${units} ${units === 1 ? 'unit' : 'units'}`}</Text>
        </View>
        <Divider marginVertical="slim" />
        <View style={[t.p4, t.flex, t.flexCol]}>
          <Text style={[t.textBase, t.texts.secondary]}>Capacity</Text>
          <View style={[t.mY2, t.flex, t.flexCol]}>
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.mY2,
              ]}
            >
              <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                Casts
              </Text>
              <StorageCapacity
                used={utilization.casts.used}
                rented={utilization.casts.rented}
              />
            </View>
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.mY2,
              ]}
            >
              <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                Reactions
              </Text>
              <StorageCapacity
                used={utilization.reactions.used}
                rented={utilization.reactions.rented}
              />
            </View>
            <View
              style={[
                t.flex,
                t.flexRow,
                t.itemsCenter,
                t.justifyBetween,
                t.mY2,
              ]}
            >
              <Text style={[t.textBase, t.texts.primary, t.fontSemibold]}>
                Follows
              </Text>
              <StorageCapacity
                used={utilization.links.used}
                rented={utilization.links.rented}
              />
            </View>
          </View>
          <View style={[t.pT2]}>
            <ButtonV2
              title="Buy more storage"
              onPress={() => {
                push('BuyStorage', {});
              }}
            />
          </View>
        </View>
        <Divider marginVertical="slim" />
      </View>
    );
  },
);

StorageScreen.displayName = 'StorageScreen';

export { StorageScreen };
