import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Collectible } from 'farcaster-expo';
import React from 'react';
import { Platform, View } from 'react-native';

import { AppBackButton } from '~/components/AppBackButton';
import { buildScreen } from '~/components/Screen';
import { Text2 } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useGoBack } from '~/hooks/navigation/useGoBack';
import { CommonStackParamList } from '~/types';

type CollectibleScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'Collectible'
>;

const CollectibleScreen = buildScreen<CollectibleScreenProps>(
  { name: 'Collectible', insetTop: Platform.OS === 'android' },
  ({ route }) => {
    const { data } = route.params;
    const t = useTheme();
    const navigation = useNavigation();
    const goBack = useGoBack();

    const onHeaderBackPress = React.useCallback(() => {
      goBack();
    }, [goBack]);

    const headerLeft = React.useMemo(() => {
      return (
        <View style={[t.flex, t.flexRow, t.itemsCenter, t._mL2, t.pR8]}>
          <AppBackButton onPress={onHeaderBackPress} />
          <View style={[t.flex, t.flexRow, t.itemsCenter, t.mL1, t.flexShrink]}>
            <Text2
              style={[t.texts.primary, t.textLg, t.fontSemibold]}
              numberOfLines={1}
            >
              {data.name}
            </Text2>
          </View>
        </View>
      );
    }, [
      onHeaderBackPress,
      t._mL2,
      t.flex,
      t.flexRow,
      t.fontSemibold,
      t.itemsCenter,
      t.mL1,
      t.pR8,
      t.texts.primary,
      t.textLg,
      t.flexShrink,
      data.name,
    ]);

    React.useEffect(() => {
      navigation.setOptions({
        headerLeft: () => headerLeft,
      });
    }, [headerLeft, data.name, navigation]);

    return <Collectible data={data} />;
  },
);

CollectibleScreen.displayName = 'CollectibleScreen';

export { CollectibleScreen };
