import { AnalyticsEvent } from 'farcaster-analytics';
import { getNotionLinkTarget } from 'farcaster-client-hooks';
import { FC, memo, useCallback, useRef, useState } from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { DefaultPopoverContainer } from '~/components/popovers/DefaultPopoverContainer';
import { Popover } from '~/components/popovers/Popover';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
type FollowsDisabledDetailsProps = {
  children: React.ReactNode;
};

const FollowsDisabledDetails: FC<FollowsDisabledDetailsProps> = memo(
  ({ children }) => {
    const { trackEvent } = useAnalytics();
    const triggerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState<boolean>(false);

    const onPopoverTriggerClick = useCallback(
      (e: React.SyntheticEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setOpen(true);
        trackEvent(AnalyticsEvent.ShowFollowsDisabledPrompt, undefined);
      },
      [trackEvent],
    );

    return (
      <>
        <div
          ref={triggerRef}
          className="relative inset-0 z-50 cursor-pointer rounded-full px-1 text-muted hover:bg-overlay-faint hover:text-action-purple"
          onClick={onPopoverTriggerClick}
        >
          {children}
        </div>
        {open && (
          <Popover>
            <DefaultPopoverContainer
              onClose={() => setOpen(false)}
              style={{
                top: triggerRef.current?.getBoundingClientRect().bottom,
                left: triggerRef.current?.getBoundingClientRect().left,
              }}
            >
              <div className="-ml-32 mt-2 flex h-min w-96 flex-col rounded-md border p-4 shadow-lg bg-app border-default">
                <span className="text-lg font-semibold">Follows</span>
                <span className="flex flex-col items-start">
                  <span>You have reached your max follows limit.</span>
                  <ExternalLink
                    href={getNotionLinkTarget({ to: 'follows' })}
                    title="Learn more"
                    className="inline cursor-pointer text-link hover:underline"
                  >
                    Learn more
                  </ExternalLink>
                </span>
              </div>
            </DefaultPopoverContainer>
          </Popover>
        )}
      </>
    );
  },
);

FollowsDisabledDetails.displayName = 'FollowsDisabledDetails';

export { FollowsDisabledDetails };
