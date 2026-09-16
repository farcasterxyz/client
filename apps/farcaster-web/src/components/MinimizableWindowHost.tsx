import * as React from 'react';

import { FloatingResumeCastButton } from '~/components/composer/FloatingResumeCastButton';
import { MiniApp } from '~/components/miniApp/MiniApp';
import { FloatingWallet } from '~/components/rightSidebar/FloatingWallet';
import { useLaunchMiniApp } from '~/contexts/MiniAppProvider';
import { useMinimizableWindowContext } from '~/contexts/MinimizableWindowProvider';
import { useWalletGeoRestricted } from '~/hooks/data/useWalletGeoRestricted';
import { useSearchParams } from '~/hooks/navigation/useSearchParams';
import { lazyWithPreload } from '~/lazy/helpers';
import { cn } from '~/lib/utils';

export type MinimizableWindowHostVariant =
  | 'sidebar'
  | 'screen-right'
  | 'direct-casts';

const LazySpaceMiniPlayer = lazyWithPreload(() =>
  import('~/components/spaces/SpaceMiniPlayer').then((m) => ({
    default: m.SpaceMiniPlayer,
  })),
);

function MinimizableWindowHost({
  variant,
}: {
  variant: MinimizableWindowHostVariant;
}) {
  const { miniAppParams } = useLaunchMiniApp();
  const { miniAppMinimized, launchMiniApp, dismissMiniApp } =
    useMinimizableWindowContext();
  const geoRestricted = useWalletGeoRestricted();

  const homeFeedSearchParams = useSearchParams('homeFeed');
  const launchFrameUrl = homeFeedSearchParams?.launchFrameUrl;
  const initialFrameLaunchedRef = React.useRef(false);
  React.useEffect(() => {
    if (!launchFrameUrl || initialFrameLaunchedRef.current) {
      return;
    }
    initialFrameLaunchedRef.current = true;
    launchMiniApp({
      launchConfig: {
        type: 'manifest',
        url: launchFrameUrl,
      },
      context: {
        type: 'launcher',
      },
    });
  }, [launchMiniApp, launchFrameUrl]);

  return (
    <div
      className={cn([
        'pointer-events-none fixed bottom-4 z-10 flex w-auto flex-col items-end gap-3',
        'transition-all duration-300 ease-in-out',
        'max-h-[calc(100vh-1rem)] pt-3',
        {
          'right-4 xl:bottom-0 xl:max-h-screen': variant !== 'direct-casts',
          'right-[calc(100%-48px-1rem)] items-start dcxl:right-4 dcxl:items-end':
            variant === 'direct-casts',
          'xl:right-auto xl:w-[393px]': variant === 'sidebar',
        },
      ])}
    >
      {miniAppParams && !miniAppMinimized ? <FloatingResumeCastButton /> : null}
      <div
        className={cn([
          'transition-all duration-300 ease-in-out',
          'w-[48px]',
          'rounded-xl',
          'pointer-events-auto bg-swap',
          'flex min-h-[48px] shrink flex-col',
          {
            'w-[393px]': !miniAppMinimized,
            'xl:w-[393px]': variant !== 'direct-casts',
            'mr-[-337px] dcxl:mr-0':
              variant === 'direct-casts' && !miniAppMinimized,
            hidden: !miniAppParams,
          },
        ])}
      >
        <MiniApp
          launchConfig={miniAppParams?.launchConfig}
          context={miniAppParams?.context}
          debug={miniAppParams?.debug}
          onClose={dismissMiniApp}
          alwaysShowAsIcon={variant === 'direct-casts'}
        />
      </div>
      <React.Suspense fallback={null}>
        <LazySpaceMiniPlayer compact={variant === 'direct-casts'} />
      </React.Suspense>
      {!geoRestricted && <FloatingWallet variant={variant} />}
    </div>
  );
}

export { MinimizableWindowHost };
