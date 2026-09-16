import {
  ApiFrame,
  ApiFrameEmbedNextExtended,
  getMiniAppCanonicalUrl,
} from 'farcaster-client-data';
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { apiClient } from '~/utils/ApiClient';

type FramePageParams = {
  domain: string;
};

type FramePageProps = {
  frame: ApiFrame | null;
  embed: ApiFrameEmbedNextExtended | null;
};

export async function getServerSideProps(
  context: GetServerSidePropsContext<FramePageParams>,
): Promise<GetServerSidePropsResult<FramePageProps>> {
  const domain = (context.query?.domain || '') as string;

  const {
    data: {
      result: { frame },
    },
  } = await apiClient.getFrameDetails({ domain });

  if (!frame) {
    return {
      redirect: {
        destination: '/miniapps',
        permanent: false,
      },
    };
  }

  const url = getMiniAppCanonicalUrl({ frame, forceId: true });
  const urlObject = new URL(url);
  return {
    redirect: {
      destination: urlObject.pathname,
      permanent: true,
    },
  };
}

export default function FramePage() {}
