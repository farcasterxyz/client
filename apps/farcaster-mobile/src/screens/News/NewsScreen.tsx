import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { buildScreen } from '~/components/Screen';
import { NewsStackParamList } from '~/types';

type NewsScreenProps = NativeStackScreenProps<NewsStackParamList, 'News'>;

const NewsScreen = buildScreen<NewsScreenProps>(
  { name: 'News', insetTop: true },
  () => {
    return null;
  },
);

NewsScreen.displayName = 'NewsScreen';

export { NewsScreen };
