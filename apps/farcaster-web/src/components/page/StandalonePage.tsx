import { ArrowRightIcon } from '@primer/octicons-react';
import { FC, memo, ReactNode } from 'react';

import { ExternalLink } from '~/components/links/ExternalLink';
import { Link } from '~/components/links/Link';
import { Logo } from '~/components/Logo';
import { PageMeta, PageMetaProps } from '~/components/page/PageMeta';
import { ScrollToTop } from '~/components/scroll/ScrollToTop';

type StandAlonePageProps = {
  children: ReactNode;
  meta: PageMetaProps;
};

const StandalonePage: FC<StandAlonePageProps> = memo(({ children, meta }) => {
  return (
    <>
      <PageMeta {...meta} />
      <ScrollToTop />
      <div className="mx-auto mb-5 max-w-screen-md px-0 md:px-5">
        <div className="flex w-full flex-row items-center justify-between border-b p-3 border-default md:px-0">
          <Logo size={'sm'} />
          <ExternalLink
            href={'https://farcaster.xyz'}
            title={'Go to Farcaster'}
          >
            <div className="flex flex-row items-center space-x-1 text-md text-muted">
              <span>Browse Farcaster</span>
              <ArrowRightIcon size={12} />
            </div>
          </ExternalLink>
        </div>
        <div className="w-full px-3 md:px-0">{children}</div>
        <div className="w-full border-t p-3 text-right text-sm text-gray-500 border-default md:px-0">
          <Link
            to="support"
            params={{}}
            searchParams={{}}
            title="Support"
            className="text-gray-500 hover:underline"
          >
            Support
          </Link>
          {' | '}
          <Link
            to="privacyPolicy"
            params={{}}
            searchParams={{}}
            title="Privacy Policy"
            className="text-gray-500 hover:underline"
          >
            Privacy
          </Link>
          {' | '}
          <Link
            to="termsOfUse"
            params={{}}
            searchParams={{}}
            title="Terms of Use"
            className="text-gray-500 hover:underline"
          >
            Terms
          </Link>
        </div>
      </div>
    </>
  );
});

StandalonePage.displayName = 'StandalonePage';

export { StandalonePage };
