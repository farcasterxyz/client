import { FC, memo, ReactNode } from 'react';

type RightSideBarProps = {
  as?: React.ElementType;
  children: ReactNode;
};
const RightSideBar: FC<RightSideBarProps> = memo(
  ({ as: Component = 'aside', children }) => {
    return (
      <Component className="sticky top-0 hidden h-screen shrink-0 grow flex-col gap-3 pt-3 mdlg:flex mdlg:max-w-[393px]">
        {children}
      </Component>
    );
  },
);

RightSideBar.displayName = 'RightSideBar';

export { RightSideBar };
