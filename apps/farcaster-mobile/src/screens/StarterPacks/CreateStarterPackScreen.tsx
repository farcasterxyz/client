import { Octicons } from '@expo/vector-icons';
import { StackActions, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useCreateStarterPack,
  useSearchUsersForStarterPacks,
  useUpdateStarterPack,
} from 'farcaster-client-hooks';
import uniqBy from 'lodash/uniqBy';
import React from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

import { Avatar } from '~/components/Avatar';
import { ButtonV2 } from '~/components/ButtonV2';
import { LoadingIndicator } from '~/components/LoadingIndicator';
import { buildScreen } from '~/components/Screen';
import { SearchInput } from '~/components/SearchInput';
import { StarterPackCategoriesModal } from '~/components/StarterPacks/StarterPackCategoriesModal';
import {
  StarterPacksSetupStepsProvider,
  useStarterPacksSetupSteps,
} from '~/components/StarterPacks/StepsProvider';
import { Text2 } from '~/components/Text';
import { TextInputWithCounter } from '~/components/TextInput/TextInputWithCounter';
import { UserDisplayNameUsername } from '~/components/users/UserDisplayNameUsername';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { useCurrentUser_UNSAFE } from '~/hooks/data/useCurrentUser';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { useUpdateHeaderOptions } from '~/hooks/navigation/useUpdateHeaderOptions';
import { CommonStackParamList } from '~/types';

type CreateStarterPackScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CreateStarterPack'
>;

const CreateStarterPackScreen = buildScreen<CreateStarterPackScreenProps>(
  {
    name: 'CreateStarterPack',
    avoidKeyboard: true,
    insetBottom: false,
  },
  ({
    route: {
      params: { existingStarterPack },
    },
  }) => {
    return (
      <StarterPacksSetupStepsProvider existingStarterPack={existingStarterPack}>
        <CreateStarterPacksSetupSteps />
      </StarterPacksSetupStepsProvider>
    );
  },
);

CreateStarterPackScreen.displayName = 'CreateStarterPackScreen';

function Container({
  step,
  children,
}: React.PropsWithChildren & { step: 'Details' | 'Users' }) {
  const t = useTheme();

  if (step === 'Details') {
    return (
      <KeyboardAwareScrollView
        style={[t.flex1]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </KeyboardAwareScrollView>
    );
  } else if (step === 'Users') {
    return <View style={[t.flex1]}>{children}</View>;
  }

  return <>{children}</>;
}

function CreateStarterPacksSetupSteps() {
  const t = useTheme();

  const { fid: currentUserFid } = useCurrentUser_UNSAFE();

  const [state, dispatch] = useStarterPacksSetupSteps();

  const [creating, setCreating] = React.useState<boolean>(false);

  const createStarterPack = useCreateStarterPack();

  const updateStarterPack = useUpdateStarterPack();

  const navigate = useNavigate();

  const navigation = useNavigation();

  const { trackEvent } = useAnalytics();

  const onContinuePress = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.PressStarterPackWizardContinue, {
      currentStep: state.currentStep,
    });

    if (state.currentStep === 'Details') {
      dispatch({ type: 'Next' });
      return;
    }

    if (
      state.currentStep === 'Users' &&
      typeof state.name !== 'undefined' &&
      state.name.trim() !== '' &&
      typeof state.description !== 'undefined' &&
      state.description.trim() !== ''
    ) {
      setCreating(true);

      try {
        if (typeof state.existingStarterPackId !== 'undefined') {
          await updateStarterPack({
            id: state.existingStarterPackId,
            fid: currentUserFid,
            name: state.name,
            description: state.description,
            fids: state.users.map(({ fid }) => fid),
            labels: state.labels,
          });

          trackEvent(AnalyticsEvent.UpdateStarterPack, {
            name: state.name,
            starterPackId: state.existingStarterPackId,
          });

          navigation.dispatch(StackActions.replace('StarterPacks', {}));
          navigate('StarterPack', {
            starterPackId: state.existingStarterPackId,
          });
        } else {
          const starterPack = await createStarterPack({
            fid: currentUserFid,
            name: state.name,
            description: state.description,
            fids: state.users.map(({ fid }) => fid),
            labels: state.labels,
          });

          trackEvent(AnalyticsEvent.CreateStarterPack, {
            creatorFid: currentUserFid,
            name: state.name,
            description: state.description,
            itemCount: state.users.length,
            starterPackId: starterPack.id,
          });

          navigation.dispatch(StackActions.replace('StarterPacks', {}));
          navigate('StarterPack', {
            starterPackId: starterPack.id,
            newlyCreatedStarterPack: true,
          });
        }
      } finally {
        setCreating(false);
      }

      return;
    }
  }, [
    createStarterPack,
    currentUserFid,
    dispatch,
    navigate,
    navigation,
    state.currentStep,
    state.description,
    state.existingStarterPackId,
    state.labels,
    state.name,
    state.users,
    trackEvent,
    updateStarterPack,
  ]);

  const needsToChooseMoreUsers =
    state.currentStep === 'Users' && 8 - state.users.length > 0;

  return (
    <View style={[t.hFull, t.flex]}>
      <Container step={state.currentStep}>
        {state.currentStep === 'Details' && <CreateStarterPacksDetails />}
        {state.currentStep === 'Users' && <CreateStarterPacksSearchUsers />}
      </Container>
      <View style={[t.flex, t.mX4, t.mB4, { gap: 8 }]}>
        {state.currentStep === 'Users' && (
          <View
            style={[
              t.mY1,
              t.flex,
              t.justifyBetween,
              needsToChooseMoreUsers ? t.flexRow : t.flexRowReverse,
            ]}
          >
            {needsToChooseMoreUsers && (
              <View style={[t.flex, t.flexCol]}>
                <Text2 size="sm" color="tertiary">
                  Select {`${8 - state.users.length} more`} to continue
                </Text2>
              </View>
            )}
            {state.users.length > 0 && (
              <Text2 size="sm" weight="semibold" color="tertiary">
                <Text2 size="sm" weight="semibold" color="primary">
                  {state.users.length}
                </Text2>{' '}
                / 100
              </Text2>
            )}
          </View>
        )}
        <ButtonV2
          title="Continue"
          disabled={
            creating ||
            (state.currentStep === 'Details'
              ? typeof state.name === 'undefined' ||
                typeof state.description === 'undefined' ||
                state.name.trim() === '' ||
                state.description.trim() === ''
              : state.users.length < 7 || state.users.length > 100)
          }
          onPress={onContinuePress}
        />
      </View>
    </View>
  );
}

