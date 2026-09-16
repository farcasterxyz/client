import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiMutedUser, ApiProfile, ApiUser } from 'farcaster-client-data';
import { useMarkVisible, useMutedUsers } from 'farcaster-client-hooks';
import { memo, Suspense, useCallback } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { User } from '~/components/users/User';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

const SettingsMutedUsersPage = memo(() => {
  const {
    flatData: mutedUsers,
    isLoading: isLoadingMutedUsers,
    refetch,
  } = useMutedUsers();
  const markVisible = useMarkVisible();
  const { trackEvent } = useAnalytics();

  const handleUnmute = useCallback(
    async (user: ApiUser) => {
      try {
        trackEvent(AnalyticsEvent.ClickUnmute, undefined);
        await markVisible({ targetFid: user.fid });
        toast({
          message: `Unmuted @${user.username}`,
          position: 'bottom-center',
        });
        refetch();
      } catch (error) {
        trackError(error);
        toast({
          message: 'Failed, please try again',
          type: 'error',
          position: 'bottom-center',
        });
      }
    },
    [markVisible, refetch, trackEvent],
  );

  return (
    <Page meta={{ title: 'Muted accounts / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="mb-4 flex flex-col">
              <span className="mb-2 font-semibold">Muted accounts</span>
              <div className="-mx-4 flex flex-col">
                {isLoadingMutedUsers && (
                  <div className="w-full text-center text-faint">
                    Loading...
                  </div>
                )}
                {!isLoadingMutedUsers &&
                  mutedUsers?.map((mutedUser: ApiMutedUser) => {
                    const minimalUser = mutedUser.mutedUser;
                    if (!minimalUser) {
                      return null;
                    }
                    const profile = minimalUser.profile as ApiProfile;
                    const user: ApiUser = {
                      ...minimalUser,
                      followerCount: 0,
                      followingCount: 0,
                      profile: {
                        ...profile,
                        bio: {
                          text: profile?.bio?.text || '',
                          mentions: profile?.bio?.mentions || [],
                          channelMentions: profile?.bio?.channelMentions || [],
                        },
                      },
                    };
                    return (
                      <User
                        key={user.fid}
                        compact
                        user={user}
                        Action={
                          <DefaultButton onClick={() => handleUnmute(user)}>
                            Unmute
                          </DefaultButton>
                        }
                      />
                    );
                  })}
                {!isLoadingMutedUsers &&
                  (!mutedUsers || mutedUsers.length === 0) && (
                    <div className="w-full text-center text-faint">
                      No muted users
                    </div>
                  )}
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsMutedUsersPage.displayName = 'SettingsMutedUsersPage';

export { SettingsMutedUsersPage };
