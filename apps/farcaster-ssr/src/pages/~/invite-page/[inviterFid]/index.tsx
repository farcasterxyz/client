import { ApiUser } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { useRouter } from 'next/router';

import { Invite } from '~/components/invites/Invite';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { getHost } from '~/utils/requestUtils';

type InvitePageParams = {
  inviterFid: string;
};

type InvitePageProps = {
  inviter: ApiUser;
  host: string | undefined;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<InvitePageParams>,
): Promise<GetServerSidePropsResult<InvitePageProps>> {
  const host = getHost(context);
  const fidString = context.params?.inviterFid || '0';
  const fid = Number(fidString);

  try {
    const inviter = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByFIDForOG({ fid });
      return result;
    });

    return {
      props: { inviter, host },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function InvitePage({ inviter }: InvitePageProps) {
  const router = useRouter();
  return (
    <Invite inviteId={router.query.id?.toString() ?? ''} inviter={inviter} />
  );
}
