import { ApiCast, ApiUser } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { ProfileCastsAndReplies } from '~/components/profiles/castsAndReplies/ProfileCastsAndReplies';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { getHost } from '~/utils/requestUtils';

type ProfileCastsAndRepliesParams = {
  fid: string;
};

type ProfileCastsAndRepliesProps = {
  casts: ApiCast[];
  host: string | undefined;
  user: ApiUser;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ProfileCastsAndRepliesParams>,
): Promise<GetServerSidePropsResult<ProfileCastsAndRepliesProps>> {
  const host = getHost(context);
  const fid = Number(context.params?.fid);

  try {
    const user = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getUserByFIDForOG({ fid });
      return result;
    });

    return {
      props: { casts: [], host, user },
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
