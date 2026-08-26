import { PersonAddIcon, SignInIcon } from '@primer/octicons-react';
import { AnalyticsEvent } from 'farcaster-analytics';
import { FC, memo, useState } from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { LoginModal } from '~/components/modals/LoginModal';
import { Search } from '~/components/search/Search';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCurrentRouteFamily } from '~/hooks/navigation/useCurrentRouteFamily';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { RightSideBar } from '~/layouts/RightSideBar';
import { SupportAndTermsLinks } from '~/layouts/SupportAndTermsLinks';
const UnauthedRightSideBar: FC = memo(() => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { trackEvent } = useAnalytics();
  const navigate = useNavigate();

  const routeFamily = useCurrentRouteFamily();

  if (routeFamily === 'invites') {
    return null;
  }

  return (
    <RightSideBar>
      {routeFamily === 'search' ? <></> : <Search showClearIcon={false} />}
      <div className="mt-3 grid w-full grow grid-cols-2 flex-row gap-2">
        <DefaultButton
          className="max-h-[40px] min-w-0 mdlg:min-w-[110px]"
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickedLogin, undefined);
            setIsLoggingIn(true);
          }}
        >
          <div className="hidden mdlg:block">Login</div>
          <div className="mdlg:hidden">
            <SignInIcon />
          </div>
        </DefaultButton>
        <DefaultButton
          className="max-h-[40px] min-w-0 mdlg:min-w-[110px]"
          onClick={() => {
            trackEvent(AnalyticsEvent.ClickedCreateNewAccount, undefined);
            navigate({ to: 'signup', params: {} });
          }}
        >
          <div className="hidden mdlg:block">Create account</div>
          <div className="mdlg:hidden">
            <PersonAddIcon />
          </div>
        </DefaultButton>
      </div>
      <SupportAndTermsLinks />
      {isLoggingIn && <LoginModal onClose={() => setIsLoggingIn(false)} />}
    </RightSideBar>
  );
});

UnauthedRightSideBar.displayName = 'UnauthedRightSideBar';

export { UnauthedRightSideBar };
