import React, { FC } from 'react';

import { Text2 } from './Text';

type ScreenTitleProps = {
  title: string;
  subtitle?: string;
};

const ScreenTitle: FC<ScreenTitleProps> = ({ title, subtitle }) => {
  return (
    <>
      <Text2 size="lg" weight="semibold" align="center">
        {title}
      </Text2>
      {subtitle && (
        <Text2 size="xl" color="secondary" align="center">
          {subtitle}
        </Text2>
      )}
    </>
  );
};

ScreenTitle.displayName = 'ScreenTitle';

export { ScreenTitle };
