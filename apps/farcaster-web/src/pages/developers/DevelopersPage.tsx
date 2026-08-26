import { ApiFrame } from 'farcaster-client-data';
import {
  useDevToolsManagedApps,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import React, { useEffect, useMemo, useRef } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DeveloperToolButton } from '~/components/devTools/DeveloperToolButton';
import { ManageAppKebabActions } from '~/components/devTools/ManageAppKebabActions';
import { ViewDocsButton } from '~/components/devTools/ViewDocsButton';
import { Divider } from '~/components/Divider';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { FrameIconImage } from '~/components/images/FrameIconImage';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { useNavigate } from '~/hooks/navigation/useNavigate';

const MyApps: React.FC = React.memo(() => {
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useDevToolsManagedApps();

  const myApps = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.pages.flatMap((page) => page.items);
  }, [data]);

  if (myApps.length === 0) {
    if (isPending) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-3 px-4">
          <LoadingIndicator />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-3 px-4">
          <div>Error loading your Mini Apps. Please try again.</div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex min-h-[300px] w-full flex-col gap-3 px-4">
      <div className="px-3 font-semibold text-muted">My Mini Apps</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myApps.map((app) => (
          <MyAppEntry key={app.domain} app={app} />
        ))}
      </div>
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <DefaultButton
            onClick={() => fetchNextPage()}
            isLoading={isFetchingNextPage}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </DefaultButton>
        </div>
      )}
    </div>
  );
});

type MyAppEntryProps = {
  app: ApiFrame;
};

