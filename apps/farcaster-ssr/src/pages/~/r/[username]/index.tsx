import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import React from 'react';

import { ReferralCodeHead } from '~/components/referralCode';
import { apiClient } from '~/utils/ApiClient';

type PageParams = {
  username: string;
};

type ReferralCodePageProps = {
  username: string;
  code: string;
};

function ReferralCodeContent({ username, code }: ReferralCodePageProps) {
  return <ReferralCodeHead username={username} code={code} />;
}

export async function getServerSideProps(
  context: GetServerSidePropsContext<PageParams>,
): Promise<GetServerSidePropsResult<ReferralCodePageProps>> {
  const username = context.params?.username || '';

  if (!username) {
    return {
      notFound: true,
    };
  }

  try {
    const {
      data: {
        result: { creator, referralCode },
      },
    } = await apiClient.getReferralCodeByUsername({ username });

    return {
      props: {
        username: creator.username || creator.fid.toString(),
        code: referralCode,
      },
    };
  } catch (e) {
    return {
      notFound: true,
    };
  }
}

export default function ReferralCodePage(props: ReferralCodePageProps) {
  return <ReferralCodeContent username={props.username} code={props.code} />;
}
