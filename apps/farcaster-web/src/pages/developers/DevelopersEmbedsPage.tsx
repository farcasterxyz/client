import { LinkExternalIcon } from '@primer/octicons-react';
import { ApiCast, ApiCastEmbeds } from 'farcaster-client-data';
import {
  DEFAULT_CAST_FID,
  DEFAULT_CAST_HASH,
  useProcessCastAttachments,
  useScrapeEmbed,
} from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Divider } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { TextInput } from '~/components/forms/TextInput';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useCastAttachmentDebug } from '~/hooks/casts/useCastBody';

const caip19ExampleCastaways =
  'chain://eip155:1/erc721:0xcc3cac6d9f77681cbff754377ad4599f5d8afd30/37';
const caip19ExampleFarcasting =
  'chain://eip155:1/erc721:0xa723a8a69d9b8cf0bc93b92f9cb41532c1a27f8f/11';
const caip19ExampleERC1155 =
  'chain://eip155:1/erc721:0x2c274e5f6409c58485b8f2a2f83e95db7aad6909/1';
const openSeaCollectionExample =
  'https://opensea.io/collection/farcaster-alpaca';
const zoraCollectionExample =
  'https://zora.co/collect/0x03ad6cd7410ce01a8b9ed26a080f8f9c1d7cc222';

const warpcastURLExample = 'https://farcaster.xyz/dwr/0xc6a750';
const richPreviewExample = 'https://farcaster.xyz';
const fcProfileExample = 'farcaster://profiles/1';
const fcProtocolGitHubExample = 'https://github.com/farcasterxyz/protocol';
const twitterURLExample =
  'https://twitter.com/farcaster_xyz/status/1648751856838123520';

const sampleImageEmbed = 'https://i.imgur.com/2T5DaQT.jpg';

