import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AnalyticsEvent } from 'farcaster-analytics';
import {
  useAddMuteKeyword,
  useMutedKeyword,
  useMutedKeywords,
} from 'farcaster-client-hooks';
import { useRootToast } from 'farcaster-expo';
import React from 'react';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { ButtonV2 } from '~/components/ButtonV2';
import { buildScreen } from '~/components/Screen';
import { Switch } from '~/components/Switch';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useTheme } from '~/contexts/ThemeProvider';
import { usePop } from '~/hooks/navigation/usePop';
import { CommonStackParamList } from '~/types';
import { trackError } from '~/utils/ErrorUtils';

type KeywordReducerAction =
  | { type: 'ApplyToFrames'; apply: boolean }
  | { type: 'ApplyToChannels'; apply: boolean }
  | { type: 'ApplyToNotifications'; apply: boolean };

interface KeywordReducerState {
  applyToFrames: boolean;
  applyToChannels: boolean;
  applyToNotifications: boolean;
}

function keywordReducer(
  state: KeywordReducerState,
  action: KeywordReducerAction,
): KeywordReducerState {
  let updatedState = state;

  switch (action.type) {
    case 'ApplyToChannels':
      updatedState = { ...state, applyToChannels: action.apply };
      break;
    case 'ApplyToFrames':
      updatedState = { ...state, applyToFrames: action.apply };
      break;
    case 'ApplyToNotifications':
      updatedState = { ...state, applyToNotifications: action.apply };
      break;
  }

  return updatedState;
}

type MutedKeywordScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'MutedKeyword'
>;

const MutedKeywordScreen = buildScreen<MutedKeywordScreenProps>(
  {
    name: 'MutedKeyword',
    avoidKeyboard: false,
    insetBottom: true,
  },
  ({
    route: {
      params: { keyword },
    },
  }) => {
    const t = useTheme();
    const { trackEvent } = useAnalytics();
    const toast = useRootToast();

    const addKeyword = useAddMuteKeyword();

    const { data: keywordsData } = useMutedKeywords();

    const { data } = useMutedKeyword({ keyword });

    const existingMutedKeyword = React.useMemo(() => {
      if (typeof data === 'undefined' || typeof keyword === 'undefined') {
        return undefined;
      }

      return data.mutedKeyword;
    }, [data, keyword]);

    const existingMutedKeywords = React.useMemo(() => {
      return keywordsData.result.keywords;
    }, [keywordsData.result.keywords]);

    const pop = usePop();

    const [isAdding, setIsAdding] = React.useState<boolean>(false);

    const keywordPropertiesReducer = React.useReducer(keywordReducer, {
      applyToFrames: true,
      applyToChannels: false,
      applyToNotifications: false,
    });

    const [state, dispatch] = keywordPropertiesReducer;

    React.useEffect(() => {
      if (existingMutedKeyword) {
        dispatch({
          type: 'ApplyToFrames',
          apply: existingMutedKeyword.properties.frames,
        });
        dispatch({
          type: 'ApplyToChannels',
          apply: existingMutedKeyword.properties.channels,
        });
        dispatch({
          type: 'ApplyToNotifications',
          apply: existingMutedKeyword.properties.notifications,
        });
      }
    }, [dispatch, existingMutedKeyword]);

    const [newKeywordValue, setNewKeywordValue] = React.useState<string>(
      keyword || '',
    );

    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(
      undefined,
    );

    const onSetNewKeywordValue = React.useCallback(
      (value: string) => {
        setErrorMessage(undefined);

        setNewKeywordValue(value);

        if (existingMutedKeywords.includes(value)) {
          setErrorMessage('This keyword has already been muted.');
        }
      },
      [existingMutedKeywords],
    );

    const onAddKeyword = React.useCallback(async () => {
      if (!newKeywordValue) {
        return;
      }

      setIsAdding(true);
      try {
        addKeyword({
          keyword: newKeywordValue,
          properties: {
            channels: state.applyToChannels,
            frames: state.applyToFrames,
            notifications: state.applyToNotifications,
          },
        });

        setIsAdding(false);
        setErrorMessage(undefined);
        toast.show(`${newKeywordValue} muted`, { placement: 'bottom' });
        trackEvent(AnalyticsEvent.MuteKeyword, {
          newKeywordValue,
        });
        setNewKeywordValue('');

        pop();
      } catch (error) {
        setErrorMessage(`Error: unable to mute ${newKeywordValue}`);
        setIsAdding(false);
        trackError(error);
        return;
      }
    }, [addKeyword, state, newKeywordValue, toast, trackEvent, pop]);

    return (
      <View style={[t.hFull, t.flex]}>
        <KeyboardAwareScrollView
          style={[t.flex1, t.hFull]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              t.flex1,
              t.flexCol,
              t.hFull,
              t.p4,
              t.borderTHairline,
              t.borderDefault,
            ]}
          >
            <View
              style={[
                t.flex,
                t.flexCol,
                typeof keyword !== 'undefined' && t.opacity50,
              ]}
            >
              <Text
                style={[t.texts.primary, t.fontSemibold, t.textBase, t.mB4]}
              >
                Muted word
              </Text>
              <View style={[t.flex, t.flexRow, t.mB2, t.itemsCenter]}>
                <View style={[t.flex1]}>
                  <TextInput
                    autoCapitalize="none"
                    autoFocus={false}
                    clearButtonMode="never"
                    keyboardType="default"
                    selectTextOnFocus={false}
                    spellCheck={true}
                    multiline={true}
                    numberOfLines={1}
                    placeholder="Enter word or phrase..."
                    maxLength={256}
                    inputStyle={[
                      t.flex,
                      t.border,
                      t.p2,
                      t.pT3,
                      t.mR2,
                      t.pY3,
                      t.textBase,
                      t.borderHairline,
                      t.borderBHairline,
                      { textAlignVertical: 'center' },
                    ]}
                    onChangeText={(text) => {
                      onSetNewKeywordValue(text);
                    }}
                    value={newKeywordValue}
                    editable={typeof keyword === 'undefined'}
                  />
                </View>
              </View>
              {typeof errorMessage !== 'undefined' && (
                <View style={[t.flex, t.flexRow, t.h12, t.mY2, t.itemsCenter]}>
                  <Text style={[t.texts.danger]}>{errorMessage}</Text>
                </View>
              )}
            </View>
            <MutedKeywordProperties
              keywordPropertiesReducer={keywordPropertiesReducer}
            />
          </View>
        </KeyboardAwareScrollView>
        <View style={[t.flex, t.mX4]}>
          <ButtonV2
            title={typeof keyword === 'undefined' ? 'Mute' : 'Save'}
            disabled={isAdding || !!errorMessage}
            onPress={onAddKeyword}
          />
        </View>
      </View>
    );
  },
);
MutedKeywordScreen.displayName = 'MutedKeywordScreen';

