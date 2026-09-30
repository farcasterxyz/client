import { FC } from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { defaultOGImagePath } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { getImageUrl } from '~/utils/imageUtils';

const CoinbaseWalletQuest: FC = () => {
  const { host } = useRequest();

  return (
    <>
      <OGHead
        description={'Connect and enter your email to get started'}
        imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
        title={'Coinbase Wallet Quest'}
        type="website"
        url={'https://farcaster.xyz/~/register/cbw'}
      />
      <div>Coinbase Wallet x Farcaster</div>
    </>
  );
};

CoinbaseWalletQuest.displayName = 'CoinbaseWalletQuest';

export { CoinbaseWalletQuest };
