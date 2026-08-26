import { cn } from '~/lib/utils';

// Note: These labels will be removed in the future
export type TypographyLabelDeprecated =
  // Medium
  | 'Medium/XS'
  | 'Medium/S'
  | 'Medium/Base'
  | 'Medium/L'

  // Regular
  | 'Regular/Base'

  // Semibold
  | 'Semibold/S'
  | 'Semibold/Base'
  | 'Semibold/L'
  | 'Semibold/2XL'
  | 'Semibold/4XL';

export type TypographyLabel =
  | TypographyLabelDeprecated
  // Heading
  | 'Heading/Display'
  | 'Heading/ExtraLarge'
  | 'Heading/Large'
  | 'Heading/Medium'
  | 'Heading/Small'
  // Body
  | 'Body/ExtraLarge'
  | 'Body/ExtraLarge/Strong'
  | 'Body/Large'
  | 'Body/Large/Strong'
  | 'Body/Medium'
  | 'Body/Medium/Strong'
  | 'Body/Small'
  | 'Body/Small/Strong'
  | 'Body/ExtraSmall'
  | 'Body/ExtraSmall/Strong';

export const typography: {
  [key in TypographyLabel]: {
    className: string;
  };
} = {
  'Heading/Display': {
    className:
      'font-sans font-[450] text-[48px] tracking-[-0.03em] leading-[56px]',
  },
  'Heading/ExtraLarge': {
    className:
      'font-sans font-[550] text-[24px] leading-[32px] tracking-[-0.017em]',
  },
  'Heading/Large': {
    className:
      'font-sans font-[550] text-[20px] leading-[32px] tracking-[-0.017em]',
  },
  'Heading/Medium': {
    className:
      'font-sans font-[550] text-[15px] leading-[25px] tracking-[-0.005em]',
  },
  'Heading/Small': {
    className:
      'font-sans font-[550] text-[14px] leading-[22px] tracking-[-0.005em]',
  },
  'Body/ExtraLarge': {
    className:
      'font-sans font-[450] text-[15px] leading-[22px] tracking-[-0.0025em]',
  },
  'Body/ExtraLarge/Strong': {
    className:
      'font-sans font-[550] text-[15px] leading-[22px] tracking-[-0.0025em]',
  },
  'Body/Large': {
    className:
      'font-sans font-normal text-[15px] leading-[22px] tracking-[-0.0025em]',
  },
  'Body/Large/Strong': {
    className:
      'font-sans font-[550] text-[15px] leading-[22px] tracking-[-0.0025em]',
  },
  'Body/Medium': {
    className:
      'font-sans font-normal text-[14px] leading-[16px] tracking-[0.005em]',
  },
  'Body/Medium/Strong': {
    className:
      'font-sans font-[550] text-[14px] leading-[16px] tracking-[0.005em]',
  },
  'Body/Small': {
    className:
      'font-sans font-normal text-[13px] leading-[14px] tracking-[0.005em]',
  },
  'Body/Small/Strong': {
    className:
      'font-sans font-[550] text-[13px] leading-[14px] tracking-[0.005em]',
  },
  'Body/ExtraSmall': {
    className:
      'font-sans font-normal text-[12px] leading-[14px] tracking-[0.005em]',
  },
  'Body/ExtraSmall/Strong': {
    className:
      'font-sans font-[550] text-[12px] leading-[14px] tracking-[0.005em]',
  },
  // DEPRECATED
  'Medium/XS': {
    className: 'font-sans text-sm font-medium',
  },
  'Medium/S': {
    className: 'font-sans text-sm font-medium tracking-tight',
  },
  'Medium/Base': {
    className: 'font-sans text-base font-medium tracking-tight',
  },
  'Medium/L': {
    className: 'font-sans text-lg font-medium tracking-tight',
  },
  'Regular/Base': {
    className: 'font-sans text-base font-normal',
  },
  'Semibold/S': {
    className: 'font-sans text-sm font-semibold tracking-tight',
  },
  'Semibold/Base': {
    className: 'font-sans text-base font-semibold tracking-tight',
  },
  'Semibold/L': {
    className: 'font-sans text-lg font-semibold tracking-tight',
  },
  'Semibold/2XL': {
    className: 'font-sans text-2xl font-semibold',
  },
  'Semibold/4XL': {
    className: 'font-sans text-4xl font-semibold',
  },
};

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'quaternary'
  | 'inverted'
  | 'danger'
  | 'success'
  | 'warning'
  | 'brand'
  | 'light';

type TypographyProps = {
  label: TypographyLabel;
  className?: string;
  color?: TextColor;
  children: React.ReactNode;
};

export const getColorClassName = (color: TextColor) => {
  return `text-${color}`;
};

export function Typography({
  label,
  color = 'primary',
  ...otherProps
}: TypographyProps) {
  const colorClassName = getColorClassName(color);

  const typographyClassName = typography[label].className;
  const className = cn(
    typographyClassName,
    colorClassName,
    otherProps.className,
  );

  return <div {...otherProps} className={className} />;
}

export type HeadingLabels =
  | 'Display'
  | 'ExtraLarge'
  | 'Large'
  | 'Medium'
  | 'Small';

const headingLabelToTypographyLabel = (
  label: HeadingLabels,
): TypographyLabel => {
  return `Heading/${label}` as TypographyLabel;
};

export type HeadingProps = Omit<TypographyProps, 'label'> & {
  label: HeadingLabels;
};

export const TypographyHeading = ({ label, ...otherProps }: HeadingProps) => {
  return (
    <Typography label={headingLabelToTypographyLabel(label)} {...otherProps} />
  );
};

export type BodyLabels =
  | 'ExtraLarge'
  | 'ExtraLarge/Strong'
  | 'Large'
  | 'Large/Strong'
  | 'Medium'
  | 'Medium/Strong'
  | 'Small'
  | 'Small/Strong'
  | 'ExtraSmall'
  | 'ExtraSmall/Strong';

const bodyLabelToTypographyLabel = (label: BodyLabels): TypographyLabel => {
  return `Body/${label}` as TypographyLabel;
};

export type BodyProps = Omit<TypographyProps, 'label'> & {
  label: BodyLabels;
};

export const TypographyBody = ({ label, ...otherProps }: BodyProps) => {
  return (
    <Typography label={bodyLabelToTypographyLabel(label)} {...otherProps} />
  );
};
