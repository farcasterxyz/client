import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

import { AtomsButton } from '../Button';
import type { ButtonHierarchy, ButtonSize } from '../Button/types';

jest.mock('../../../../hooks', () => ({
  __esModule: true,
  useHaptics: () => ({
    triggerImpactAsync: jest.fn(),
    triggerMediumImpactAsync: jest.fn(),
    triggerSuccessNotificationAsync: jest.fn(),
    triggerHeavyImpactAsync: jest.fn(),
    triggerLightImpactAsync: jest.fn(),
  }),
}));

const MockIcon = ({ size, color }: { size: number; color: string }) => (
  <View
    testID="mock-icon"
    style={{ width: size, height: size, backgroundColor: color }}
  />
);

describe('<AtomsButton />', () => {
  const hierarchies: ButtonHierarchy[] = [
    'primary',
    'secondary',
    'tertiary',
    'overlay',
    'translucent',
    'danger',
  ];

  const sizes: ButtonSize[] = ['xs', 's', 'm', 'l'];

  test.each(hierarchies)(
    'renders hierarchy "%s" with default props',
    (hierarchy) => {
      const tree = render(
        <AtomsButton hierarchy={hierarchy}>Test Button</AtomsButton>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    },
  );

  test.each(sizes)('renders size "%s" with text', (size) => {
    const tree = render(
      <AtomsButton size={size}>Sized Button</AtomsButton>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('renders with an icon', () => {
    const tree = render(
      <AtomsButton Icon={MockIcon}>Icon Button</AtomsButton>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('renders loading state replacing content with loader', () => {
    const tree = render(
      <AtomsButton loading hierarchy="secondary">
        Loading Button
      </AtomsButton>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('renders disabled state with icon and text', () => {
    const tree = render(
      <AtomsButton disabled Icon={MockIcon} hierarchy="danger">
        Disabled Danger Button
      </AtomsButton>,
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });

  it('exposes static subcomponents', () => {
    expect(AtomsButton.Icon).toBeDefined();
    expect(AtomsButton.Text).toBeDefined();
    expect(AtomsButton.Content).toBeDefined();
    expect(AtomsButton.Container).toBeDefined();
  });

  describe('static subcomponents', () => {
    it('composes Container, Content, Icon, and Text', () => {
      const tree = render(
        <AtomsButton.Container hierarchy="secondary" hasIcon hasText size="m">
          <AtomsButton.Content hierarchy="secondary">
            <AtomsButton.Icon Icon={MockIcon} hierarchy="secondary" size="m" />
            <AtomsButton.Text hierarchy="secondary" size="m">
              Secondary Button
            </AtomsButton.Text>
          </AtomsButton.Content>
        </AtomsButton.Container>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('renders Container subcomponent with icon-only content', () => {
      const tree = render(
        <AtomsButton.Container
          hierarchy="translucent"
          hasIcon
          hasText={false}
          size="s"
        >
          <AtomsButton.Content hierarchy="translucent">
            <AtomsButton.Icon
              Icon={MockIcon}
              hierarchy="translucent"
              size="s"
            />
          </AtomsButton.Content>
        </AtomsButton.Container>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('renders loading content via Content subcomponent', () => {
      const tree = render(
        <AtomsButton.Content hierarchy="primary" loading>
          <AtomsButton.Text hierarchy="primary" size="s">
            Hidden Text
          </AtomsButton.Text>
        </AtomsButton.Content>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('renders Content subcomponent with children when not loading', () => {
      const tree = render(
        <AtomsButton.Content hierarchy="tertiary">
          <AtomsButton.Text hierarchy="tertiary" size="l">
            Visible Text
          </AtomsButton.Text>
        </AtomsButton.Content>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('renders Icon subcomponent with disabled styles', () => {
      const tree = render(
        <AtomsButton.Icon
          Icon={MockIcon}
          hierarchy="primary"
          size="s"
          disabled
        />,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });

    it('renders Text subcomponent with hierarchy and size', () => {
      const tree = render(
        <AtomsButton.Text hierarchy="secondary" size="xs">
          Text Label
        </AtomsButton.Text>,
      ).toJSON();

      expect(tree).toMatchSnapshot();
    });
  });
});
