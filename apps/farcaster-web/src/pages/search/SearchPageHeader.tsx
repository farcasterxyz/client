import { FC, memo } from 'react';

import { Link } from '~/components/links/Link';
import { Tab } from '~/components/tabs/Tab';
import { Tabs } from '~/components/tabs/Tabs';
import { SearchTab } from '~/types';

type SearchPageHeaderProps = {
  focusedTab: SearchTab;
  q: string;
};

const SearchPageHeader: FC<SearchPageHeaderProps> = memo(
  ({ focusedTab, q }) => {
    return (
      <Tabs>
        <Link
          title={`Casts found based on your search`}
          to="top"
          params={{}}
          searchParams={{ q }}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'top'}>Top</Tab>
        </Link>
        <Link
          title={`Mini apps found based on your search`}
          to="searchMiniApps"
          params={{}}
          searchParams={{ q }}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'miniApps'}>Mini Apps</Tab>
        </Link>
        <Link
          title={`Recent casts found based on your search`}
          to="recent"
          params={{}}
          searchParams={{ q }}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'recent'}>Recent</Tab>
        </Link>
        <Link
          title={`Channels found based on your search`}
          to="searchChannels"
          params={{}}
          searchParams={{ q }}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'channels'}>Channels</Tab>
        </Link>
        <Link
          title={`Users found based on your search`}
          to="searchUsers"
          params={{}}
          searchParams={{ q }}
          className="flex size-full items-center justify-center text-inherit"
        >
          <Tab isFocused={focusedTab === 'users'}>Users</Tab>
        </Link>
      </Tabs>
    );
  },
);

SearchPageHeader.displayName = 'SearchPageHeader';

export { SearchPageHeader };
