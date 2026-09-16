import { AnalyticsEvent } from 'farcaster-analytics';
import { ApiBlockedUser, ApiProfile, ApiUser } from 'farcaster-client-data';
import { useBlockedUsers, useMarkVisible } from 'farcaster-client-hooks';
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

const SettingsBlockedUsersPage = memo(() => {
  const {
    flatData: blockedUsers,
    isLoading: isLoadingBlockedUsers,
    refetch,
  } = useBlockedUsers();
  const markVisible = useMarkVisible();
  const { trackEvent } = useAnalytics();

  const handleUnblock = useCallback(
    async (user: ApiUser) => {
      try {
        trackEvent(AnalyticsEvent.ClickUnblock, undefined);
        await markVisible({ targetFid: user.fid });
        toast({
          message: `Unblocked @${user.username}`,
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
    <Page meta={{ title: 'Blocked accounts / Farcaster' }}>
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
              <span className="mb-2 font-semibold">Blocked accounts</span>
              <div className="-mx-4 flex flex-col">
                {isLoadingBlockedUsers && (
                  <div className="w-full text-center text-faint">
                    Loading...
                  </div>
                )}
                {!isLoadingBlockedUsers &&
                  blockedUsers?.map((blockedUser: ApiBlockedUser) => {
                    const minimalUser = blockedUser.blockedUser;
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
                          <DefaultButton
                            onClick={() => handleUnblock(user)}
                            variant="danger"
                          >
                            Unblock
                          </DefaultButton>
                        }
                      />
                    );
                  })}
                {!isLoadingBlockedUsers &&
                  (!blockedUsers || blockedUsers.length === 0) && (
                    <div className="w-full text-center text-faint">
                      No blocked users
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

SettingsBlockedUsersPage.displayName = 'SettingsBlockedUsersPage';

export { SettingsBlockedUsersPage };
