import { InfoIcon } from '@primer/octicons-react';
import { ApiDirectCastsFilterLevelPreference } from 'farcaster-client-data';
import {
  getNotionLinkTarget,
  useBulkAlterPlaintextDirectCastConversationCategory,
  useSetUserPreferences,
  useUserPreferences,
} from 'farcaster-client-hooks';
import { memo, Suspense, useCallback, useMemo, useState } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { SelectOne } from '~/components/forms/SelectOne';
import { ExternalLink } from '~/components/links/ExternalLink';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useCurrentUser } from '~/hooks/data/useCurrentUser';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { SettingsNav } from '~/layouts/SettingsNav';
import { trackError } from '~/utils/errorUtils';

const SettingsDirectCastsPage = memo(() => {
  const { data } = useUserPreferences();
  const fid = useCurrentUser().fid;
  const setUserPreferences = useSetUserPreferences();

  const defaultDirectCastsFilterLevelPreference = useMemo(() => {
    return data?.result.preferences.directCastsFilterLevel;
  }, [data?.result.preferences]);

  const [controlledFilterValue, setControlledFilterValue] =
    useState<ApiDirectCastsFilterLevelPreference>(
      defaultDirectCastsFilterLevelPreference || 'medium',
    );

  const onDirectCastsFilterLevelChange = useCallback(
    async (value: ApiDirectCastsFilterLevelPreference) => {
      setControlledFilterValue(value);

      try {
        await setUserPreferences({
          preferences: { directCastsFilterLevel: value },
        });
      } catch (error) {
        trackError(error);
      }
    },
    [setUserPreferences],
  );

  const isSuperAdmin = useIsAdmin();
  const bulkArchive = useBulkAlterPlaintextDirectCastConversationCategory();

  return (
    <Page meta={{ title: 'Direct Casts / Farcaster' }}>
      <Suspense>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <div className="flex flex-col gap-4">
              {isSuperAdmin && (
                <DefaultButton
                  variant="danger"
                  onClick={() => {
                    if (
                      confirm(
                        'Bulk archive will move all your messages to the archived section. Proceed?',
                      )
                    ) {
                      bulkArchive({ fid, category: 'archived' });
                    }
                  }}
                >
                  Bulk Archive Everything
                </DefaultButton>
              )}
              <div>
                <div className="py-3">
                  <div className="flex items-center">
                    <div className="text-base font-medium">
                      Direct Cast delivery
                    </div>
                    <ExternalLink
                      title="info"
                      href={getNotionLinkTarget({
                        to: 'direct-casts-requests',
                      })}
                      className="ml-2"
                    >
                      <InfoIcon size={16} className="text-[#838893]" />
                    </ExternalLink>
                  </div>
                  <div className="pt-[14px] text-xs text-muted">
                    Choose how direct casts are filtered:
                  </div>
                </div>
              </div>
              <div className="-mx-4">
                <SelectOne
                  options={[
                    {
                      value: 'high',
                      title: 'High',
                      subtitle: 'Only allow messages from people you follow.',
                    },
                    {
                      value: 'medium',
                      title: 'Medium',
                      subtitle:
                        'Allow messages from people you follow and suggested users.',
                    },
                    {
                      value: 'low',
                      title: 'Low',
                      subtitle: 'Show direct casts from all users.',
                    },
                  ]}
                  value={controlledFilterValue}
                  onChange={onDirectCastsFilterLevelChange}
                />
              </div>
            </div>
          </SettingsPageContent>
        </BorderedMainContent>
      </Suspense>
    </Page>
  );
});

SettingsDirectCastsPage.displayName = 'SettingsDirectCastsPage';

export { SettingsDirectCastsPage };
