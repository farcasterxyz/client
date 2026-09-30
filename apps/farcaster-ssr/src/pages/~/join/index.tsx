import { ApiInvite } from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { OGHead } from '~/components/meta/OGHead';
import { PaidInvite } from '~/components/paidInvites/PaidInvite';
import { defaultOGImagePath, defaultOGTitle } from '~/constants/og';
import { useRequest } from '~/contexts/RequestProvider';
import { apiClient } from '~/utils/ApiClient';
import { getImageUrl } from '~/utils/imageUtils';
import { getFallbackUrl } from '~/utils/urlUtils';

type PaidInvitePageProps = {
  invite: ApiInvite | null;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext,
): Promise<GetServerSidePropsResult<PaidInvitePageProps>> {
  const paidInviteCode = context.query.code;

  if (paidInviteCode && typeof paidInviteCode === 'string') {
    const {
      data: {
        result: { invite },
      },
    } = await apiClient.getInvite({ inviteCode: paidInviteCode });

    return {
      props: { invite },
    };
  }

  return { props: { invite: null } };
}

export default function PaidInvitePage({ invite }: PaidInvitePageProps) {
  const { host } = useRequest();

  if (!invite) {
    return (
      <>
        <OGHead
          description="Invalid invite"
          imageUrl={getImageUrl({ path: defaultOGImagePath, host })}
          title={defaultOGTitle}
          type="website"
          url={getFallbackUrl({ host })}
        />
        <div>Invalid invite</div>
      </>
    );
  } else {
    return <PaidInvite invite={invite} />;
  }
}