function CreateStarterPacksDetails() {
  const t = useTheme();

  const [state, dispatch] = useStarterPacksSetupSteps();

  const [showCategoriesModal, setShowCategoriesModal] =
    React.useState<boolean>(false);

  const onCategorySelectPress = React.useCallback(() => {
    Keyboard.dismiss();

    setShowCategoriesModal(true);
  }, []);

  const onCategoriesModalDismiss = React.useCallback(() => {
    setShowCategoriesModal(false);
  }, []);

  return (
    <>
      <View style={[t.flex1]}>
        <View style={[t.pX4, { gap: 24 }]}>
          <View>
            <Text2
              weight="semibold"
              color="secondary"
              size="base"
              style={[t.pB2]}
            >
              Name your starter pack
            </Text2>
            <TextInputWithCounter
              autoCorrect={true}
              autoCapitalize="words"
              autoFocus={false}
              spellCheck={true}
              clearButtonMode="never"
              maxLength={50}
              placeholder="Farcaster Super Fans"
              value={state.name || ''}
              onChangeText={(text) => dispatch({ type: 'SetName', name: text })}
              inputStyle={[t.textBase]}
            />
          </View>
          <View>
            <Text2
              weight="semibold"
              color="secondary"
              size="base"
              style={[t.pB2]}
            >
              Tell us a little more
            </Text2>
            <TextInputWithCounter
              autoCorrect={true}
              autoFocus={false}
              spellCheck={true}
              autoCapitalize="sentences"
              clearButtonMode="never"
              maxLength={250}
              multiline={true}
              numberOfLines={4}
              placeholder="Write a note"
              value={state.description || ''}
              onChangeText={(text) =>
                dispatch({ type: 'SetDescription', description: text })
              }
              inputStyle={[
                t.textBase,
                {
                  paddingTop: 16,
                  height: 120,
                  maxHeight: 120,
                },
              ]}
            />
          </View>
          <View>
            <Text2
              weight="semibold"
              color="secondary"
              size="base"
              style={[t.pB2]}
            >
              Select a category (optional)
            </Text2>
            <Pressable
              style={[
                t.border,
                t.borderDefault,
                t.roundedLg,
                t.pB3,
                t.pT3,
                t.pX3,
              ]}
              onPress={onCategorySelectPress}
            >
              <Text2
                color={state.labels.length === 0 ? 'tertiary' : 'primary'}
                size="base"
              >
                {state.labels[0] || 'Select an option'}
              </Text2>
            </Pressable>
          </View>
        </View>
      </View>
      {showCategoriesModal && (
        <StarterPackCategoriesModal onDismiss={onCategoriesModalDismiss} />
      )}
    </>
  );
}