function MutedKeywordProperties({
  keywordPropertiesReducer,
}: {
  keywordPropertiesReducer: [
    KeywordReducerState,
    React.Dispatch<KeywordReducerAction>,
  ];
}) {
  const t = useTheme();

  const { trackEvent } = useAnalytics();

  const [state, dispatch] = keywordPropertiesReducer;

  const onApplyToFramesChange = React.useCallback(
    (value: boolean) => {
      if (value) {
        trackEvent(AnalyticsEvent.ApplyMutedWordToFrames, {});
      }

      dispatch({
        type: 'ApplyToFrames',
        apply: value,
      });
    },
    [dispatch, trackEvent],
  );

  const onApplyToChannelsChange = React.useCallback(
    (value: boolean) => {
      if (value) {
        trackEvent(AnalyticsEvent.ApplyMutedWordToChannels, {});
      }

      dispatch({
        type: 'ApplyToChannels',
        apply: value,
      });
    },
    [dispatch, trackEvent],
  );

  return (
    <View style={[t.flex, t.flexCol, t.mY3]}>
      <Text style={[t.texts.primary, t.fontSemibold, t.textBase, t.mB4]}>
        Apply mute to
      </Text>
      <View style={[t.flex, t.flexCol, { gap: 12 }]}>
        <View
          style={[t.flex, t.flexRow, t.wFull, t.itemsCenter, t.justifyBetween]}
        >
          <View style={[t.flexCol, t.flex1, t.mR4]}>
            <Text style={[t.texts.primary, t.textBase]}>Mini Apps</Text>
            <Text style={[t.pT1, t.texts.secondary, t.textSm]}>
              Casts with mini app URLs matching won't appear in your home feed.
            </Text>
          </View>
          <Switch
            value={state.applyToFrames}
            onValueChange={onApplyToFramesChange}
            newColors={true}
          />
        </View>
        <View
          style={[t.flex, t.flexRow, t.wFull, t.itemsCenter, t.justifyBetween]}
        >
          <View style={[t.flexCol, t.flex1, t.mR4]}>
            <Text style={[t.texts.primary, t.textBase]}>Channels</Text>
            <Text style={[t.pT1, t.texts.secondary, t.textSm]}>
              Casts with channel names matching won't appear in your home feed.
            </Text>
          </View>
          <Switch
            value={state.applyToChannels}
            onValueChange={onApplyToChannelsChange}
            newColors={true}
          />
        </View>
      </View>
    </View>
  );
}

export { MutedKeywordScreen };
