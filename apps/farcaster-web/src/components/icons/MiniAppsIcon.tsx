import { FC } from 'react';

interface MiniAppsIconProps {
  size: number;
  color: string;
  fill?: boolean;
  strokeWidth?: 1.75 | 2;
}

// From Lucide, layout-grid, with custom fill ability
const MiniAppsIcon: FC<MiniAppsIconProps> = ({
  size,
  color,
  fill = false,
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
};

MiniAppsIcon.displayName = 'MiniAppsIcon';

export { MiniAppsIcon };
