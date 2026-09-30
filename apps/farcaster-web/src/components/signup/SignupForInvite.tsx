import React, { FC, memo } from 'react';

import { AppStoreRedirectsModal } from '~/components/modals/AppStoreRedirectsModal';
import { SignupCTA } from '~/components/signup/SignupCTA';
import { SignupForm } from '~/components/signup/SignupForm';

type InviteLinkSignupProps = {
  inviterFid: number;
  urlIdentifier: string;
};

const SignupForInvite: FC<InviteLinkSignupProps> = memo(
  ({ inviterFid, urlIdentifier }) => {
    const [appStoreRedirectModalVisible, setAppStoreRedirectModalVisible] =
      React.useState<boolean>(false);
    const onAppStoreRedirectsModalClose = React.useCallback(() => {
      setAppStoreRedirectModalVisible(false);
    }, []);
    return (
      <div className="mx-auto flex w-screen max-w-xl flex-col items-center space-y-4 p-10">
        <SignupCTA inviterFid={inviterFid} />
        <SignupForm
          inviterFid={inviterFid}
          urlIdentifier={urlIdentifier}
          setAppStoreModalVisible={setAppStoreRedirectModalVisible}
        />
        {appStoreRedirectModalVisible && window.innerWidth < 720 && (
          <AppStoreRedirectsModal onClose={onAppStoreRedirectsModalClose} />
        )}
      </div>
    );
  },
);

export { SignupForInvite };
