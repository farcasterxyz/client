import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { DirectCastGroupInvite } from '~/components/directCasts/DirectCastGroupInvite';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';

type InviteCodePageParams = {
  inviteCode: string;
};

type InviteCodePageProps = {
  result: {
    conversationId: string;
    name: string;
    photoUrl?: string;
    participantCount: number;
    expired: boolean;
    inviteCode: string;
    meetsCriteria?: {
      followers?: boolean;
      hasActiveBadge?: boolean;
      hasCollectionIds?: boolean;
    };
    criteria?: {
      followers?: 'everyone' | 'follows';
      hasActiveBadge?: boolean;
      hasCollectionIds?: string[];
    };
  };
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<InviteCodePageParams>,
): Promise<GetServerSidePropsResult<InviteCodePageProps>> {
  const inviteCode = context.params?.inviteCode || '';

  try {
    const result = await fetchAndHandleError(async () => {
      const {
        data: { result },
      } = await apiClient.getDirectCastGroupInviteV3({ inviteCode });
      return result;
    });

    return {
      props: { result },
    };
  } catch (error) {
    if (error instanceof HttpError) {
      context.res.statusCode = error.statusCode;
      return { notFound: true };
    }
    throw error;
  }
}

export default function InviteCodePage({ result }: InviteCodePageProps) {
  return <DirectCastGroupInvite result={result} />;
}
