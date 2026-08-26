import { FC, ReactNode } from 'react';

interface H2Props {
  children: ReactNode;
}

const H2: FC<H2Props> = ({ children }) => {
  return <h2 className="my-5 text-lg font-bold text-default">{children}</h2>;
};

H2.displayName = 'H2';

export { H2 };
