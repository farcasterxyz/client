import { WALLET_PREFETCH_CONFIG } from 'farcaster-expo';

import { FullParamList, ScreenName } from './types';
import { prefetchTokenInfo } from './utils/wallet/prefetchTokenInfo';

type PrefetchRegistry = Readonly<{
  [key in ScreenName]?: (...args: [FullParamList[key]]) => void;
}>;

export const prefetchRegistry: PrefetchRegistry = {
  ['Token']: ({ ca, chain }) => {
    if (!WALLET_PREFETCH_CONFIG.PREFETCH_ON_VIEW_TOKEN) {
      return;
    }
    prefetchTokenInfo({ ca, chain });
  },
};
