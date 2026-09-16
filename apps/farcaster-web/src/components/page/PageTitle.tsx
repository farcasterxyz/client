import { FC, memo, ReactNode } from 'react';

type PageTitleProps = {
  children: ReactNode;
};

const PageTitle: FC<PageTitleProps> = memo(({ children }) => {
  return (
    <h2 className="font hidden flex-row items-center text-center text-xl font-bold decoration-0 sm:flex sm:text-left">
      {children}
    </h2>
  );
});

PageTitle.displayName = 'PageTitle';

export { PageTitle };
