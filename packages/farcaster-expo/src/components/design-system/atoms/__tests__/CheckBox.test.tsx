import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import { ThemeContext } from '../../../../contexts/ThemeContext';
import { getTheme } from '../../../../theme';
import type { AppThemeName } from '../../../../theme/AppThemeNames';
import { CheckBox } from '../CheckBox';

const renderCheckBox = ({
  isChecked,
  scheme,
  toggleIsChecked = jest.fn(),
}: {
  isChecked: boolean;
  scheme: AppThemeName;
  toggleIsChecked?: () => void;
}) => {
  const theme = getTheme(scheme);
  const result = render(
    <ThemeContext.Provider value={theme}>
      <CheckBox isChecked={isChecked} toggleIsChecked={toggleIsChecked} />
    </ThemeContext.Provider>,
  );

  const indicator = result.getByTestId('checkbox-indicator');
  const indicatorStyle = StyleSheet.flatten(indicator.props.style);

  return { ...result, indicatorStyle, theme };
};

describe('<CheckBox />', () => {
  test.each<AppThemeName>(['light', 'dark'])(
    'renders a high-contrast unchecked state in %s mode',
    (scheme) => {
      const { indicatorStyle, theme } = renderCheckBox({
        isChecked: false,
        scheme,
      });

      expect(indicatorStyle).toMatchObject({
        borderWidth: 2,
        borderColor: theme.colors.text.secondary,
        backgroundColor: theme.colors.bgInput,
      });
    },
  );

  test.each<AppThemeName>(['light', 'dark'])(
    'renders a high-contrast checked state in %s mode',
    (scheme) => {
      const { indicatorStyle, theme } = renderCheckBox({
        isChecked: true,
        scheme,
      });

      expect(indicatorStyle).toMatchObject({
        borderWidth: 2,
        borderColor: theme.colors.actionPrimary,
        backgroundColor: theme.colors.actionPrimary,
      });
    },
  );

  it('toggles when pressed', () => {
    const toggleIsChecked = jest.fn();
    const { getByRole } = renderCheckBox({
      isChecked: false,
      scheme: 'light',
      toggleIsChecked,
    });

    fireEvent.press(getByRole('checkbox'));

    expect(toggleIsChecked).toHaveBeenCalledTimes(1);
  });
});
