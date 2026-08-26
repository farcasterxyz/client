import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ApiProfileToken,
  ApiTokenLink,
  buildCaip19TokenUri,
} from 'farcaster-client-data';
import { ExploreTokens, useTheme } from 'farcaster-expo';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { CommonStackParamList } from '~/types';

type EditProfileTokenScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'EditProfileToken'
>;

export const EditProfileTokenScreen = buildScreen<EditProfileTokenScreenProps>(
  { name: 'EditProfileToken', insetTop: Platform.OS === 'android' },
  ({ route }) => {
    const goBack = useGoBack();
    const t = useTheme();
    const { onTokenSelected } = route.params;

    const handleSelectToken = useCallback(
      (token: ApiTokenLink) => {
        const profileToken: ApiProfileToken = {
          tokenUri: buildCaip19TokenUri(token.chain, token.ca),
          token: {
            name: token.name,
            ticker: token.ticker,
            imageUrl: token.imageUrl,
            chain: token.chain,
            ca: token.ca,
          },
        };

        onTokenSelected(profileToken);
        goBack();
      },
      [onTokenSelected, goBack],
    );

    const handleRemoveToken = useCallback(() => {
      const emptyProfileToken: ApiProfileToken = {
        tokenUri: '',
        token: undefined,
      };
      onTokenSelected(emptyProfileToken);
      goBack();
    }, [onTokenSelected, goBack]);

    return (
      <>
        <View
          style={[
            t.flexRow,
            t.itemsCenter,
            t.justifyBetween,
            t.pX3,
            t.pT5,
            t.pB4,
          ]}
        >
          <View style={{ width: 40 }}>
            <TouchableOpacity onPress={goBack}>
              <ChevronLeft size={24} color={t.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={[t.flex1, t.itemsCenter]}>
            <Text2 size="lg" weight="semibold">
              Profile Token
            </Text2>
          </View>

          <View style={[t.itemsEnd]}>
            <TouchableOpacity onPress={handleRemoveToken}>
              <Text2 size="base" weight="semibold" color="danger">
                Remove
              </Text2>
            </TouchableOpacity>
          </View>
        </View>

        <ExploreTokens
          onSelectToken={handleSelectToken}
          variant="explore"
          hideHeader
        />
      </>
    );
  },
);
