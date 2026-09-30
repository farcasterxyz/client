import { appPathPrefix } from 'farcaster-web/src/constants/routePrefixes';
import React from 'react';

import { OGHead } from '~/components/meta/OGHead';
import { useRequest } from '~/contexts/RequestProvider';

type ReferralHeadProps = {
  fid: number;
  username: string;
};

const getUrl = ({ fid, host }: { fid: number; host: string | undefined }) => {
  const path = `${appPathPrefix}/referral/${fid}`;

  return `${host}${path}`;
};

export const ReferralHead: React.FC<ReferralHeadProps> = ({
  fid,
  username,
}) => {
  const { host } = useRequest();

  const url = React.useMemo(() => {
    return getUrl({ fid, host });
  }, [fid, host]);

  return (
    <OGHead
      title={`Join @${username} on Farcaster`}
      description={`Sign up with @${username}'s referral link. Get started on Farcaster — discover people, projects, and trade crypto.`}
      imageUrl={`https://client.farcaster.xyz/v2/og-image?referralFid=${fid}`}
      type="website"
      twitterCard="summary_large_image"
      url={url}
    />
  );
};
