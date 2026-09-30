import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiOnchainAction } from 'farcaster-client-data';
import { useRentStorage } from 'farcaster-client-hooks';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePollForOnchainAction } from '~/hooks/data/usePollForOnchainAction';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type StorageTransactionScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'StorageTransaction'
>;

const StorageTransactionScreen = buildScreen<StorageTransactionScreenProps>(
  { name: 'StorageTransaction' },
  ({
    route: {
      params: { productPurchaseTrackingId, units },
    },
  }) => {
    const t = useTheme();
    const toast = useToast();
    const pop = usePop();
    const navigate = useNavigate();
    const { trackEvent } = useAnalytics();

    const rentStorage = useRentStorage();
    const pollForOnchainAction = usePollForOnchainAction();

    const [onchainActionState, setOnchainActionState] =
      React.useState<ApiOnchainAction['state']>('pending');

    React.useEffect(() => {
      (async () => {
        try {
          const {
            result: { onchainAction },
          } = await rentStorage({ units, productPurchaseTrackingId });

          const nextOnchainActionResult = await pollForOnchainAction({
            onchainActionId: onchainAction.id,
          });

          setOnchainActionState(nextOnchainActionResult.onchainAction.state);
        } catch (error) {
          trackError(error);

          toast.show('There was a problem purchasing storage', {
            type: 'danger',
          });

          pop();
        }
      })();
    }, [
      pollForOnchainAction,
      pop,
      productPurchaseTrackingId,
      rentStorage,
      toast,
      units,
    ]);

    React.useEffect(() => {
      if (onchainActionState === 'pending') {
        trackEvent(AnalyticsEvent.ViewStorageBroadcasting, {});
      }
      if (onchainActionState === 'completed') {
        trackEvent(AnalyticsEvent.ViewStoragePurchased, {});
      }
      if (onchainActionState === 'failed') {
        trackEvent(AnalyticsEvent.ViewStoragePurchaseFailed, {});
      }
    }, [onchainActionState, trackEvent]);

    if (onchainActionState === 'completed') {
      return (
        <View style={[t.hFull, t.p4, t.justifyBetween]}>
          <View
            style={[t.flex, t.flexGrow, t.itemsCenter, t.justifyCenter, t.mB36]}
          >
            <View
              style={[
                t.roundedFull,
                t.flex,
                t.bgSuccess,
                t.itemsCenter,
                t.justifyCenter,
                t.border,
                t.borderDefault,
                { height: 68, width: 68 },
              ]}
            >
              <View
                style={[
                  t.h10,
                  t.w10,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                ]}
              >
                <Octicons
                  name="check"
                  size={16}
                  style={[{ color: '#ffffff' }]}
                />
              </View>
            </View>
            <Text
              style={[
                t.texts.primary,
                t.textCenter,
                t.text2xl,
                t.mT4,
                t.fontBold,
              ]}
            >
              Purchased
            </Text>
            <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mT2]}>
              Your limits will be increased shortly.
            </Text>
          </View>
          <View>
            <AtomsButton
              size="l"
              hierarchy="primary"
              onPress={() => {
                navigate('Feed', {});
              }}
            >
              Return to feed
            </AtomsButton>
          </View>
        </View>
      );
    }

    if (onchainActionState === 'failed') {
      return (
        <View style={[t.hFull, t.p4, t.justifyBetween]}>
          <View
            style={[t.flex, t.flexGrow, t.itemsCenter, t.justifyCenter, t.mB36]}
          >
            <View
              style={[
                t.roundedFull,
                t.bgErrorBubble,
                t.flex,
                t.itemsCenter,
                t.justifyCenter,
                { height: 68, width: 68 },
              ]}
            >
              <View
                style={[
                  t.h10,
                  t.w10,
                  t.roundedFull,
                  t.itemsCenter,
                  t.justifyCenter,
                ]}
              >
                <Octicons
                  name="alert"
                  size={16}
                  style={[{ color: '#ffffff' }]}
                />
              </View>
            </View>
            <Text
              style={[
                t.texts.primary,
                t.textCenter,
                t.text2xl,
                t.mT4,
                t.fontBold,
              ]}
            >
              Failed
            </Text>
            <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mT2]}>
              Please check your email for more details on how to resolve this.
            </Text>
          </View>
          <View>
            <AtomsButton
              size="l"
              hierarchy="primary"
              onPress={() => {
                navigate('Feed', {});
              }}
            >
              Return to feed
            </AtomsButton>
          </View>
        </View>
      );
    }

    return (
      <View style={[t.hFull, t.p4, t.justifyBetween]}>
        <View
          style={[t.flex, t.flexGrow, t.itemsCenter, t.justifyCenter, t.mB36]}
        >
          <View
            style={[
              t.relative,
              { height: 68, width: 68 },
              t.bgDefault,
              t.roundedFull,
              t.itemsCenter,
              t.justifyCenter,
            ]}
          >
            <ActivityIndicator size="small" color={t.colors.loadingIndicator} />
          </View>
          <Text
            style={[
              t.texts.primary,
              t.textCenter,
              t.text2xl,
              t.mT4,
              t.fontBold,
            ]}
          >
            Broadcasting
          </Text>
          <Text style={[t.texts.secondary, t.textCenter, t.textBase, t.mT2]}>
            Your storage purchase will be made onchain, and may take up to 60
            seconds.
          </Text>
        </View>
      </View>
    );
  },
);

StorageTransactionScreen.displayName = 'StorageTransactionScreen';

export { StorageTransactionScreen };
