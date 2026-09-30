import { FC, memo } from 'react';

import { Link } from '~/components/links/Link';

const SupportAndTermsLinks: FC = memo(() => (
  <div className="flex flex-row flex-wrap space-x-2 text-xs text-gray-500">
    <Link
      to="support"
      params={{}}
      searchParams={{}}
      title="Support"
      className="text-center text-secondary hover:underline"
    >
      Support
    </Link>
    <Link
      to="privacyPolicy"
      params={{}}
      searchParams={{}}
      title="Privacy Policy"
      className="text-center text-secondary hover:underline"
    >
      Privacy
    </Link>
    <Link
      to="termsOfUse"
      params={{}}
      searchParams={{}}
      title="Terms of Use"
      className="text-center text-secondary hover:underline"
    >
      Terms
    </Link>
    <Link
      to="developers"
      params={{}}
      searchParams={{}}
      title="Developers"
      className="min-w-0 text-center text-secondary hover:underline"
    >
      Developers
    </Link>
  </div>
));

SupportAndTermsLinks.displayName = 'SupportAndTermsLinks';

export { SupportAndTermsLinks };
