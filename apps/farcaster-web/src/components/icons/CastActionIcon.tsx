import * as Octicons from '@primer/octicons-react';
import { SquareIcon } from '@primer/octicons-react';
import { FC } from 'react';

type CastActionIconProps = {
  iconName: string;
  size: number;
};

const CastActionIcon: FC<CastActionIconProps> = ({ iconName, size }) => {
  const toComponentName = (name: string) => {
    return (
      name
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') + 'Icon'
    );
  };

  const getIconComponentByName = (name: string): React.ElementType | null => {
    const componentName = toComponentName(name) as keyof typeof Octicons;
    const IconComponent = Octicons[componentName];
    return IconComponent || null;
  };
  const IconComponent = getIconComponentByName(iconName);

  if (!IconComponent) {
    return <SquareIcon size={size} className={'mx-0.5'} />;
  }

  return <IconComponent size={size} className={'mx-0.5'} />;
};

CastActionIcon.displayName = 'CastActionIcon';

export { CastActionIcon };
