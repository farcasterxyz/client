import { AnalyticsEvent } from 'farcaster-analytics';
import { FC, memo, useEffect, useMemo } from 'react';

import { LoginMagicLinkWithInstructions } from '~/components/login/LoginMagicLinkWithInstructions';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
type LoginWithMagicLinkProps = {
  onClose: () => void;
};

const LoginWithMagicLink: FC<LoginWithMagicLinkProps> = memo(({ onClose }) => {
  return <LoginWithMagicLinkContent onClose={onClose} />;
});

LoginWithMagicLink.displayName = 'LoginWithMagicLink';

type LoginWithMagicLinkContentProps = {
  onClose: () => void;
};

const LoginWithMagicLinkContent: FC<LoginWithMagicLinkContentProps> = memo(
  ({ onClose }) => {
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      trackEvent(AnalyticsEvent.ViewLoginWithMagicLinkScreen, undefined);
    }, [trackEvent]);

    const body = useMemo(() => {
      return <LoginMagicLinkWithInstructions onClose={onClose} />;
    }, [onClose]);

    return <div className="min-h-[264px] w-full">{body}</div>;
  },
);

LoginWithMagicLinkContent.displayName = 'LoginWithMagicLinkContent';

export { LoginWithMagicLink };
