import { FC, memo, ReactNode } from 'react';

type SettingsNavLinkLabelProps = {
  children: ReactNode;
};
const SettingsNavLinkLabel: FC<SettingsNavLinkLabelProps> = memo(
  ({ children }) => {
    return <span className="">{children}</span>;
  },
);

SettingsNavLinkLabel.displayName = 'SettingsNavLinkLabel';

export { SettingsNavLinkLabel };
