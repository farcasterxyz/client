import { FC, memo, ReactNode } from 'react';

type PageDisclaimersProps = {
  children: ReactNode;
};

const PageDisclaimers: FC<PageDisclaimersProps> = memo(({ children }) => {
  return (
    <div className="flex items-center justify-center border-b py-2 text-sm text-muted bg-overlay-faint border-default">
      {children}
    </div>
  );
});

export { PageDisclaimers };