const DevelopersEmbedsPage: React.FC = React.memo(() => {
  const [path, setPath] = React.useState<string>('');
  const [fetching, setFetching] = React.useState<boolean>(false);
  const [refetching, setRefetching] = React.useState<boolean>(false);
  const [embeds, setEmbeds] = React.useState<ApiCastEmbeds | undefined>(
    undefined,
  );

  // Create a default cast object for embeds page
  const defaultCast = React.useMemo<ApiCast>(
    () => ({
      author: {
        fid: DEFAULT_CAST_FID,
        username: '',
        displayName: '',
        profile: { bio: { text: '', mentions: [] } },
        followerCount: 0,
        followingCount: 0,
      },
      hash: DEFAULT_CAST_HASH,
      threadHash: DEFAULT_CAST_HASH,
      timestamp: Date.now(),
      text: '',
      embeds,
      replies: { count: 0 },
      reactions: { count: 0 },
      recasts: { count: 0 },
      watches: { count: 0 },
    }),
    [embeds],
  );

  const fakeRef = React.useRef<boolean>(false);

  const { castAttachment } = useCastAttachmentDebug({
    cast: defaultCast,
    text: '',
    embeds,
    isFocusedCast: false,
    draggingRef: fakeRef,
  });
  const processCastAttachment = useProcessCastAttachments();
  const scrapeEmbed = useScrapeEmbed();

  const doFetchAttachment = React.useCallback(
    async ({ path }: { path: string }) => {
      setFetching(true);

      try {
        const data = await processCastAttachment({ text: '', embeds: [path] });
        setEmbeds(data.result.embeds);
      } catch (e) {
      } finally {
        setFetching(false);
      }
    },
    [processCastAttachment],
  );

  const onFetchAttachmentClick = React.useCallback(async () => {
    if (path === '') {
      setEmbeds(undefined);
      return;
    }

    await doFetchAttachment({ path });
  }, [doFetchAttachment, path]);

  const triggerFetch = React.useCallback(
    async ({ path }: { path: string }) => {
      setPath(path);
      doFetchAttachment({ path });
    },
    [doFetchAttachment],
  );

  const onRefetchAttachmentClick = React.useCallback(async () => {
    if (path === '') {
      setEmbeds(undefined);
      return;
    }

    setRefetching(true);

    try {
      const data = await scrapeEmbed({ embed: path });
      setEmbeds(data.result.embeds);
    } catch (e) {
    } finally {
      setRefetching(false);
    }
  }, [path, scrapeEmbed]);

  return (
    <Page meta={{ title: 'Developers / Embeds' }}>
      <BorderedMainContent className="max-w-xl">
        <PageHeader hideCastButton>
          <PageTitle>Developers: Embeds</PageTitle>
        </PageHeader>
        <div className="flex  flex-col space-y-2 p-4 pb-40">
          <div className="my-4 flex h-max w-full flex-col items-center justify-center rounded border p-10 text-center shadow bg-app border-default">
            <span className="font-semibold">🖼️ Mini App validators</span>
            <span>
              If you are building a mini app and want to test the embed,{' '}
              <Link
                className="w-max"
                title="Legacy Frame Validator"
                to="developersMiniAppEmbed"
                params={{}}
                searchParams={{}}
                rel="nofollow"
              >
                click here <LinkExternalIcon />
              </Link>
            </span>
          </div>
          <Divider />
          <div className="flex w-full flex-row">
            <TextInput
              className="mr-4 grow"
              autoFocus
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
              }}
            />
            <DefaultButton
              variant="muted"
              className="w-24"
              onClick={onFetchAttachmentClick}
              disabled={path === ''}
              isLoading={fetching}
            >
              Fetch
            </DefaultButton>
          </div>
          {fetching && <LoadingIndicator containerClassName="self-center" />}
          {!fetching && (
            <div className="w-full">
              {castAttachment}
              <div className="mt-2 flex flex-col">
                <DefaultButton
                  variant="muted"
                  onClick={onRefetchAttachmentClick}
                  disabled={path === ''}
                  isLoading={refetching}
                >
                  Scrape Again
                </DefaultButton>
                {path !== '' && (
                  <>
                    <span className="pt-0.5 text-center text-xs text-muted">
                      This will have no effect on existing casts. All future
                      casts will have the latest scraped result.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          <Divider />
          <ExternalLink
            href="https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md#14-casts"
            title="https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md#14-casts"
            className="text-sm text-link"
          >
            <LinkExternalIcon /> Farcaster protocol embeds spec
          </ExternalLink>
          <span className="font-semibold">Examples</span>
          <div className="!mt-1 flex flex-col space-y-0.5">
            <span>Asset embeds:</span>
            <span className="text-sm">
              ERC721:{' '}
              <span
                className="cursor-pointer text-sm text-link hover:underline"
                onClick={() => {
                  triggerFetch({ path: caip19ExampleCastaways });
                }}
              >
                {caip19ExampleCastaways}
              </span>
            </span>
            <span className="text-sm">
              ERC721:{' '}
              <span
                className="cursor-pointer text-sm text-link hover:underline"
                onClick={() => {
                  triggerFetch({ path: caip19ExampleFarcasting });
                }}
              >
                {caip19ExampleFarcasting}
              </span>
            </span>
            <span className="text-sm">
              ERC1155:{' '}
              <span
                className="cursor-pointer text-sm text-link hover:underline"
                onClick={() => {
                  triggerFetch({ path: caip19ExampleERC1155 });
                }}
              >
                {caip19ExampleERC1155}
              </span>
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: openSeaCollectionExample });
              }}
            >
              {openSeaCollectionExample}
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: zoraCollectionExample });
              }}
            >
              {zoraCollectionExample}
            </span>
            <span>Open Graph:</span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: warpcastURLExample });
              }}
            >
              {warpcastURLExample}
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: richPreviewExample });
              }}
            >
              {richPreviewExample}
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: fcProtocolGitHubExample });
              }}
            >
              {fcProtocolGitHubExample}
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: twitterURLExample });
              }}
            >
              {twitterURLExample}
            </span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: fcProfileExample });
              }}
            >
              {fcProfileExample}
            </span>
            <span>Images:</span>
            <span
              className="cursor-pointer text-sm text-link hover:underline"
              onClick={() => {
                triggerFetch({ path: sampleImageEmbed });
              }}
            >
              {sampleImageEmbed}
            </span>
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

DevelopersEmbedsPage.displayName = 'DevelopersEmbedsPage';

export { DevelopersEmbedsPage };
