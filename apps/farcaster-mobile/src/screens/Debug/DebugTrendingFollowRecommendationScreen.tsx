import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFarcasterApiClient } from 'farcaster-client-hooks';
import React, { useCallback, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { Button } from '~/components/Button';
import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { CommonStackParamList } from '~/types';

type DebugTrendingFollowRecommendationScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugTrendingFollowRecommendation'
>;

/**
 * Custom hook for sending test follow recommendation notifications
 */
export const useSendTestFollowRecommendation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { apiClient } = useFarcasterApiClient();

  const sendTestNotification = useCallback(
    async (
      targetFid: string,
      recommendedFid: string,
      mutualFollowerFids: string[],
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert string inputs to numbers
        const targetFidNum = parseInt(targetFid, 10);
        const recommendedFidNum = parseInt(recommendedFid, 10);
        const mutualFollowerFidsNum = mutualFollowerFids.map((fid) =>
          parseInt(fid, 10),
        );

        // Validate inputs
        if (
          isNaN(targetFidNum) ||
          isNaN(recommendedFidNum) ||
          mutualFollowerFidsNum.some(isNaN)
        ) {
          throw new Error('All FIDs must be valid numbers');
        }

        const { data } =
          await apiClient.sendTestFollowRecommendationNotification({
            targetFid: targetFidNum,
            recommendedFid: recommendedFidNum,
            mutualFollowerFids: mutualFollowerFidsNum,
          });

        return data.result.success;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient],
  );

  return {
    sendTestNotification,
    isLoading,
    error,
  };
};

const DebugTrendingFollowRecommendationScreen =
  buildScreen<DebugTrendingFollowRecommendationScreenProps>(
    { name: 'DebugTrendingFollowRecommendation' },
    () => {
      const t = useTheme();
      const isAdmin = useIsAdmin();
      const [targetFid, setTargetFid] = useState('');
      const [recommendedFid, setRecommendedFid] = useState('');
      const [mutualFollowerFidsInput, setMutualFollowerFidsInput] =
        useState('');
      const { sendTestNotification, isLoading, error } =
        useSendTestFollowRecommendation();

      const handleSend = async () => {
        // Parse mutual follower FIDs
        const mutualFollowerFids = mutualFollowerFidsInput
          .split(',')
          .map((fid) => fid.trim())
          .filter(Boolean);

        const success = await sendTestNotification(
          targetFid,
          recommendedFid,
          mutualFollowerFids,
        );

        if (success) {
          Alert.alert('Success', 'Test notification sent successfully');
        } else {
          Alert.alert('Error', error || 'Failed to send test notification');
        }
      };

      if (!isAdmin) {
        return <View style={[t.hFull, t.p4]}></View>;
      }

      return (
        <View style={[t.hFull, t.p4]}>
          <Text style={[t.textLg, t.fontSemibold, t.mB4]}>
            Test Trending Follow Recommendation
          </Text>

          <View style={[t.mB4]}>
            <Text style={[t.fontMedium, t.mB1]}>Target FID</Text>
            <TextInput
              style={[t.p2, t.border, t.rounded, t.textBase]}
              placeholder="Enter target FID"
              value={targetFid}
              onChangeText={setTargetFid}
              keyboardType="numeric"
            />
            <Text style={[t.textXs, t.mT1, t.texts.light]}>
              The FID of the user to send the notification to
            </Text>
          </View>

          <View style={[t.mB4]}>
            <Text style={[t.fontMedium, t.mB1]}>Recommended FID</Text>
            <TextInput
              style={[t.p2, t.border, t.rounded, t.textBase]}
              placeholder="Enter recommended FID"
              value={recommendedFid}
              onChangeText={setRecommendedFid}
              keyboardType="numeric"
            />
            <Text style={[t.textXs, t.mT1, t.texts.light]}>
              The FID of the user being recommended to follow
            </Text>
          </View>

          <View style={[t.mB4]}>
            <Text style={[t.fontMedium, t.mB1]}>Mutual Follower FIDs</Text>
            <TextInput
              style={[t.p2, t.border, t.rounded, t.textBase]}
              placeholder="Enter mutual follower FIDs (comma separated)"
              value={mutualFollowerFidsInput}
              onChangeText={setMutualFollowerFidsInput}
              keyboardType="numeric"
              multiline
            />
            <Text style={[t.textXs, t.mT1, t.texts.light]}>
              Comma-separated list of FIDs who follow both the target and
              recommended users
            </Text>
          </View>

          <Button
            title="Send Test Notification"
            onPress={handleSend}
            loading={isLoading}
            disabled={!targetFid || !recommendedFid}
            style={[t.mT4]}
          />

          {error ? <Text style={[t.texts.danger, t.mT4]}>{error}</Text> : null}
        </View>
      );
    },
  );

export { DebugTrendingFollowRecommendationScreen };
