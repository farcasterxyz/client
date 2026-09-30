import React, { FC } from 'react';

import { SearchTab } from '~/types';

import { Search } from './Search';

type SearchHeaderProps = {
  q: string;
  focusedTab: SearchTab;
  showFilterIcon?: boolean;
  showClearIcon?: boolean;
};

const SearchHeader: FC<SearchHeaderProps> = ({
  q,
  focusedTab,
  showFilterIcon = false,
  showClearIcon = true,
}) => {
  return (
    <>
      <Search
        className="w-full"
        query={q}
        focusedTab={focusedTab}
        showFilterIcon={showFilterIcon}
        showClearIcon={showClearIcon}
      />
    </>
  );
};

SearchHeader.displayName = 'SearchHeader';

export { SearchHeader };
