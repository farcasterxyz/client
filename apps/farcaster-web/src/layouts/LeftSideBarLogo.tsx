import { FC, memo } from 'react';

import { FilledLogo } from '~/components/FilledLogo';
import { LinkToHomeFeed } from '~/components/links/LinkToHomeFeed';
import { LogoBrandContextMenu } from '~/components/LogoBrandContextMenu';
import { useScrollToTopOfRoot } from '~/hooks/useScrollToTopOfRoot';

type LeftSideBarLogoProps = {
  title: string;
};

const LeftSideBarLogo: FC<LeftSideBarLogoProps> = memo(({ title }) => {
  const scrollToTopOfRoot = useScrollToTopOfRoot();

  return (
    <LogoBrandContextMenu>
      <LinkToHomeFeed
        title={title}
        className="mx-1 flex items-center "
        onClick={() => {
          scrollToTopOfRoot();
        }}
      >
        <div className="flex h-14 flex-col items-center justify-center md:items-start">
          <FilledLogo size="xs" />
        </div>
      </LinkToHomeFeed>
    </LogoBrandContextMenu>
  );
});

LeftSideBarLogo.displayName = 'LeftSideBarLogo';

export { LeftSideBarLogo };
