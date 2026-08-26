import cn from 'classnames';
import { AnalyticsEvent } from 'farcaster-analytics';
import { SearchIcon, XIcon } from 'lucide-react';
import React, { FC, memo, ReactNode, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useLocation } from 'react-router-dom';

import { ComposeCastButton } from '~/components/forms/buttons/ComposeCastButton';
import { Search } from '~/components/search/Search';
import { useAnalytics } from '~/contexts/AnalyticsProvider';
import { useCastComposerSession } from '~/contexts/CastComposerSessionProvider';
import { useIsSignedIn } from '~/hooks/data/useIsSignedIn';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { CastComposerIntent, ComposeSearchParams } from '~/types';
type PageHeaderProps = {
  hideCastButton?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  hideBorderBottom?: boolean;
  composeSearchParams?: ComposeSearchParams;
  composerDefaultIntent?: CastComposerIntent;
  visibleOnMobile?: boolean;
  renderAlternateActionButton?: ({
    userIsSignedIn,
  }: {
    userIsSignedIn: boolean;
  }) => React.ReactNode;
  showBack?: boolean;
  dynamicFooterHeight?: boolean;
  iconRight?: React.ReactNode;
};

const PageHeader: FC<PageHeaderProps> = memo(
  ({
    children,
    footer,
    hideCastButton = false,
    hideBorderBottom = false,
    visibleOnMobile = false,
    composeSearchParams,
    composerDefaultIntent,
    renderAlternateActionButton,
    dynamicFooterHeight = false,
    iconRight,
  }) => {
    const isSignedIn = useIsSignedIn();
    const { trackEvent } = useAnalytics();
    const navigate = useNavigate();
    const location = useLocation();
    const { hasBackgroundedSession, openComposer, resumeComposer } =
      useCastComposerSession();

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    React.useEffect(() => {
      setIsSearchOpen(false);
    }, [location.pathname]);

    const intent = React.useMemo(() => {
      if (typeof composeSearchParams !== 'undefined') {
        return composeSearchParams;
      }
      return composerDefaultIntent;
    }, [composeSearchParams, composerDefaultIntent]);

    useHotkeys('n', () => {
      if (hasBackgroundedSession) {
        resumeComposer();
        return;
      }

      if (!hideCastButton) {
        openComposer({
          intent,
          isIntentFromSearchParams: !!composeSearchParams,
          onClose: () => {
            if (typeof composeSearchParams !== 'undefined') {
              navigate({ to: 'homeFeed', params: {} });
            }
          },
        });
      }
    });

    React.useEffect(() => {
      if (typeof composeSearchParams !== 'undefined') {
        openComposer({
          intent: composeSearchParams,
          isIntentFromSearchParams: true,
          onClose: () => {
            navigate({ to: 'homeFeed', params: {} });
          },
        });
      }

      return undefined;
    }, [composeSearchParams, navigate, openComposer]);

    return (
      <nav
        className={cn(
          'sticky top-0 z-10 flex-col border-b-0 bg-app border-default',
          typeof footer !== 'undefined' && !dynamicFooterHeight
            ? 'h-14 sm:h-28'
            : 'sm:border-b',
          hideBorderBottom && 'sm:border-b-0',
        )}
      >
        <div
          className={cn(
            visibleOnMobile ? 'flex px-4' : 'hidden sm:flex sm:px-4',
            'h-14 flex-row items-center justify-between',
          )}
        >
          {isSearchOpen ? (
            <>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="flex shrink-0 items-center justify-center rounded-lg p-1.5 hover:bg-overlay-faint"
                aria-label="Close search"
              >
                <XIcon size={18} className="text-default" />
              </button>
              <div className="flex-1 px-2">
                <Search showClearIcon autoFocus />
              </div>
            </>
          ) : (
            <>
              {children}
              <div className="hidden flex-row items-center space-x-2 sm:flex">
                {typeof renderAlternateActionButton === 'function' &&
                  renderAlternateActionButton({ userIsSignedIn: isSignedIn })}
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex items-center justify-center rounded-lg p-1.5 hover:bg-overlay-faint mdlg:hidden"
                  aria-label="Search"
                >
                  <SearchIcon size={18} className="text-default" />
                </button>
                {isSignedIn && (!hideCastButton || hasBackgroundedSession) && (
                  <ComposeCastButton
                    onClick={() => {
                      if (hasBackgroundedSession) {
                        resumeComposer();
                        return;
                      }

                      trackEvent(AnalyticsEvent.AddCastModalShown, undefined);
                      openComposer({
                        intent,
                        isIntentFromSearchParams: !!composeSearchParams,
                        onClose: () => {
                          if (typeof composeSearchParams !== 'undefined') {
                            navigate({ to: 'homeFeed', params: {} });
                          }
                        },
                      });
                    }}
                  >
                    {hasBackgroundedSession ? 'Resume' : 'Cast'}
                  </ComposeCastButton>
                )}
              </div>
              {typeof iconRight !== 'undefined' && iconRight}
            </>
          )}
        </div>
        {/* TODO: We need to handle the small screen and footers better. */}
        {footer && <div>{footer}</div>}
      </nav>
    );
  },
);

PageHeader.displayName = 'PageHeader';

export { PageHeader };
