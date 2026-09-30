import { FC, memo } from 'react';

import { BorderedMainContent } from '~/components/BorderedMainContent';
import { Link } from '~/components/links/Link';
import { Page } from '~/components/page/Page';

const DebugMenuPage: FC = memo(() => {
  return (
    <Page meta={{ title: 'Debug' }}>
      <BorderedMainContent>
        <div className="p-4">
          <ul>
            <li>
              <Link
                title="Debug casts"
                to="debugCasts"
                params={{}}
                searchParams={{}}
              >
                Debug Casts
              </Link>
            </li>
          </ul>
        </div>
      </BorderedMainContent>
    </Page>
  );
});

DebugMenuPage.displayName = 'DebugMenuPage';

export { DebugMenuPage };
