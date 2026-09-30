import cn from 'classnames';
import { ApiLocation } from 'farcaster-client-data';
import { FC, memo, MouseEvent } from 'react';

type LocationProps = {
  className?: string;
  location: ApiLocation;
  onClick?: (e: MouseEvent) => void;
};

const Location: FC<LocationProps> = memo(({ className, location, onClick }) => {
  return (
    <div className={cn('p-2', className)} onClick={onClick}>
      {location.description}
    </div>
  );
});

Location.displayName = 'Location';

export { Location };
