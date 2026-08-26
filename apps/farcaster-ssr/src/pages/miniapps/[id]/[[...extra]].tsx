import {
  addPathToUrl,
  ApiFrame,
  ApiFrameEmbedNextExtended,
  ApiOpenGraphMetadata,
  injectQueryParams,
} from 'farcaster-client-data';
import { GetServerSidePropsContext } from 'next';

import { OGHead } from '~/components/meta/OGHead';
import { SoftwareApplicationSchemaHead } from '~/components/meta/SoftwareApplicationSchemaHead';
import { MiniApp } from '~/components/miniapps/Miniapp';
import { apiClient } from '~/utils/ApiClient';
import { fetchAndHandleError, HttpError } from '~/utils/fetchUtils';
import { cleanImageUrl, getMiniappMetadata } from '~/utils/miniappUtils';

type MiniappPageProps = {
  frame: ApiFrame;
  embed: ApiFrameEmbedNextExtended | null;
  ogMetadata: ApiOpenGraphMetadata | null;
  path: string | null;
  params: string | null;
};

export default function MiniappPage({
  frame,
  embed,
  ogMetadata,
  path,
  params,
}: MiniappPageProps) {
  if (!frame) {
    return null;
  }
  const metadata = getMiniappMetadata({ frame, embed, ogMetadata });

  if (!metadata) {
    return null;
  }

  const castEmbed = embed?.frameEmbed ?? {
    version: 'next',
    imageUrl: metadata.imageUrl,
    button: {
      title: 'Open',
      action: {
        type: 'launch_frame',
        name: frame.name,
        url: addPathToUrl(
          injectQueryParams(frame.homeUrl, params ?? {}),
          path ?? '',
        ),
        splashImageUrl: frame.splashImageUrl,
        splashBackgroundColor: frame.splashBackgroundColor,
      },
    },
  };

  if (castEmbed.imageUrl) {
    castEmbed.imageUrl = cleanImageUrl(castEmbed.imageUrl);
  }
  if (
    (castEmbed.button?.action?.type === 'launch_frame' ||
      castEmbed.button?.action?.type === 'launch_miniapp') &&
    castEmbed.button.action.splashImageUrl
  ) {
    castEmbed.button.action.splashImageUrl = cleanImageUrl(
      castEmbed.button.action.splashImageUrl,
    );
  }

  return (
    <>
      <OGHead
        imageWidth={1200}
        imageHeight={630}
        description={frame.description || metadata.pageDescription}
        imageUrl={metadata.imageUrl}
        twitterCard={metadata.twitterCard}
        title={`${frame.name} on Farcaster`}
        ogTitle={metadata.ogTitle}
        ogDescription={metadata.ogDescription}
        type="website"
        url={metadata.url}
        extras={[
          {
            property: 'fc:frame',
            content: JSON.stringify(castEmbed),
          },
          {
            property: 'fc:miniapp:domain',
            content: frame.domain,
          },
        ]}
        siteName={'Farcaster Mini App'}
        author={metadata.authorUsername}
      />
      <SoftwareApplicationSchemaHead
        name={frame.name}
        description={metadata.pageDescription}
        applicationCategory={metadata.primaryCategory}
        keywords={metadata.tags}
        authorName={metadata.authorUsername}
        authorProfileUrl={metadata.authorProfileUrl}
        imageUrl={metadata.imageUrl}
        url={metadata.url}
        screenshotUrl={metadata.screenshotUrls?.[0]}
      />
      <MiniApp
        frame={frame}
        embed={embed}
        ogMetadata={ogMetadata}
        isInCollection={false}
        description={frame.description ?? null}
      />
    </>
  );
}

export function encodeCursor(cursor: { page: number; limit: number }): string {
  return Buffer.from(JSON.stringify(cursor))
    .toString('base64')
    .replaceAll(/=/g, '');
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Check if context.params exists before destructuring
  if (!context.params) {
    return {
      notFound: true,
    };
  }
  const { id, extra } = context.params as {
    id: string;
    extra?: string | string[];
  };
  const path =
    Array.isArray(extra) && extra.length > 1 ? extra.slice(1).join('/') : null;
  const params = context.resolvedUrl.split('?')[1] ?? null;

  if (!id) {
    return {
      redirect: {
        destination: '/miniapps',
        permanent: false,
      },
    };
  }

  try {
    const [frameResponse, embedResponse] = await Promise.all([
      fetchAndHandleError(async () => apiClient.getFrameDetails({ id })),
      apiClient.getMiniAppHomeEmbed({
        id,
        path: path ?? undefined,
        params: params ?? undefined,
      }),
    ]);

    const frame = frameResponse.data.result.frame;
    const embed = embedResponse.data.result.embed;
    const ogMetadata = embedResponse.data.result.ogMetadata;

    if (!frame || frame.harmful) {
      return { notFound: true };
    }

    return {
      props: {
        frame,
        embed: embed ?? null,
        ogMetadata: ogMetadata ?? null,
        path,
        params,
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