function CreateStarterPacksSearchUsers() {
  const t = useTheme();

  const [, dispatch] = useStarterPacksSetupSteps();

  const { setOptions } = useNavigation();

  const updateHeaderOptions = useUpdateHeaderOptions();

  const onBackPress = React.useCallback(() => {
    dispatch({ type: 'Back' });
  }, [dispatch]);

  React.useLayoutEffect(() => {
    updateHeaderOptions({
      onBackPress: onBackPress,
    });

    return () => {
      updateHeaderOptions({
        onBackPress: undefined,
      });
    };
  }, [onBackPress, setOptions, updateHeaderOptions]);

  const [searchQuery, setSearchQuery] = React.useState<string>('');

  return (
    <>
      <View style={[t.pX4]}>
        <SearchInput
          align="left"
          onChangeText={(text) => setSearchQuery(text)}
          value={searchQuery}
          placeholder="Search"
          autoCorrect={false}
          width="100%"
          autoCapitalize="none"
        />
      </View>
      <React.Suspense
        fallback={
          <View style={[t.flex1]}>
            <LoadingIndicator size="small" style={[t.mT4]} />
          </View>
        }
      >
        <StarterPackMultipleSelectList searchQuery={searchQuery} />
      </React.Suspense>
    </>
  );
}

const FlatList = Animated.FlatList;

function StarterPackMultipleSelectList({
  searchQuery,
}: {
  searchQuery: string;
}) {
  const t = useTheme();

  const [state, dispatch] = useStarterPacksSetupSteps();

  const { data, fetchNextPage } = useSearchUsersForStarterPacks({
    search: searchQuery,
  });

  const users = React.useMemo(() => {
    return uniqBy(
      data.pages.flatMap((p) => p.result.users),
      (o) => o.fid,
    );
  }, [data.pages]);

  const selectedUsersFids = React.useMemo(() => {
    return state.users.map(({ fid }) => fid);
  }, [state.users]);

  const onUserPress = React.useCallback(
    ({ isSelected, item }: { isSelected: boolean; item: ApiUser }) => {
      if (isSelected) {
        dispatch({ type: 'RemoveUser', fid: item.fid });
      } else {
        dispatch({ type: 'AddUser', user: item });
      }
    },
    [dispatch],
  );

  const renderItem = React.useCallback(
    ({ item }: { item: ApiUser; index: number }) => {
      const isSelected = selectedUsersFids.indexOf(item.fid) !== -1;

      const onPress = () => {
        onUserPress({ isSelected, item });
      };

      return (
        <Pressable style={[]} onPress={onPress}>
          <View
            style={[
              t.pX4,
              t.flexRow,
              t.justifyBetween,
              t.itemsCenter,
              t.borderBHairline,
              t.borderDefault,
            ]}
          >
            <View style={[t.flexRow, t.itemsCenter, t.pY2]}>
              <Avatar pfpUrl={item.pfp?.url} diameter={36} style={[t.mX2]} />
              <UserDisplayNameUsername
                user={item}
                style="base"
                onUserPressCallback={onPress}
              />
            </View>
            <View style={[t.pX2, t.pY1, t.flex0]}>
              <View
                style={[
                  isSelected ? t.bgActionPrimary : t.bgHover,
                  { height: 24, width: 24 },
                  t.flex,
                  t.itemsCenter,
                  t.justifyCenter,
                  t.roundedLg,
                ]}
              >
                {isSelected && (
                  <Octicons
                    name="check"
                    size={16}
                    color={t.colors.text.light}
                  />
                )}
              </View>
            </View>
          </View>
        </Pressable>
      );
    },
    [
      onUserPress,
      selectedUsersFids,
      t.bgActionPrimary,
      t.bgHover,
      t.borderBHairline,
      t.borderDefault,
      t.colors.text.light,
      t.flex,
      t.flex0,
      t.flexRow,
      t.itemsCenter,
      t.justifyBetween,
      t.justifyCenter,
      t.mX2,
      t.pX2,
      t.pX4,
      t.pY1,
      t.pY2,
      t.roundedLg,
    ],
  );

  const onEndReached = React.useCallback(() => {
    fetchNextPage();
  }, [fetchNextPage]);

  return (
    <View
      style={[t.flex1, t.pB4, t.pT2, t.borderTHairline, t.borderDefault, t.mT4]}
    >
      <FlatList
        scrollIndicatorInsets={{ right: 1 }}
        keyExtractor={searchedUsersKeyExtractor}
        data={users}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={1}
        windowSize={11}
        keyboardShouldPersistTaps="always"
      />
    </View>
  );
}

const searchedUsersKeyExtractor = (item: ApiUser) => `${item.fid}`;

export { CreateStarterPackScreen };
