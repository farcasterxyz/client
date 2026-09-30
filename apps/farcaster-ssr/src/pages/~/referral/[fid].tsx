import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import React from 'react';

import { ReferralHead } from '~/components/referral';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type PageParams = {
  fid: string;
};

type ReferralProps = {
  fid: number;
  username: string;
};

const ReferralLink: React.FC<ReferralProps> = ({ fid, username }) => {
  return (
    <>
      <ReferralHead fid={fid} username={username} />
      <div>{fid}</div>
    </>
  );
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<PageParams>,
): Promise<GetServerSidePropsResult<ReferralProps>> {
  const fid = Number(context.params?.fid);

  try {
    const user = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByFIDForOG({ fid });
      return result;
    });

    return {
      props: {
        fid,
        username: user.username || fid.toString(),
      },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ReferralPage({ fid, username }: ReferralProps) {
  return <ReferralLink fid={fid} username={username} />;
}
