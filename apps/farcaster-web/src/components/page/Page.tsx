import cn from 'classnames';
import { FC, memo, ReactNode } from 'react';

import { FarcasterRedirectModal } from '~/components/modals/FarcasterRedirectModal';
import { PageMeta, PageMetaProps } from '~/components/page/PageMeta';
import { ScrollToTop } from '~/components/scroll/ScrollToTop';

type PageProps = {
  children: ReactNode;
  className?: string;
  meta: PageMetaProps;
};

const Page: FC<PageProps> = memo(({ children, className, meta }) => {
  const isWarpcastDomain =
    window.location.hostname === 'warpcast.com' ||
    window.location.hostname === 'web-stage.warpcast.com';

  return (
    <>
      <PageMeta {...meta} />
      <div className={cn('h-full w-full', className)}>
        <ScrollToTop />
        {children}
      </div>
      {isWarpcastDomain && <FarcasterRedirectModal />}
    </>
  );
});

Page.displayName = 'Page';

export { Page };
