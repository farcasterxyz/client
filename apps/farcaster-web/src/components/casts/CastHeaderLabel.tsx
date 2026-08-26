import {
  FeedHeartIcon,
  NorthStarIcon,
  PeopleIcon,
  PinIcon,
  SyncIcon,
} from '@primer/octicons-react';
import React from 'react';

type CastHeaderLabelProps = {
  isFocusedCast: boolean;
  iconType: 'highlight' | 'recast' | 'pin' | 'people';
  children: React.ReactNode;
};

const CastHeaderLabel: React.FC<CastHeaderLabelProps> = ({
  isFocusedCast,
  iconType,
  children,
}) => {
  const Icon = React.useMemo(() => {
    switch (iconType) {
      case 'highlight':
        return NorthStarIcon;
      case 'recast':
        return SyncIcon;
      case 'pin':
        return PinIcon;
      case 'people':
        return PeopleIcon;
      default:
        return FeedHeartIcon;
    }
  }, [iconType]);

  // Per: https://notion.so
  // We are not suppose to render a header on focused casts.
  // We are not (shouldn't be) calling this component from focused cast.
  // This will guarantee we won't bypass this requirement before checking
  // the spec and updating.
  if (isFocusedCast) {
    return null;
  }

  return (
    <div className="flex flex-row items-center">
      <div className="flex size-9 flex-row items-center justify-center rounded-full bg-overlay-light">
        <Icon size={18} className={'text-faint'} />
      </div>
      <div className="ml-2 text-base text-muted">{children}</div>
    </div>
  );
};

export { CastHeaderLabel };
