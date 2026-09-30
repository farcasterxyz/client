import { ChevronRightIcon } from '@primer/octicons-react';
import { FC, memo } from 'react';

const SettingsNavLinkArrow: FC = memo(() => {
  return <ChevronRightIcon />;
});

SettingsNavLinkArrow.displayName = 'SettingsNavLinkArrow';

export { SettingsNavLinkArrow };
