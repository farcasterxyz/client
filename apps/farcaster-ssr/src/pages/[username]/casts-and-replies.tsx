import { ApiCast, ApiUser } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { ProfileCastsAndReplies } from '~/components/profiles/castsAndReplies/ProfileCastsAndReplies';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type ProfileCastsAndRepliesParams = {
  username: string;
};

type ProfileCastsAndRepliesProps = {
  casts: ApiCast[];
  user: ApiUser;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ProfileCastsAndRepliesParams>,
): Promise<GetServerSidePropsResult<ProfileCastsAndRepliesProps>> {
  const username = context.params?.username || '';

  try {
    const user = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByUsernameForOG({
        username,
        scope: 'pages.castsAndReplies',
        userAgent: context.req.headers['user-agent'],
      });
      return result;
    });

    return {
      props: { casts: [], user },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function ProfileCastsAndRepliesPage({
  casts,
  user,
}: ProfileCastsAndRepliesProps) {
  return <ProfileCastsAndReplies casts={casts} user={user} />;
}
