import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ApiCast, ApiUser } from 'farcaster-client-data';
import {
  extractCastKey,
  resolveUsername,
  useDebouncedState,
  useFlatSearchCastsData,
  useSearchCasts,
} from 'farcaster-client-hooks';
import { AnimatedPressable, useHaptics, useTheme } from 'farcaster-expo';
import { Search, X } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Keyboard, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Cast } from '~/components/casts/Cast';
import { DefaultEmptyListView } from '~/components/DefaultEmptyListView';
import {
  PressableGradient,
  useFabIconColor,
} from '~/components/FloatingSearch/PressableGradient';
import {
  SEARCH_ICON_INPUT_SIZE,
  SEARCH_RESULTS_Z_INDEX,
} from '~/components/FloatingSearch/ZIndexLookup';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { onEndReachedThreshold } from '~/constants/FlatList';
import { useOpenComposer } from '~/contexts/CreateCastComposerProvider';
import { useCommonFlatListExtraData } from '~/hooks/useCommonFlatListExtraData';
import { useKeyboardVisibility } from '~/hooks/useKeyboardVisibility';
import { usePrefetchThreadCast } from '~/hooks/usePrefetchThreadCast';
import { createCastParamsWithIntent } from '~/utils/CastComposerIntentUtils';
import { getCastItemType } from '~/utils/FeedUtils';
import { STANDARD_FLASHLIST_PERF_PROPS } from '~/utils/FlashListPerfUtils';

const FLOATING_SEARCH_BOTTOM_SPACING = 80;

const ProfileFloatingSearchList = ({
  query,
}: {
  query: string;
  searchTerm: string;
}) => {
  const t = useTheme();
  const prefetchThreadCast = usePrefetchThreadCast();
  const extraData = useCommonFlatListExtraData();

  const { data, onEndReached, isFetchingNextPage, isPending } = useSearchCasts({
    q: query,
  });
  const casts = useFlatSearchCastsData({ data });

  const renderItem = React.useCallback(
    ({ item }: { item: ApiCast }) => {
      return (
        <Pressable onPressIn={() => prefetchThreadCast(item)}>
          <Cast cast={item} />
        </Pressable>
      );
    },
    [prefetchThreadCast],
  );

  const insets = useSafeAreaInsets();

  const { keyboardHeight } = useKeyboardVisibility();

  const resultsBottomPadding =
    FLOATING_SEARCH_BOTTOM_SPACING + keyboardHeight + insets.bottom;

  return (
    <FlashList
      data={casts ?? []}
      extraData={extraData}
      renderItem={renderItem}
      keyExtractor={extractCastKey}
      getItemType={getCastItemType}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      contentContainerStyle={{ paddingBottom: resultsBottomPadding }}
      keyboardShouldPersistTaps="handled"
      {...STANDARD_FLASHLIST_PERF_PROPS}
      ListEmptyComponent={
        !isPending ? (
          <DefaultEmptyListView message={'No casts found.'} />
        ) : undefined
      }
      ListFooterComponent={
        isFetchingNextPage || (isPending && casts?.length === 0) ? (
          <View style={[t.h24, t.mT4]}>
            <LoadingIndicator />
          </View>
        ) : null
      }
    />
  );
};

