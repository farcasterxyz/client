import { FC, memo } from 'react';

type Size = 'xs' | 'sm' | 'md' | 'lg';

type FilledLogoProps = {
  size?: Size;
  fill?: string;
};

const sizeCn: Record<Size, string> = {
  xs: '24',
  sm: '32',
  md: '42',
  lg: '64',
};

const FilledLogo: FC<FilledLogoProps> = memo(({ size = 'sm' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={sizeCn[size]}
      height={sizeCn[size]}
      viewBox="0 0 1080 1080"
      fill="none"
    >
      <rect width="1080" height="1080" rx="120" fill="#6A3CFF" />
      <path
        d="M847.387 270V343.023H774.425V415.985H796.779V416.01H847.387V810.795H725.173L725.099 810.434L662.737 515.101C656.791 486.949 641.232 461.477 618.927 443.362C596.623 425.248 568.527 415.275 539.818 415.275H539.575C510.866 415.275 482.77 425.248 460.466 443.362C438.161 461.477 422.602 486.958 416.657 515.101L354.223 810.795H232V416.001H282.608V415.985H304.959V343.023H232V270H847.387Z"
        fill="white"
      />
    </svg>
  );
});

FilledLogo.displayName = 'FilledLogo';

export { FilledLogo };
