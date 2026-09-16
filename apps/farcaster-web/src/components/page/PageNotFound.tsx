import { FileIcon, XIcon } from '@primer/octicons-react';
import React, { FC } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { BackButton } from '~/components/forms/buttons/BackButton';
import { Page } from '~/components/page/Page';
import { PageHeader } from '~/components/page/PageHeader';
import { PageTitle } from '~/components/page/PageTitle';

interface PageNotFoundProps {
  title: string;
}

const PageNotFound: FC<PageNotFoundProps> = ({ title }) => {
  return (
    <Page meta={{ title }}>
      <BorderedMainContent>
        <PageHeader hideBorderBottom>
          <PageTitle>
            <BackButton />
          </PageTitle>
        </PageHeader>
        <div className="mt-4 flex items-center justify-center p-4 pt-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <FileIcon size={40} className="text-muted" />
              <XIcon
                size={20}
                className="absolute inset-0 m-auto pt-[6px] text-muted"
              />
            </div>
            <span className="text-normal font-normal leading-5 text-muted">
              This page does not exist.
            </span>
          </div>
        </div>
      </BorderedMainContent>
    </Page>
  );
};

export { PageNotFound };
