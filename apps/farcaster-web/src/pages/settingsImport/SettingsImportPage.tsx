import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiUser } from 'farcaster-client-data';
import {
  useFollowAllTwitterFollowing,
  useTwitterFollowing,
  useUploadTwitterFollowing,
} from 'farcaster-client-hooks';
import React from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { ExternalLink } from '~/components/links/ExternalLink';
import { FlatList } from '~/components/lists/FlatList';
import { FullScreenLoadingIndicator } from '~/components/loaders/FullScreenLoadingIndicator';
import { AlertModal } from '~/components/modals/AlertModal';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';
import { toast } from '~/utils/toast';

const SettingsImportPage = React.memo(() => {
  return (
    <Page meta={{ title: 'Find people you follow on X / Farcaster' }}>
      <div className="border-default sm:border-x">
        <PageHeader hideCastButton>
          <PageTitle>Settings</PageTitle>
        </PageHeader>
      </div>
      <BorderedMainContent className="flex flex-row">
        <SettingsNav />
        <React.Suspense fallback={<FullScreenLoadingIndicator />}>
          <Content />
        </React.Suspense>
      </BorderedMainContent>
    </Page>
  );
});

function Content() {
  const { trackEvent } = useAnalytics();

  const { data, refetch } = useTwitterFollowing();

  const matchesExist = React.useMemo(() => {
    return data.pages.flatMap((p) => p.result.following).length !== 0;
  }, [data.pages]);

  const uploadTwitterFollowing = useUploadTwitterFollowing();

  const [uploading, setUploading] = React.useState<boolean>(false);

  const [showAlertModal, setShowAlertModal] = React.useState<boolean>(false);

  const formRef = React.useRef<HTMLFormElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onUploadFileClick = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickUploadXFile, {});

    if (formRef.current && inputRef.current) {
      formRef.current.reset();
      inputRef.current.click();
    }
  }, [trackEvent]);

  const onFileInputChange = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || file.name !== 'following.js') {
        setShowAlertModal(true);
        return;
      }

      setUploading(true);

      trackEvent(AnalyticsEvent.UploadXFollowing, {});

      try {
        const text = await file.text();
        const jsonPayload = text.replace(
          /^window\.YTD\.following\.part0\s*=\s*/,
          '',
        );
        const parsed = JSON.parse(jsonPayload);
        const following: string[] = parsed
          .map(
            (entry: { following: { accountId: string } | undefined }) =>
              entry.following?.accountId,
          )
          .filter(Boolean);

        await uploadTwitterFollowing({ following });

        await refetch();
      } catch (err) {
        setShowAlertModal(true);
      } finally {
        setUploading(false);
      }
    },
    [refetch, trackEvent, uploadTwitterFollowing],
  );

  return (
    <div className="flex w-full flex-col">
      <div className="mb-4 flex flex-col">
        <span className="p-4 text-lg font-semibold">
          Find people you follow on X / Twitter
        </span>
        {!matchesExist && (
          <div className="mb-4 flex flex-col">
            <div className="mb-2 space-y-4 border-b px-4 pb-4 border-default">
              <p className="">
                1. On desktop, log in to X / Twitter. This won’t work on the
                mobile app.
              </p>
              <p className="">
                2. Go to{' '}
                <ExternalLink
                  title="X download your data"
                  href="https://x.com/settings/download_your_data"
                  onClick={() => {
                    trackEvent(AnalyticsEvent.ClickDownloadXData, {});
                  }}
                >
                  Download Your Data
                </ExternalLink>{' '}
                and verify your password if prompted. You may also need to
                confirm your phone number or email address.
              </p>
              <p className="">
                {`If this link does not work, in the sidebar, go to More > Settings and privacy > Your account > Download an archive of your data.`}
              </p>
              <p className="">
                3. Select{' '}
                <span className="font-[monospace] font-semibold">
                  Request Archive
                </span>{' '}
                . You may need to wait up to 72 hours (3 days) to receive an
                email and an in-app notification from X / Twitter letting you
                know your data is ready.
              </p>
              <p className="">
                4. Once you receive the email, download and unzip your data
                file. Then, find the{' '}
                <span className="font-[monospace] font-semibold">
                  following.js
                </span>{' '}
                file in the Data folder and upload it.
              </p>
              <DefaultButton
                className="h-12 w-full"
                onClick={onUploadFileClick}
                size="lg"
                isLoading={uploading}
              >
                Upload file
                <form ref={formRef} onSubmit={undefined} hidden>
                  <input
                    type="file"
                    hidden
                    ref={inputRef}
                    onChange={onFileInputChange}
                  />
                </form>
              </DefaultButton>
              {uploading && (
                <span className="text-sm text-muted">
                  Processing, please keep the window open.
                </span>
              )}
            </div>
            {showAlertModal && (
              <AlertModal onOk={() => setShowAlertModal(false)}>
                <div className="pb-3 text-lg font-semibold">
                  File upload failed
                </div>
                <div>
                  Please make sure you're uploading{' '}
                  <span className="font-[monospace] font-semibold">
                    following.js
                  </span>{' '}
                  file from your data archive.
                </div>
              </AlertModal>
            )}
          </div>
        )}
        {matchesExist && <TwitterFollowing />}
      </div>
    </div>
  );
}