const MyAppEntry = React.memo<MyAppEntryProps>(function MyAppEntry({ app }) {
  const navigate = useNavigate();
  return (
    <div className="relative flex w-fit">
      <div className="absolute right-3 top-1 z-10">
        <ManageAppKebabActions frame={app} domain={app.domain} />
      </div>
      <div
        className="relative flex w-fit cursor-pointer flex-col gap-2 rounded-xl border p-3 pt-7 border-default hover:bg-light-purple active:bg-notification-purple"
        onClick={() => {
          navigate({
            to: 'developersManageApp',
            params: { domain: app.domain },
            searchParams: {},
          });
        }}
      >
        <div className="relative flex h-[147px] w-[274px] items-center justify-center rounded-xl bg-faint md:h-[119px] md:w-[220px] lg:h-[147px] lg:w-[274px]">
          <div
            className="absolute inset-0 z-0 rounded-xl opacity-10"
            style={{
              backgroundImage: `url(${app.iconUrl})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="absolute ">
            <FrameIconImage imageUrl={app.iconUrl} size={72} />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="line-clamp-1 text-lg font-semibold break-gracefully">
            {app.name}
          </div>
          <div className="line-clamp-1 text-sm text-muted break-gracefully">
            {app.domain}
          </div>
        </div>
      </div>
    </div>
  );
});

MyAppEntry.displayName = 'MyAppEntry';

const GetStarted: React.FC = React.memo(() => {
  return (
    <div className="m-4 flex flex-col gap-3 rounded-xl p-3 bg-faint">
      <div className="font-semibold text-muted">Get started</div>
      <div className="grid grid-cols-1 gap-4 py-3 sm:grid-cols-2">
        <DeveloperToolButton toolName="preview" />
        <DeveloperToolButton toolName="embed" />
        <DeveloperToolButton toolName="manifest" />
        <DeveloperToolButton toolName="snaps" searchParams={undefined} />
      </div>
    </div>
  );
});

const DevelopersPage: React.FC = React.memo(() => {
  const { data: userPreferences } = useUserPreferences();
  const setUserPreferences = useSetUserPreferences();
  const doOnce = useRef(false);

  useEffect(() => {
    if (
      !userPreferences?.result.preferences.enableDeveloperMode &&
      !doOnce.current
    ) {
      doOnce.current = true;
      setUserPreferences({
        preferences: {
          enableDeveloperMode: true,
        },
      });
    }
  }, [userPreferences, setUserPreferences]);

  return (
    <Page meta={{ title: 'Developers' }} className="max-w-[1000px]">
      <BorderedMainContent>
        <PageHeader
          visibleOnMobile
          hideCastButton
          hideBorderBottom
          iconRight={<ViewDocsButton href="https://miniapps.farcaster.xyz/" />}
        >
          <PageTitle>Developers</PageTitle>
        </PageHeader>
        <div className="h-[16px]" />
        <GetStarted />
        <MyApps />
        <Divider />
        <div className="grid grid-cols-1 gap-4 px-3 lg:grid-cols-3">
          <div className="flex flex-col border-b px-2 pb-2 lg:border-b-0">
            <h3 className="mb-2 text-lg font-semibold">Additional Tools</h3>
            <div className="flex flex-col space-y-1">
              <Link
                className="text-base text-link"
                title="Mini App Manifest Tools"
                to="developersMiniAppManifest"
                params={{}}
                searchParams={{}}
                rel="nofollow"
              >
                Mini App Manifest Tools
              </Link>
              <Link
                className="text-base text-link"
                title="Mini App Embed Tools"
                to="developersMiniAppEmbed"
                params={{}}
                searchParams={{}}
                rel="nofollow"
              >
                Mini App Embed Tools
              </Link>
              <Link
                className="text-base text-link"
                title="Emulator"
                to="developersSnaps"
                params={{}}
                searchParams={{}}
                rel="nofollow"
              >
                Emulator
              </Link>
              {/* developersFrameValidator removed */}
              {/* Share Extensions (developersCastActionPlayground) removed */}
              {/* developersComposerActionPlayground removed */}
              {/* developersEmbeds removed */}
              <Link
                className="text-base text-link"
                title="API Keys"
                to="developersApiKeys"
                params={{}}
                searchParams={{}}
              >
                API Keys
              </Link>
            </div>
          </div>
          <div className="flex flex-col border-b px-2 pb-2 lg:border-b-0">
            <h3 className="mb-2 text-lg font-semibold">Farcaster Docs</h3>
            <div className="flex flex-col space-y-1">
              <ExternalLink
                href="https://docs.farcaster.xyz/reference/farcaster/api"
                title="https://docs.farcaster.xyz/reference/farcaster/api"
                className="text-base text-link"
              >
                API
              </ExternalLink>
              <ExternalLink
                href="https://docs.farcaster.xyz/reference/farcaster/signer-requests"
                title="https://docs.farcaster.xyz/reference/farcaster/signer-requests"
                className="text-base text-link"
              >
                Signer Requests
              </ExternalLink>
              <ExternalLink
                href="https://docs.farcaster.xyz/reference/farcaster/intent-urls"
                title="https://docs.farcaster.xyz/reference/farcaster/intent-urls"
                className="text-base text-link"
                rel="nofollow"
              >
                Intent URLs
              </ExternalLink>
              <ExternalLink
                href="https://docs.farcaster.xyz/reference/farcaster/direct-casts"
                title="https://docs.farcaster.xyz/reference/farcaster/direct-casts"
                className="text-base text-link"
              >
                Direct Casts
              </ExternalLink>
              <ExternalLink
                href="https://farcaster.xyz/~/developers/embeds"
                title="https://farcaster.xyz/~/developers/embeds"
                className="text-base text-link"
              >
                Refresh feed embeds / cards
              </ExternalLink>
            </div>
          </div>
          <div className="flex flex-col border-b px-2 pb-2 lg:border-b-0">
            <h3 className="mb-2 text-lg font-semibold">Farcaster Docs</h3>
            <div className="flex flex-col space-y-1">
              <ExternalLink
                href="https://miniapps.farcaster.xyz"
                title="https://miniapps.farcaster.xyz"
                className="text-base text-link"
              >
                Mini Apps
              </ExternalLink>
              <ExternalLink
                href="https://docs.farcaster.xyz/developers/siwf/"
                title="https://docs.farcaster.xyz/developers/siwf/"
                className="text-base text-link"
              >
                SIWF
              </ExternalLink>
              <ExternalLink
                href="https://docs.farcaster.xyz"
                title="https://docs.farcaster.xyz"
                className="text-base text-link"
              >
                Protocol
              </ExternalLink>
            </div>
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

DevelopersPage.displayName = 'DevelopersPage';

export { DevelopersPage };
