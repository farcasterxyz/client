import { FC, memo } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg';

type LogoProps = {
  size?: Size;
  fill?: string;
};

const sizeCn: Record<Size, string> = {
  xs: '24',
  sm: '32',
  md: '42',
  lg: '64',
};

const Logo: FC<LogoProps> = memo(({ size = 'sm', fill = '#6A3CFF' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeCn[size]}
      height={sizeCn[size]}
      viewBox="0 0 600 526"
      fill="none"
    >
      <path
        d="M600 0V71.0256H528.863V141.991H550.658V142.015H600V526H480.842L480.769 525.649L419.967 238.396C414.17 211.014 398.999 186.239 377.253 168.619C355.506 151 328.113 141.301 300.122 141.301H299.884C271.893 141.301 244.5 151 222.753 168.619C201.007 186.239 185.836 211.023 180.039 238.396L119.167 526H0V142.006H49.3425V141.991H71.1343V71.0256H0V0H600Z"
        fill={fill}
      />
    </svg>
  );
});

Logo.displayName = 'Logo';

export { Logo };
