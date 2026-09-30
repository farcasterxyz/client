import { FC, memo } from 'react';

type AppsSectionHeaderProps = {
  title: string;
  dateRange: string;
  subtitle?: string;
};

const AppsSectionHeader: FC<AppsSectionHeaderProps> = memo(
  ({ title, dateRange, subtitle }) => {
    if (!title && !dateRange) {
      return null;
    }
    return (
      <div className="flex flex-col gap-2 px-4 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-default">{title}</h2>
          <span className="text-sm text-tertiary">{dateRange}</span>
        </div>
        {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
      </div>
    );
  },
);

AppsSectionHeader.displayName = 'AppsSectionHeader';

export { AppsSectionHeader };
