import { cn } from '~/lib/utils';

import { TextColor, Typography, TypographyLabel } from './Typography';

export type ButtonType = 'rounded' | 'circle';

export type ButtonHierarchy =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'overlay'
  | 'translucent';

export type ButtonSize = 'xs' | 's' | 'm' | 'l';

export type ButtonProps = {
  children?: React.ReactNode;
  Icon?: ({
    size,
    disabled,
  }: {
    size: number;
    disabled?: boolean;
  }) => React.ReactNode;
  onPress?: () => void;
  type?: ButtonType;
  size?: ButtonSize;
  hierarchy?: ButtonHierarchy;
  disabled?: boolean;
};

const buttonSizeToTypographySize: Record<ButtonSize, TypographyLabel> = {
  xs: 'Semibold/S',
  s: 'Semibold/S',
  m: 'Semibold/S',
  l: 'Semibold/S',
};

const buttonHierarchyToTypographyColor: Record<ButtonHierarchy, TextColor> = {
  primary: 'light',
  secondary: 'primary',
  tertiary: 'primary',
  overlay: 'primary',
  translucent: 'brand',
};

const getButtonPadding = ({
  size,
  hasIcon,
  hasText,
  type,
}: {
  size: ButtonSize;
  hasIcon: boolean;
  hasText: boolean;
  type: ButtonType;
}) => {
  if (hasIcon && hasText) {
    switch (size) {
      case 'xs':
      case 's':
      case 'm':
        return `pl-2 pr-3`;
      case 'l':
        return `pl-3 pr-4`;
    }
  }
  if (hasIcon) {
    switch (size) {
      case 'xs':
        return `px-[7px]`;
      case 's':
        return `px-[9px]`;
      case 'm':
        return `px-[10px]`;
      case 'l':
        return `px-[14px]`;
    }
  }
  switch (size) {
    case 'xs':
    case 's':
    case 'm':
      return `px-3`;
    case 'l':
      if (type === 'rounded') {
        return `pl-[17px] pr-4`;
      }
      return `px-3`;
  }
};

const buttonSizeToIconSize: Record<ButtonSize, number> = {
  xs: 16,
  s: 16,
  m: 20,
  l: 20,
};

export type ButtonIconProps = {
  Icon: ({ size }: { size: number; disabled?: boolean }) => React.ReactNode;
  hierarchy: ButtonHierarchy;
  size: ButtonSize;
  disabled?: boolean;
};

const ButtonIcon = ({
  Icon,
  hierarchy,
  disabled = false,
  size,
}: ButtonIconProps) => {
  const color = buttonHierarchyToTypographyColor[hierarchy];
  const className = disabled ? `text-tertiary` : `text-${color}`;

  return (
    <div className={className + ' h-fit w-fit'}>
      {Icon({ size: buttonSizeToIconSize[size], disabled })}
    </div>
  );
};

ButtonIcon.displayName = 'ButtonIcon';

export type ButtonTextProps = {
  children: React.ReactNode;
  hierarchy: ButtonHierarchy;
  size: ButtonSize;
  disabled?: boolean;
};

const ButtonText = ({
  size,
  hierarchy,
  children,
  disabled = false,
}: ButtonTextProps) => {
  const label = buttonSizeToTypographySize[size];
  const color = disabled
    ? 'tertiary'
    : buttonHierarchyToTypographyColor[hierarchy];

  return (
    <Typography label={label} color={color}>
      {children}
    </Typography>
  );
};

ButtonText.displayName = 'ButtonText';

export type ButtonContainerProps = {
  children: React.ReactNode;
  type?: ButtonType;
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  hasIcon: boolean;
  hasText: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

const ButtonContainer = ({
  children,
  onPress,
  type = 'rounded',
  hierarchy = 'primary',
  size = 's',
  hasIcon = false,
  hasText = true,
  disabled = false,
}: ButtonContainerProps) => {
  const paddingClassNames = getButtonPadding({
    size,
    hasIcon,
    hasText,
    type,
  });

  return (
    <button
      disabled={disabled}
      onClick={onPress}
      className={cn(
        !disabled && 'cursor-pointer',
        'flex-shrink gap-3',
        paddingClassNames,
        // Border radius
        type === 'rounded' ? 'rounded-full' : 'rounded-[8px]',
        size === 'm' && type !== 'rounded' && 'rounded-[12px]',
        size === 'l' && type !== 'rounded' && 'rounded-[16px]',
        // Border
        hierarchy === 'tertiary' && 'border border-tertiary',
        hierarchy === 'overlay' && 'border border-primary',
        // Height
        size === 'xs' && 'h-[30px]',
        size === 's' && 'h-[34px]',
        size === 'm' && 'h-[40px]',
        size === 'l' && 'h-[48px]',
        // Background - normal state
        !disabled && hierarchy === 'primary' && 'bg-brand',
        !disabled && hierarchy === 'secondary' && 'bg-surface-secondary',
        !disabled && hierarchy === 'tertiary' && 'bg-primary',
        !disabled && hierarchy === 'overlay' && 'bg-primary/50',
        !disabled && hierarchy === 'translucent' && 'bg-brand-light',
        // Background - hover state
        !disabled && hierarchy === 'primary' && 'hover:bg-violet-700',
        !disabled && hierarchy === 'secondary' && 'hover:bg-tertiary',
        !disabled && hierarchy === 'tertiary' && 'hover:bg-tertiary',
        !disabled && hierarchy === 'overlay' && 'hover:bg-primary',
        !disabled && hierarchy === 'translucent' && 'hover:bg-brand-medium',
        // Background - disabled state
        disabled && hierarchy === 'primary' && 'bg-pale-violet-100',
        disabled && hierarchy === 'secondary' && 'bg-surface-secondary',
        disabled && hierarchy === 'tertiary' && 'bg-primary',
        disabled && hierarchy === 'overlay' && 'bg-primary/50',
        disabled && hierarchy === 'translucent' && 'bg-pale-violet-100',
      )}
    >
      {children}
    </button>
  );
};

ButtonContainer.displayName = 'ButtonContainer';

export type ButtonContentProps = {
  children: React.ReactNode;
};

const ButtonContent = ({ children }: ButtonContentProps) => {
  return (
    <div className="flex flex-1 flex-row items-center justify-center gap-1">
      {children}
    </div>
  );
};

ButtonContent.displayName = 'ButtonContent';

const Button = ({
  children,
  Icon,
  onPress,
  type,
  size = 's',
  hierarchy = 'primary',
  disabled = false,
}: ButtonProps) => {
  return (
    <ButtonContainer
      onPress={onPress}
      type={type}
      hasIcon={!!Icon}
      hasText={!!children}
      size={size}
      hierarchy={hierarchy}
      disabled={disabled}
    >
      <ButtonContent>
        {Icon && (
          <ButtonIcon
            Icon={Icon}
            hierarchy={hierarchy}
            disabled={disabled}
            size={size}
          />
        )}
        {children && (
          <ButtonText size={size} hierarchy={hierarchy} disabled={disabled}>
            {children}
          </ButtonText>
        )}
      </ButtonContent>
    </ButtonContainer>
  );
};

Button.displayName = 'Button';
Button.Icon = ButtonIcon;
Button.Text = ButtonText;
Button.Content = ButtonContent;
Button.Container = ButtonContainer;

export { Button as AtomsButton };
