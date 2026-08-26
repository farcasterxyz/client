import { render } from '@testing-library/react-native';
import React from 'react';

import type { TypographyLabel } from '../../../../theme/typography/typography';
import { Typography } from '../Typography';

const headingLabels: TypographyLabel[] = [
  'Heading/Display',
  'Heading/ExtraLarge',
  'Heading/Large',
  'Heading/Medium',
  'Heading/Small',
];

const bodyLabels: TypographyLabel[] = [
  'Body/ExtraLarge',
  'Body/ExtraLarge/Strong',
  'Body/Large',
  'Body/Large/Strong',
  'Body/Medium',
  'Body/Medium/Strong',
  'Body/Small',
  'Body/Small/Strong',
  'Body/ExtraSmall',
  'Body/ExtraSmall/Strong',
];

const allLabels: TypographyLabel[] = [...headingLabels, ...bodyLabels];

describe('<Typography />', () => {
  test.each(allLabels)(
    'Typography with label "%s" renders correctly',
    (label) => {
      const tree = render(
        <Typography label={label} color="primary">
          Hello, world!
        </Typography>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    },
  );
});
