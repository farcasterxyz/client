import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApiFarcasterNuxRecommendedUser } from 'farcaster-client-data';
import {
  formatFollowCount,
  useResetNuxTasks,
  useSuggestedUsersToFollow,
} from 'farcaster-client-hooks';
import {
  BookOpen,
  Box,
  Globe,
  Heart,
  MessageCircle,
  Music,
  Newspaper,
  Paintbrush,
  Smile,
  Sparkles,
  Terminal,
  Trophy,
  Users,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';

import { ButtonV2 } from '~/components/ButtonV2';
// import { NuxTaskBanner } from '~/components/banners/NuxTaskBanner';
import { EthereumIcon } from '~/components/images/EthereumIcon';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { User } from '~/components/users/User';
import { useTheme } from '~/contexts/ThemeProvider';
import { useHaptics } from '~/hooks/useHaptics';
import { CommonStackParamList } from '~/types';

type DebugNuxTasksScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugNuxTasks'
>;

// Maximum number of interests that can be selected
const MAX_INTERESTS = 3;

// Interest categories for filtering recommended follows
const INTERESTS = [
  { label: 'Crypto', value: 'ethereum' },
  { label: 'Software', value: 'software' },
  { label: 'Startups', value: 'startups' },
  { label: 'AI', value: 'ai' },
  { label: 'Memes', value: 'memes' },
  { label: 'Music', value: 'music' },
  { label: 'Design', value: 'design' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Sports', value: 'sports' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'News', value: 'news' },
];

const getInterestIcon = (interest: string, color: string, size = 18) => {
  switch (interest) {
    case 'ethereum':
      return <EthereumIcon height={size} color={color} />;
    case 'software':
      return <Terminal size={size} color={color} />;
    case 'startups':
      return <Box size={size} color={color} />;
    case 'ai':
      return <Sparkles size={size} color={color} />;
    case 'memes':
      return <Smile size={size} color={color} />;
    case 'music':
      return <Music size={size} color={color} />;
    case 'design':
      return <Paintbrush size={size} color={color} />;
    case 'fitness':
      return <Heart size={size} color={color} />;
    case 'sports':
      return <Trophy size={size} color={color} />;
    case 'lifestyle':
      return <Globe size={size} color={color} />;
    case 'news':
      return <Newspaper size={size} color={color} />;
    default:
      return <BookOpen size={size} color={color} />;
  }
};

const getInterestDisplayName = (interest: string) => {
  switch (interest) {
    case 'ethereum':
      return 'Crypto';
    case 'music':
      return 'Music';
    case 'fitness':
      return 'Fitness';
    case 'software':
      return 'Programming';
    case 'startups':
      return 'Technology';
    case 'memes':
      return 'Memes';
    case 'ai':
      return 'AI';
    case 'design':
      return 'Design';
    case 'sports':
      return 'Sports';
    case 'lifestyle':
      return 'Lifestyle';
    case 'news':
      return 'News';
    default:
      return interest;
  }
};

const DebugNuxTasksScreen = buildScreen<DebugNuxTasksScreenProps>(
  { name: 'DebugNuxTasks' },
  () => {
    const t = useTheme();
    const { triggerImpactAsync } = useHaptics();
    const toast = useToast();
    const resetNuxTasks = useResetNuxTasks();

    // Track selected interest categories using a Set to allow multiple selections
    const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
      new Set(),
    );
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [fid, setFid] = useState('');
    const [resettingNux, setResettingNux] = useState(false);

    // Convert Set to array for the hook parameter
    const selectedInterestsArray = useMemo(
      () => Array.from(selectedInterests),
      [selectedInterests],
    );

    // Use our hook to fetch suggested users - will only fetch when exactly 3 interests are selected
    const { data, refetch } = useSuggestedUsersToFollow(selectedInterestsArray);

    // Handle manual refresh
    const handleRefresh = async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    };

    // Create refresh control for pull-to-refresh
    const refreshControl = (
      <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
    );

    // Extract users from the response
    const users = useMemo(() => data?.users || [], [data]);

    // Create a custom renderer for user items in FlatList
    const renderFlatListItem = useCallback(
      ({ item }: { item: ApiFarcasterNuxRecommendedUser }) => (
        <View style={[t.mB2]}>
          <User
            user={item.user}
            hideBio={false}
            withNoBorderBottomStyle
            hideFollowsYou
            analyticsData={{
              on: 'debug-nux-tasks',
              followSuggestionReason: item.suggestionReason,
              interestName: item.interestName,
            }}
          />
          <View
            style={[
              t.mT2,
              t.flexRow,
              t.itemsCenter,
              { paddingLeft: 72, gap: 6, marginTop: -6 },
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter]}>
              <Users
                size={14}
                color={t.colors.text.secondary}
                style={[t.mR1]}
              />
              <Text2 color="secondary" size="sm">{`${formatFollowCount({
                followCount: item.user.followerCount,
              })} followers`}</Text2>
            </View>
            {item.interestName && (
              <View style={[t.flexRow, t.itemsCenter]}>
                <Text2 color="secondary" size="sm" style={[{ marginRight: 6 }]}>
                  ·
                </Text2>
                <MessageCircle
                  size={14}
                  style={[t.mR1, { color: '#4F81EE' }]}
                />
                <Text2
                  size="sm"
                  style={[{ color: '#4F81EE' }]}
                >{`Casts about ${getInterestDisplayName(item.interestName)}`}</Text2>
              </View>
            )}
          </View>
        </View>
      ),
      [t],
    );

    // Handle interest selection with a max of 3 interests
    const handleInterestTap = (interest: string) => {
      triggerImpactAsync();

      setSelectedInterests((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(interest)) {
          // Always allow deselecting
          newSet.delete(interest);
          return newSet;
        } else if (newSet.size >= MAX_INTERESTS) {
          // If trying to add more than MAX_INTERESTS, show a toast message
          toast.show(
            `You can only select up to ${MAX_INTERESTS} interests at once`,
            {
              type: 'warning',
              duration: 2000,
            },
          );
          // Return the original set unchanged
          return prev;
        } else {
          // Add the interest if under the limit
          newSet.add(interest);
          return newSet;
        }
      });
    };

    // Show hint toast when trying to select more than MAX_INTERESTS
    const showMaxLimitToast = () => {
      toast.show(
        `You can only select up to ${MAX_INTERESTS} interests at once`,
        {
          type: 'warning',
          duration: 2000,
        },
      );
    };

    const isValidFid = /^\d+$/.test(fid) && parseInt(fid, 10) > 0;

    const handleResetNuxTasks = useCallback(async () => {
      if (!isValidFid) {
        Alert.alert('Invalid FID', 'Please enter a valid positive number');
        return;
      }

      const numericFid = parseInt(fid, 10);

      try {
        setResettingNux(true);
        await resetNuxTasks({ fid: numericFid });

        toast.show(`Successfully reset NUX tasks for FID: ${numericFid}`, {
          type: 'success',
        });
      } catch (err) {
        toast.show(
          `Error resetting NUX tasks: ${err instanceof Error ? err.message : 'Unknown error'}`,
          {
            type: 'danger',
          },
        );
      } finally {
        setResettingNux(false);
      }
    }, [isValidFid, fid, resetNuxTasks, toast]);

    // Render interest category pills
    const renderInterestPills = () => (
      <View style={[t.pX2, t.pY3]}>
        <Text2 weight="medium" size="base" color="secondary" style={[t.mB2]}>
          Experiment with recommended follow lists
        </Text2>
        <View style={[t.flexRow, t.flexWrap, { gap: 4 }]}>
          {INTERESTS.map((interest) => {
            const isSelected = selectedInterests.has(interest.value);
            // Determine if this pill should be disabled (not selected and at max)
            const isDisabled =
              !isSelected && selectedInterests.size >= MAX_INTERESTS;

            return (
              <TouchableOpacity
                key={interest.value}
                onPress={
                  isDisabled
                    ? showMaxLimitToast
                    : () => handleInterestTap(interest.value)
                }
                activeOpacity={0.7}
                style={[
                  isDisabled && { opacity: 0.5 },
                  t.flexRow,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.pX3,
                  t.border,
                  {
                    height: 36,
                    minWidth: 80,
                    borderRadius: 50,
                    marginRight: 4,
                    marginBottom: 4,
                    backgroundColor: isSelected
                      ? t.dark
                        ? t.colors.background.tertiary
                        : t.colors.background.brandLight
                      : t.colors.background.secondary,
                    borderColor: isSelected
                      ? t.dark
                        ? t.colors.background.tertiary
                        : t.colors.background.brandLight
                      : t.colors.background.secondary,
                  },
                ]}
              >
                {getInterestIcon(
                  interest.value,
                  isSelected
                    ? t.dark
                      ? t.colors.text.white
                      : t.colors.text.brand
                    : t.colors.text.secondary,
                  16,
                )}
                <Text2
                  weight="semibold"
                  style={[
                    t.mL1,
                    {
                      color: isSelected
                        ? t.dark
                          ? t.colors.text.white
                          : t.colors.text.brand
                        : t.colors.text.secondary,
                      fontSize: 14,
                      lineHeight: 18,
                    },
                  ]}
                >
                  {interest.label}
                </Text2>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );

    return (
      <View style={[t.flex1, t.bgDefault]}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="always"
        >
          {/* NUX banner decided by shared component */}
          {/* <NuxTaskBanner /> */}

          {/* NUX Reset Debug UI */}
          <View style={[t.p4]}>
            <Text2 weight="semibold" style={[t.mB2]}>
              Reset NUX Tasks
            </Text2>
            <TextInput
              value={fid}
              onChangeText={setFid}
              placeholder="Enter FID"
              keyboardType="numeric"
              containerStyle={[t.mB2]}
            />
            <ButtonV2
              title="Reset NUX Tasks"
              width="full"
              onPress={handleResetNuxTasks}
              disabled={!isValidFid || resettingNux}
              loading={resettingNux}
            />
          </View>

          {renderInterestPills()}

          <View style={[t.pX4, t.pY2]}>
            <Text2 color="secondary" size="sm">
              Recommendations based on{' '}
              {Array.from(selectedInterests).map((interest, index, array) => (
                <React.Fragment key={interest}>
                  <Text2 weight="semibold" color="secondary" size="sm">
                    {interest}
                  </Text2>
                  {index < array.length - 1 && (
                    <Text2 color="secondary" size="sm">
                      ,{' '}
                    </Text2>
                  )}
                </React.Fragment>
              ))}
              {selectedInterests.size === 0 && 'no interests'}
            </Text2>
          </View>

          {/* FlatList for users with fixed height */}
          <View style={{ height: users.length ? users.length * 80 : 500 }}>
            <FlatList
              data={users}
              renderItem={renderFlatListItem}
              keyExtractor={(item: ApiFarcasterNuxRecommendedUser) =>
                item.user.fid.toString()
              }
              scrollEnabled={false} // Disable scrolling on FlatList as the ScrollView handles scrolling
            />
          </View>
        </ScrollView>
      </View>
    );
  },
);

export { DebugNuxTasksScreen };
