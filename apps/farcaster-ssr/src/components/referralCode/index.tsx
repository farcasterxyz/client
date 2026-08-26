import React from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';

type ReferralHeadProps = {
  username: string;
  code: string;
};

const getUrl = ({ code, host }: { code: string; host: string | undefined }) => {
  const path = `/~/code/${code}`;

  return `${host}${path}`;
};

export const ReferralCodeHead: React.FC<ReferralHeadProps> = ({
  code,
  username,
}) => {
  const { host } = useRequest();

  const url = React.useMemo(() => {
    return getUrl({ code, host });
  }, [code, host]);

  return (
    <OGHead
      title={`Join ${username} on Farcaster`}
      description={`Use this referral code to join Farcaster and get 20% off swap fees. Start trading crypto on the social network.`}
      imageUrl={`https://client.farcaster.xyz/v2/og-image?referralCode=${code}`}
      type="website"
      twitterCard="summary_large_image"
      url={url}
    />
  );
};
