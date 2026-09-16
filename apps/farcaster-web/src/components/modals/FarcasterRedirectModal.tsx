import classNames from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { useInitiateMagicLinkRedirect } from 'farcaster-client-hooks';
import { animate, motion, useMotionValue } from 'motion/react';
import React from 'react';

import { LoadingIndicator } from '~/components/loaders/LoadingIndicator';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
const NO_OP = () => {};

const FarcasterRedirectModal: React.FC = React.memo(() => {
  const { trackEvent } = useAnalytics();

  const isSignedIn = useIsSignedIn();

  const initiateMagicRedirect = useInitiateMagicLinkRedirect();

  const navigate = useExternalNavigate();

  const onRedirectClick = React.useCallback(async () => {
    trackEvent(AnalyticsEvent.ClickRedirectToFarcaster, { isSignedIn });

    if (isSignedIn) {
      const result = await initiateMagicRedirect();

      const to = result.data.result.link;

      navigate({ to: to, openInNewTab: false });
    } else {
      navigate({ to: 'https://farcaster.xyz', openInNewTab: false });
    }
  }, [initiateMagicRedirect, isSignedIn, navigate, trackEvent]);

  return (
    <Modal>
      <DefaultModalContainer onClose={NO_OP}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="scrollbar-vert flex h-auto w-[400px] flex-col items-start justify-center overflow-y-auto rounded-[24px] border p-[20px] pt-[40px] bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div className="flex w-full flex-col space-y-5">
              <div className="flex w-full flex-row items-center justify-center space-x-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <rect width="64" height="64" rx="16" fill="#432C8D" />
                  <path
                    d="M23.0348 20.6059H16.6681C16.3344 20.6059 16.0943 20.9267 16.1884 21.2469L22.8181 43.801C22.8807 44.0138 23.076 44.16 23.2978 44.16H28.9725C29.1972 44.16 29.3943 44.0101 29.4543 43.7935L31.848 35.1567C31.9827 34.6708 32.6703 34.6671 32.8102 35.1516L35.3066 43.7987C35.3684 44.0127 35.5642 44.16 35.787 44.16H41.4634C41.6864 44.16 41.8824 44.0123 41.944 43.798L48.4568 21.118C48.5486 20.7984 48.3087 20.48 47.9762 20.48H41.487C41.2583 20.48 41.0588 20.6352 41.0024 20.8569L38.8492 29.3324C38.7224 29.8314 38.0153 29.8363 37.8817 29.3391L35.634 20.9762C35.5753 20.7578 35.3773 20.6059 35.1512 20.6059H29.4888C29.2627 20.6059 29.0647 20.7578 29.006 20.9762L26.7447 29.3898C26.612 29.8834 25.9116 29.8834 25.779 29.3898L23.5177 20.9762C23.459 20.7578 23.261 20.6059 23.0348 20.6059Z"
                    fill="white"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                >
                  <path
                    d="M6.6665 16H25.3332"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 6.66669L25.3333 16L16 25.3334"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <rect width="64" height="64" rx="16" fill="#7C65C1" />
                  <path
                    d="M43.5445 20.1345H49.5307L48.6756 24.8379H47.179V42.7966L47.245 42.7982C47.9228 42.8326 48.4618 43.393 48.4618 44.0793V45.1483L48.5277 45.1499C49.2055 45.1843 49.7445 45.7447 49.7445 46.431V47.5H37.7721V46.431C37.7721 45.7447 38.3111 45.1843 38.9889 45.1499L39.0549 45.1483V44.0793C39.0549 43.393 39.5939 42.8326 40.2717 42.7982L40.3376 42.7966V34.031C40.3376 29.4261 36.6046 25.6931 31.9997 25.6931C27.3948 25.6931 23.6618 29.4261 23.6618 34.031V42.7966L23.7278 42.7982C24.4055 42.8326 24.9445 43.393 24.9445 44.0793V45.1483L25.0105 45.1499C25.6883 45.1843 26.2273 45.7447 26.2273 46.431V47.5H14.2549V46.431C14.2549 45.7447 14.7939 45.1843 15.4717 45.1499L15.5376 45.1483V44.0793C15.5376 43.393 16.0766 42.8326 16.7544 42.7982L16.8204 42.7966V24.8379H15.3238L14.4687 20.1345H20.4549V16.5H43.5445V20.1345Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="flex cursor-default flex-col space-y-2 text-center">
                <div className="text-2xl font-semibold text-default">
                  Warpcast is now Farcaster
                </div>
              </div>
              <RedirectButton onClick={onRedirectClick} />
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

function RedirectButton({ onClick }: { onClick: () => void }) {
  const scale = useMotionValue(1);

  const [clicked, setClicked] = React.useState<boolean>(false);

  const handleMouseDown = () => {
    if (clicked) {
      return;
    }

    animate(scale, 0.9, { type: 'spring', stiffness: 300, damping: 20 });
  };

  const handleMouseUp = () => {
    animate(scale, 1, { type: 'spring', stiffness: 300, damping: 20 });
  };

  return (
    <motion.div
      style={{ scale }}
      className={classNames(
        'relative flex h-14 grow cursor-pointer flex-col items-center justify-center rounded-[16px] bg-action',
        clicked && 'opacity-50',
      )}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => {
        if (clicked) {
          return;
        }

        setClicked(true);

        onClick();
      }}
    >
      <div className="focus:outline-hidden flex w-full items-center justify-center">
        <div className="flex min-w-[160px] flex-row items-center justify-center p-2">
          {clicked ? (
            <span>
              <LoadingIndicator size="sm" />
            </span>
          ) : (
            <motion.span className="select-none font-medium text-light">
              Continue to <span className="underline">farcaster.xyz</span>
            </motion.span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

FarcasterRedirectModal.displayName = 'FarcasterRedirectModal';

export { FarcasterRedirectModal };
