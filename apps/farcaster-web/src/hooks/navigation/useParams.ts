// eslint-disable-next-line no-restricted-imports
import { useParams as useParamsReactRouter } from 'react-router-dom';

import { RouteName, Routes } from '~/types';

const useParams = <Name extends RouteName>(
  _routname: Name,
): Routes[Name]['params'] => {
  return useParamsReactRouter();
};

export { useParams };