function TwitterFollowing() {
  const { trackEvent } = useAnalytics();

  const { data, onEndReached, isLoading } = useTwitterFollowing();

  const followAllFollowing = useFollowAllTwitterFollowing();

  const onFollowAll = React.useCallback(() => {
    trackEvent(AnalyticsEvent.ClickFollowAllImportX, {});

    followAllFollowing();

    toast({
      message: 'Followed all! 🎉',
      toastId: 'follow-all-import-x',
    });
  }, [followAllFollowing, trackEvent]);

  const following = React.useMemo(() => {
    return data.pages.flatMap((page) => page.result.following) || [];
  }, [data.pages]);

  const totalMatchCount = React.useMemo(() => {
    return data.pages.length !== 0 ? data.pages[0].result.totalMatchCount : 0;
  }, [data.pages]);

  const alreadyFollowingCount = React.useMemo(() => {
    return data.pages.length !== 0
      ? data.pages[0].result.alreadyFollowingCount
      : 0;
  }, [data.pages]);

  return (
    <div className="flex flex-col space-y-4">
      {totalMatchCount === 0 && (
        <div className="flex px-4">
          We found no profiles you follow on X. We will notify you if any
          matches occur in the future.
        </div>
      )}
      {totalMatchCount !== 0 && (
        <div className="flex flex-col space-y-2 px-4">
          <div>
            We found {totalMatchCount}{' '}
            {totalMatchCount === 1 ? `profile` : `profiles`} you follow on X.
          </div>
          <div>
            {totalMatchCount === alreadyFollowingCount
              ? 'You are already following all of them on Farcaster.'
              : `You are not following ${totalMatchCount - alreadyFollowingCount} of them on Farcaster.`}
          </div>
        </div>
      )}
      <DefaultButton
        onClick={onFollowAll}
        variant="normal"
        className="!mx-4 h-12"
        size="lg"
        disabled={totalMatchCount === alreadyFollowingCount}
      >
        Follow all
        {totalMatchCount === alreadyFollowingCount
          ? ''
          : ` (${totalMatchCount - alreadyFollowingCount})`}
      </DefaultButton>
      <div className="scrollbar-vert h-[90vh] w-full overflow-auto border-t border-default">
        <FlatList
          itemClassName="cursor-pointer hover:bg-overlay-light"
          data={following}
          renderItem={renderUser}
          keyExtractor={(item) => item.fid.toString()}
          emptyView={<></>}
          isFetchingNextPage={isLoading}
          onEndReached={onEndReached}
        />
      </div>
    </div>
  );
}

function renderUser({ item }: { item: ApiUser }) {
  return (
    <User
      user={item}
      withDetailsPopover={true}
      showBottomBorder={true}
      compact={true}
    />
  );
}

SettingsImportPage.displayName = 'SettingsImportPage';

export { SettingsImportPage };
