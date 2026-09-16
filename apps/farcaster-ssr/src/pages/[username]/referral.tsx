import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { ReferralHead } from '~/components/referral';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type ReferralPageParams = {
  username: string;
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
  context: GetServerSidePropsContext<ReferralPageParams>,
): Promise<GetServerSidePropsResult<ReferralProps>> {
  const username = context.params?.username || '';

  try {
    const user = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByUsernameForOG({
        username,
        scope: 'pages.referral',
        userAgent: context.req.headers['user-agent'],
      });
      return result;
    });

    return {
      props: {
        fid: user.fid,
        username: user.username || user.fid.toString(),
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

export default function ProfileReferralsPage(props: ReferralProps) {
  return <ReferralLink fid={props.fid} username={props.username} />;
}
