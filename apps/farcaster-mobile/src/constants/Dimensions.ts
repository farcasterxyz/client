import { Dimensions } from 'react-native';

import { defaultThumbnailDiameter } from './Images';

export const searchWidth =
  Dimensions.get('window').width - defaultThumbnailDiameter * 2 - 60;
