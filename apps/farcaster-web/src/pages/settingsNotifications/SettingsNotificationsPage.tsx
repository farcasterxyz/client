import { memo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Divider } from '~/components/Divider';
import { FormControl } from '~/components/forms/FormControl';
import { Instructions } from '~/components/forms/Instructions';
import { Label } from '~/components/forms/Label';
import { TextInput } from '~/components/forms/TextInput';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';
import { SettingsPageContent } from '~/components/page/SettingsPageContent';
import { useOnboardingState } from '~/hooks/data/useOnboardingState';
import { SettingsNav } from '~/layouts/SettingsNav';

import { GranularEmailNotificationsSection } from './GranularEmailNotificationsSection';
import { GranularInAppNotificationsSection } from './GranularInAppNotificationsSection';
import { NotificationsModeSetting } from './NotificationsModeSetting';
import { TradeIdeasSetting } from './TradeIdeasSetting';

const SettingsNotificationsPage = memo(() => {
  const {
    result: {
      state: { email: currentEmail },
    },
  } = useOnboardingState();
  return (
    <Page meta={{ title: 'Notification Preferences / Farcaster' }}>
      <>
        <div className="border-default sm:border-x">
          <PageHeader hideCastButton>
            <PageTitle>Settings</PageTitle>
          </PageHeader>
        </div>
        <BorderedMainContent className="flex flex-row">
          <SettingsNav />
          <SettingsPageContent>
            <NotificationsModeSetting />
            <Divider />
            <GranularInAppNotificationsSection />
            <Divider />
            <TradeIdeasSetting />
            <Divider />
            <GranularEmailNotificationsSection />
            <Divider />
            <FormControl
              label={<Label>Email address</Label>}
              input={<TextInput value={currentEmail} disabled />}
              instructions={
                <Instructions>
                  Used for occasional notifications and not visible to others,
                  can only be updated via mobile app.
                </Instructions>
              }
            />
          </SettingsPageContent>
        </BorderedMainContent>
      </>
    </Page>
  );
});

SettingsNotificationsPage.displayName = 'SettingsNotificationsPage';

export { SettingsNotificationsPage };
