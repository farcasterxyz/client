import { ApiCast, ApiUser } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { ProfileCasts } from '~/components/profiles/casts/ProfileCasts';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { getHost } from '~/utils/requestUtils';

type ProfileCastsParams = {
  fid: string;
};

type ProfileCastsProps = {
  casts: ApiCast[];
  host: string | undefined;
  user: ApiUser;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<ProfileCastsParams>,
): Promise<GetServerSidePropsResult<ProfileCastsProps>> {
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

export default function ProfileCastsPage({ casts, user }: ProfileCastsProps) {
  return <ProfileCasts casts={casts} user={user} />;
}
