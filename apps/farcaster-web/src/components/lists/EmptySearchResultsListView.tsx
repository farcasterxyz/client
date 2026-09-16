import React, { FC, memo } from 'react';

import { Image } from '~/components/images/Image';
import { appPathPrefix } from '~/constants/routePrefixes';
import { useIsDarkMode } from '~/hooks/useIsDarkMode';

type EmptySearchResultsListViewProps = {
  className?: string;
  message: string;
  subMessage?: string;
};

const EmptySearchResultsListView: FC<EmptySearchResultsListViewProps> = memo(
  ({ className, message, subMessage }) => {
    const isDarkMode = useIsDarkMode();

    const imageName = isDarkMode
      ? 'SearchSlashDark.png'
      : 'SearchSlashLight.png';
    return (
      <>
        <div
          className={`flex flex-col items-center justify-center p-4 ${className}`}
        >
          <Image
            src={`${appPathPrefix}/images/${imageName}`}
            alt={'Search error'}
            loading="lazy"
            className="pb-4 pr-2 pt-2"
          />
          <div className="grow">
            <p className="text-lg font-semibold">{message}</p>
          </div>
          {subMessage && (
            <div className="grow">
              <p className="text-faint">{subMessage}</p>
            </div>
          )}
        </div>
      </>
    );
  },
);

EmptySearchResultsListView.displayName = 'EmptySearchResultsListView';

export { EmptySearchResultsListView };
