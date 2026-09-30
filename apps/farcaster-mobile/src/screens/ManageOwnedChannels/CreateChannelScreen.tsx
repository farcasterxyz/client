import { Octicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getNotionLinkTarget,
  useChannelCreationInfo,
  useDebouncedValue,
  useValidateNewChannelKey,
} from 'farcaster-client-hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  Linking,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { TextInput } from '~/components/TextInput/TextInput';
import { TextWithPress } from '~/components/TextWithPress';
import { hitSlop } from '~/constants/Pressable';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

const NewChannelHero = require('~/assets/images/NewChannelHero.webp');
export const CHANNEL_KEY_VALIDATION_REGEX = /^[0-9a-z][0-9a-z-]{0,15}$/;

const INVALID_NAME_ERROR_MSG = 'Use only a-z, 0-9, and dashes (not at start)';

type CreateChannelScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'CreateChannel'
>;

const CreateChannelScreen = buildScreen<CreateChannelScreenProps>(
  { name: 'CreateChannel', insetTop: false, avoidKeyboard: true },
  () => {
    const t = useTheme();

    const [key, setKey] = useState('');
    const [serverValidationError, setServerValidationError] = useState('');
    const [localValidationError, setLocalValidationError] = useState('');

    const debouncedKey = useDebouncedValue({
      value: key,
      debounceDuration: 300,
    });

    const { data: channelCreationInfo } = useChannelCreationInfo();

    const { width: windowWidth } = useWindowDimensions();
    const { width: heroWidth, height: heroHeight } =
      Image.resolveAssetSource(NewChannelHero);
    const heroRenderHeight = windowWidth * (heroHeight / heroWidth);

    // Validate locally
    useEffect(() => {
      if (key && !CHANNEL_KEY_VALIDATION_REGEX.test(key)) {
        setLocalValidationError(INVALID_NAME_ERROR_MSG);
      } else {
        setLocalValidationError('');
      }
    }, [key]);

    // Validate server-side
    const validateNewChannelKey = useValidateNewChannelKey();
    useEffect(() => {
      if (debouncedKey) {
        (async () => {
          const result = await validateNewChannelKey({
            channelKey: debouncedKey,
          });

          if (!result.valid) {
            setServerValidationError(INVALID_NAME_ERROR_MSG);
          } else if (!result.available) {
            setServerValidationError(
              `Channel name ${debouncedKey} is not available`,
            );
          } else {
            setServerValidationError('');
          }
        })();
      } else {
        setServerValidationError('');
      }
    }, [debouncedKey, validateNewChannelKey]);

    const keyValid = useMemo(
      // Only valid if we've checked the key the user is seeing
      () =>
        key.length > 0 &&
        key === debouncedKey &&
        !localValidationError &&
        !serverValidationError,
      [debouncedKey, key, localValidationError, serverValidationError],
    );

    const openWebToCreateChannel = useCallback(() => {
      // Channel creation requires USDC payment, which is only available on web
      Linking.openURL('https://warpcast.com/~/settings/channels/new');
    }, []);

    const disabled = useMemo(() => {
      return !channelCreationInfo?.channelCreationPossible || !keyValid;
    }, [channelCreationInfo, keyValid]);

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={[t.hFull, t.borderDefault, t.borderTHairline]}>
          <Image
            source={NewChannelHero}
            style={[t.absolute, t.wFull, { top: 16, height: heroRenderHeight }]}
            resizeMode={'cover'}
          />
          <View style={[t.hFull, t.flexCol, t.justifyEnd, t.pB4, t.pX4]}>
            {/* Need this view so that scrolling is smooth when keyboard appears/disappears */}
            <View>
              <Text
                style={[
                  t.texts.primary,
                  t.fontSemibold,
                  { fontSize: 26, lineHeight: 36, marginTop: 50 },
                ]}
              >
                A home for your community
              </Text>
              <Text
                style={[
                  t.texts.primary,
                  t.mT2,
                  { fontSize: 15, lineHeight: 22 },
                ]}
              >
                Create a space on Farcaster where you can bring people with
                shared interests together.{' '}
                <TouchableOpacity
                  style={[{ paddingBottom: 2 }]}
                  hitSlop={hitSlop}
                  onPress={() => {
                    Linking.openURL(getNotionLinkTarget({ to: 'channels' }));
                  }}
                  activeOpacity={0.5}
                >
                  <Octicons
                    name="info"
                    size={14}
                    color={t.colors.text.tertiary}
                  />
                </TouchableOpacity>
              </Text>
              <Text
                style={[
                  t.texts.primary,
                  t.mT2,
                  { fontSize: 15, lineHeight: 22 },
                ]}
              >
                Channel names have a{' '}
                <TextWithPress
                  style={[t.texts.brand]}
                  onPress={() => {
                    Linking.openURL(
                      getNotionLinkTarget({ to: 'username-policy' }),
                    );
                  }}
                >
                  no squatting policy
                </TextWithPress>
                .
              </Text>
            </View>
            {channelCreationInfo &&
              channelCreationInfo.channelCreationPossible && (
                <View style={[]}>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={false}
                    clearButtonMode="never"
                    editable={true}
                    keyboardType="default"
                    placeholder="Choose a name"
                    selectTextOnFocus={false}
                    spellCheck={false}
                    maxLength={16}
                    inputStyle={[
                      t.border,
                      t.textBase,
                      t.texts.primary,
                      t.p2,
                      t.borderDefault,
                      t.borderHairline,
                      t.borderBHairline,
                      t.mT4,
                    ]}
                    onChangeText={(text) => {
                      setKey(text.toLowerCase());
                    }}
                    value={key}
                  />
                  <Text style={[t.textSm, t.texts.secondary, t.mT2]}>
                    You can't change this later
                  </Text>
                  <Text style={[t.mT1, t.texts.danger]}>
                    {serverValidationError || localValidationError}&nbsp;
                  </Text>
                </View>
              )}
            {channelCreationInfo &&
              !channelCreationInfo.channelCreationPossible &&
              channelCreationInfo.infoMessage && (
                <Text style={[t.mT6, t.mB4, t.textBase, t.texts.danger]}>
                  {channelCreationInfo.infoMessage}
                </Text>
              )}
            {channelCreationInfo && channelCreationInfo.usdcCost && (
              <>
                <View style={[t.pT2]}>
                  <TouchableOpacity
                    style={[
                      { backgroundColor: t.colors.text.brand },
                      t.rounded,
                      t.p4,
                      t.itemsCenter,
                      t.justifyCenter,
                      disabled && t.opacity50,
                    ]}
                    onPress={openWebToCreateChannel}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Text style={[t.texts.light, t.textLg, t.fontSemibold]}>
                      Create on Web (${channelCreationInfo.usdcCost} USDC)
                    </Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    t.mT2,
                    t.flexRow,
                    t.itemsCenter,
                    t.justifyCenter,
                    t.p3,
                  ]}
                >
                  <Text style={[t.texts.secondary, t.textCenter]}>
                    Channel creation requires USDC payment on{' '}
                    {channelCreationInfo.chain
                      ? channelCreationInfo.chain.charAt(0).toUpperCase() +
                        channelCreationInfo.chain.slice(1)
                      : 'Base'}
                    , which is only available on web.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  },
);

CreateChannelScreen.displayName = 'CreateChannelScreen';

export { CreateChannelScreen };