const ProfileFloatingSearchResults = ({
  searchQuery,
  debouncedQuery,
  rawQuery,
  onChangeText,
  onClose,
  user,
}: {
  searchQuery: string | null;
  debouncedQuery: string;
  rawQuery: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  user: ApiUser;
}) => {
  const t = useTheme();
  const inputRef = useRef<TextInput>(null);

  const opacity = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value === 1 ? 'auto' : 'none',
  }));

  React.useEffect(() => {
    if (searchQuery === null) {
      opacity.set(withTiming(0, { duration: 150 }));
      return;
    }

    opacity.set(withTiming(1, { duration: 150 }));
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [opacity, searchQuery]);

  const normalizedQuery = debouncedQuery.trim();
  const fromFilter = React.useMemo(() => {
    return user.username ? `from:@${user.username}` : `from:${user.fid}`;
  }, [user.fid, user.username]);

  const queryWithFilter = React.useMemo(() => {
    const baseFilter = `${fromFilter} sort:recent`;
    if (!normalizedQuery) {
      return baseFilter;
    }

    return `${normalizedQuery} ${baseFilter}`;
  }, [fromFilter, normalizedQuery]);

  const insets = useSafeAreaInsets();

  const handleXPress = React.useCallback(() => {
    if (rawQuery.length > 0) {
      onChangeText('');
    } else {
      onClose();
    }
  }, [rawQuery, onChangeText, onClose]);

  return (
    <Animated.View
      style={[
        t.absolute,
        t.top0,
        t.left0,
        t.right0,
        t.bottom0,
        t.flex1,
        t.bgDefault,
        {
          zIndex: SEARCH_RESULTS_Z_INDEX,
          paddingTop: insets.top,
        },
        opacityStyle,
      ]}
    >
      {searchQuery !== null && (
        <View
          style={{
            paddingTop: 8,
            paddingBottom: 8,
            paddingHorizontal: 12,
          }}
        >
          <View
            style={[
              t.flexRow,
              t.itemsCenter,
              t.border,
              t.borders.secondary,
              {
                borderRadius: 100,
                paddingHorizontal: 14,
                paddingVertical: 10,
                gap: 8,
              },
            ]}
          >
            <Search
              size={SEARCH_ICON_INPUT_SIZE}
              color={t.colors.text.secondary}
            />
            <View
              style={[
                {
                  backgroundColor: t.colors.background.secondary,
                  borderRadius: 6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                },
              ]}
            >
              <TextInput
                style={[
                  t.fontNormal,
                  {
                    fontSize: 13,
                    color: t.colors.text.secondary,
                    padding: 0,
                  },
                ]}
                value={`@${user.username ?? user.fid}`}
                editable={false}
              />
            </View>
            <TextInput
              ref={inputRef}
              value={rawQuery}
              onChangeText={onChangeText}
              placeholder="Search..."
              placeholderTextColor={t.colors.text.tertiary}
              style={[
                t.fontNormal,
                {
                  flex: 1,
                  fontSize: 16,
                  color: t.colors.text.primary,
                  outlineWidth: 0,
                },
              ]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedPressable onPress={handleXPress}>
              <X size={18} color={t.colors.text.secondary} />
            </AnimatedPressable>
          </View>
        </View>
      )}
      {normalizedQuery === '' ? (
        <View style={[t.flex1, t.itemsCenter, t.justifyCenter, t.pX6]} />
      ) : (
        <React.Suspense
          fallback={<LoadingIndicator size="small" style={[t.mT4]} />}
        >
          <ProfileFloatingSearchList
            query={queryWithFilter}
            searchTerm={normalizedQuery}
          />
        </React.Suspense>
      )}
    </Animated.View>
  );
};

function ProfileFloatingComposeCta({ user }: { user: ApiUser }) {
  const t = useTheme();
  const iconColor = useFabIconColor();
  const { triggerImpactAsync } = useHaptics();
  const openComposer = useOpenComposer();

  const onPress = React.useCallback(() => {
    triggerImpactAsync();
    openComposer(
      createCastParamsWithIntent({
        text: `${resolveUsername({ username: user.username, fid: user.fid })}`,
        mentions: [user],
      }),
    );
  }, [openComposer, triggerImpactAsync, user]);

  return (
    <View style={[t.absolute, t.bottom0, t.right0, t.mR4, t.mB10]}>
      <AnimatedPressable
        style={[
          t.itemsCenter,
          t.justifyCenter,
          { borderRadius: 100, width: 56, height: 56 },
          Platform.OS === 'android'
            ? {
                overflow: 'hidden',
              }
            : undefined,
        ]}
        disableAnimation={Platform.OS === 'android'}
        onPress={onPress}
      >
        <PressableGradient />
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path
            d="M21.1739 6.81238C21.7026 6.2838 21.9997 5.56685 21.9998 4.81923C21.9999 4.07162 21.703 3.35459 21.1744 2.82588C20.6459 2.29717 19.9289 2.00009 19.1813 2C18.4337 1.99991 17.7166 2.2968 17.1879 2.82538L3.84193 16.1744C3.60975 16.4059 3.43805 16.6909 3.34193 17.0044L2.02093 21.3564C1.99509 21.4429 1.99314 21.5347 2.01529 21.6222C2.03743 21.7097 2.08285 21.7896 2.14673 21.8534C2.21061 21.9172 2.29055 21.9624 2.37809 21.9845C2.46563 22.0065 2.55749 22.0044 2.64393 21.9784L6.99693 20.6584C7.3101 20.5631 7.59511 20.3925 7.82693 20.1614L21.1739 6.81238Z"
            stroke={iconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
          <Path
            d="M15 5L19 9"
            stroke={iconColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </Svg>
      </AnimatedPressable>
    </View>
  );
}

const ProfileFloatingSearch = ({
  user,
  openRef,
}: {
  user: ApiUser;
  openRef?: React.MutableRefObject<(() => void) | null>;
}) => {
  const navigation = useNavigation();

  const [searchQuery, setSearchQuery] = React.useState<string | null>(null);
  const [debouncedQuery, setQuery, forceSetQuery] = useDebouncedState('');

  const handleOpen = React.useCallback(() => {
    forceSetQuery('');
    setSearchQuery('');
  }, [forceSetQuery]);

  React.useEffect(() => {
    if (openRef) {
      openRef.current = handleOpen;
    }
  }, [openRef, handleOpen]);

  const handleClose = React.useCallback(() => {
    Keyboard.dismiss();
    forceSetQuery('');
    setSearchQuery(null);
  }, [forceSetQuery]);

  const handleChangeText = React.useCallback(
    (text: string) => {
      if (text === '') {
        setSearchQuery('');
        forceSetQuery('');
        return;
      }

      setSearchQuery(text);
      setQuery(text);
    },
    [forceSetQuery, setQuery],
  );

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation
        .getParent()
        // @ts-ignore
        ?.addListener('tabPress', () => {
          handleClose();
        });

      return unsubscribe;
    }, [handleClose, navigation]),
  );

  return (
    <>
      <ProfileFloatingSearchResults
        searchQuery={searchQuery}
        debouncedQuery={debouncedQuery}
        rawQuery={searchQuery ?? ''}
        onChangeText={handleChangeText}
        onClose={handleClose}
        user={user}
      />
      <ProfileFloatingComposeCta user={user} />
    </>
  );
};

export { ProfileFloatingSearch };
