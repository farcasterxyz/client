import classNames from 'classnames';
import React from 'react';

import { Image } from '~/components/images/Image';
import { appPathPrefix } from '~/constants/routePrefixes';

export type UserDisplayNameStyle = 'base' | 'header' | 'details';

type ActiveBadgeProps = {
  style: UserDisplayNameStyle;
};

const ActiveBadge: React.FC<ActiveBadgeProps> = ({ style }) => {
  const iconSize = React.useMemo(
    () => (style === 'details' ? 24 : style === 'header' ? 14 : 12),
    [style],
  );

  return (
    <div
      className={classNames(
        'flex flex-shrink-0 items-center justify-center rounded-full text-active-badge',
        style === 'details'
          ? 'h-[24px] w-[24px]'
          : style === 'header'
            ? 'h-[16px] w-[16px]'
            : 'h-[14px] w-[14px]',
      )}
    >
      <Image
        alt="Active Badge"
        src={`${appPathPrefix}/images/ActiveBadge.png`}
        style={{
          width: iconSize,
          height: iconSize,
        }}
        className={classNames('object-contain')}
      />
    </div>
  );
};

export { ActiveBadge };
