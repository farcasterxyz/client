import { FC, memo, ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
};

const Container: FC<ContainerProps> = memo(({ children }) => {
  return (
    <div className="mx-auto min-h-full xl:container">
      <div className="mx-auto flex min-h-screen flex-row justify-center px-4">
        {children}
      </div>
    </div>
  );
});

Container.displayName = 'Container';

export { Container };
