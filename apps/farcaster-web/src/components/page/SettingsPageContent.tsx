import { ArrowLeftIcon } from '@primer/octicons-react';
import { FC, memo, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { appSettingsPathPrefix } from '~/constants/routePrefixes';
import { useNavigate } from '~/hooks/navigation/useNavigate';

type SettingsPageContentProps = {
  children: ReactNode;
};

const SettingsPageContent: FC<SettingsPageContentProps> = memo(
  ({ children }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isSettingsRoot = pathname === appSettingsPathPrefix;

    if (isSettingsRoot) {
      return (
        <div className="hidden w-full flex-col sm:flex">
          <div className="p-4">{children}</div>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col">
        <div
          className="flex cursor-pointer flex-row items-center gap-2 border-b px-4 py-3 border-default sm:hidden"
          onClick={() => navigate({ to: 'settings', params: {} })}
        >
          <ArrowLeftIcon size={20} />
          <span className="text-base font-semibold text-default">Settings</span>
        </div>
        <div className="p-4">{children}</div>
      </div>
    );
  },
);

SettingsPageContent.displayName = 'SettingsPageContent';

export { SettingsPageContent };
