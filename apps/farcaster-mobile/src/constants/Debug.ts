import { isDev } from './Env';

const getDebugValue = ({
  dev,
  prod,
}: {
  dev: boolean;
  prod: boolean;
}): boolean => {
  return isDev ? dev : prod;
};

export const debugSuspenseEnabled = getDebugValue({ dev: false, prod: false });
export const debugLoadingIndicatorsEnabled = getDebugValue({
  dev: false,
  prod: false,
});
