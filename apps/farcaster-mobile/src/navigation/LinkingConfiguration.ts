import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootNativeStackParamList } from '~/types';

const prefix = Linking.createURL('/');

const LinkingConfiguration: LinkingOptions<RootNativeStackParamList> = {
  prefixes: [prefix],
  config: {
    screens: {},
  },
};

export { LinkingConfiguration };
