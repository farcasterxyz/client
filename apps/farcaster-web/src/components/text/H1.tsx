import { FC, ReactNode } from 'react';

interface H1Props {
  children: ReactNode;
}

const H1: FC<H1Props> = ({ children }) => {
  return <h1 className="mb-5 text-2xl font-bold text-default">{children}</h1>;
};

H1.displayName = 'H1';

export { H1 };
