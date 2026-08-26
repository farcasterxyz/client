import React, { FC, memo } from 'react';
import {
  Platform,
  Switch as SwitchRN,
  SwitchProps as SwitchPropsRN,
} from 'react-native';

import { useTheme } from '../../contexts/ThemeContext';

type SwitchProps = Pick<
  SwitchPropsRN,
  'disabled' | 'onValueChange' | 'style' | 'value'
> & {
  newColors?: boolean;
};

const Switch: FC<SwitchProps> = memo((props) => {
  const t = useTheme();

  if (Platform.OS === 'web') {
    return <WebSwitch {...props} />;
  }

  return (
    <SwitchRN
      {...props}
      ios_backgroundColor={t.colors.bgHover}
      thumbColor={t.colors.text.light}
      trackColor={{
        false: t.colors.bgHover,
        true: t.colors.actionPrimary,
      }}
    />
  );
});

const SwitchV2: FC<SwitchProps> = memo((props) => {
  const t = useTheme();

  if (Platform.OS === 'web') {
    return <WebSwitch {...props} />;
  }

  return (
    <SwitchRN
      {...props}
      ios_backgroundColor={t.colors.background.secondary}
      thumbColor={t.colors.text.light}
      trackColor={{
        false: t.colors.background.tertiary,
        true: t.colors.text.brand,
      }}
    />
  );
});

Switch.displayName = 'Switch';
SwitchV2.displayName = 'SwitchV2';

export { Switch, SwitchV2 };

const WebSwitch: FC<SwitchProps> = memo((props) => {
  const t = useTheme();

  // Determine colors based on newColors prop, matching the RN component
  const trackColorFalse = props.newColors
    ? t.colors.bgHover
    : t.dark
      ? t.colors.mortar
      : t.colors.gallery;
  const trackColorTrue = props.newColors
    ? t.colors.actionPrimary
    : t.colors.minsk;
  const thumbColor = props.newColors ? t.colors.text.light : t.colors.gallery;

  // Style the switch to match the expected design
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    height: '24px',
    width: '44px',
    flexShrink: 0,
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    borderRadius: '9999px',
    border: '2px solid transparent',
    backgroundColor: props.value ? trackColorTrue : trackColorFalse,
    transition: 'background-color 200ms ease-in-out',
    opacity: props.disabled ? 0.5 : 1,
  };

  const thumbStyle: React.CSSProperties = {
    pointerEvents: 'none',
    display: 'inline-block',
    height: '24px',
    width: '24px',
    transform: `translateX(${props.value ? '20px' : '0px'})`,
    borderRadius: '9999px',
    backgroundColor: thumbColor,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    transition: 'transform 200ms ease-in-out',
  };

  // Handle click event
  const handleClick = () => {
    if (!props.disabled && props.onValueChange) {
      props.onValueChange(!props.value);
    }
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      role="switch"
      aria-checked={props.value}
    >
      <span style={thumbStyle} aria-hidden="true" />
    </div>
  );
});

WebSwitch.displayName = 'Switch';

export { WebSwitch };
